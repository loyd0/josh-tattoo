import { getSql } from "@/lib/db";
import type { ExistingVote, VoteStatus } from "@/lib/voting/duplicates";
import { pollPhase, type PollPhase } from "@/lib/voting/phase";

export type PollRecord = {
  id: string;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type BallotEntry = {
  id: string;
  fileUrl: string;
  contentType: string;
  explanation: string | null;
};

export type ResultEntry = BallotEntry & { votes: number };

export type StoredVote = ExistingVote & {
  id: string;
  voterName: string;
  email: string;
  userAgent: string | null;
  createdAt: string;
  verifiedAt: string | null;
  voidedAt: string | null;
};

export type ConfirmationVote = {
  id: string;
  status: VoteStatus;
  submissionId: string;
  voterName: string;
  endsAt: Date | null;
  fileUrl: string;
  contentType: string;
  explanation: string | null;
};

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function asStatus(value: unknown): VoteStatus {
  if (value === "counted" || value === "void" || value === "pending") return value;
  return "pending";
}

type PollRow = { id: string; starts_at: unknown; ends_at: unknown };

function mapPoll(row: PollRow): PollRecord {
  return {
    id: row.id,
    startsAt: asDate(row.starts_at),
    endsAt: asDate(row.ends_at),
  };
}

export async function getPoll(): Promise<PollRecord | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = getSql();
  const rows = (await sql`
    select id, starts_at, ends_at
    from polls
    order by created_at asc
    limit 1
  `) as unknown as PollRow[];
  const row = rows[0];
  return row ? mapPoll(row) : null;
}

export async function loadPollPhase(now = new Date()): Promise<{
  poll: PollRecord | null;
  phase: PollPhase;
}> {
  const poll = await getPoll();
  if (!poll) return { poll: null, phase: "submissions" };
  return { poll, phase: pollPhase(now, poll.startsAt, poll.endsAt) };
}

export async function ensurePoll(): Promise<PollRecord> {
  const existing = await getPoll();
  if (existing) return existing;
  const sql = getSql();
  const rows = (await sql`
    insert into polls (singleton)
    values (true)
    on conflict (singleton) do update set updated_at = polls.updated_at
    returning id, starts_at, ends_at
  `) as unknown as PollRow[];
  const row = rows[0];
  if (!row) throw new Error("Could not create the poll");
  return mapPoll(row);
}

export async function savePollWindow(
  pollId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<void> {
  const sql = getSql();
  await sql`
    update polls
    set starts_at = ${startsAt.toISOString()},
        ends_at = ${endsAt.toISOString()},
        updated_at = now()
    where id = ${pollId}
  `;
}

export async function listBallot(pollId: string): Promise<BallotEntry[]> {
  const sql = getSql();
  const rows = (await sql`
    select s.id, s.file_url, s.file_content_type, s.explanation
    from poll_entries pe
    join submissions s on s.id = pe.submission_id
    where pe.poll_id = ${pollId}
    order by pe.created_at asc
  `) as unknown as Array<{
    id: string;
    file_url: string;
    file_content_type: string;
    explanation: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    fileUrl: row.file_url,
    contentType: row.file_content_type,
    explanation: row.explanation,
  }));
}

export async function listResults(pollId: string): Promise<ResultEntry[]> {
  const sql = getSql();
  const rows = (await sql`
    select
      s.id,
      s.file_url,
      s.file_content_type,
      s.explanation,
      count(v.id) filter (where v.status = 'counted') as votes
    from poll_entries pe
    join submissions s on s.id = pe.submission_id
    left join votes v
      on v.poll_id = pe.poll_id
      and v.submission_id = pe.submission_id
    where pe.poll_id = ${pollId}
    group by s.id, s.file_url, s.file_content_type, s.explanation, pe.created_at
    order by pe.created_at asc
  `) as unknown as Array<{
    id: string;
    file_url: string;
    file_content_type: string;
    explanation: string | null;
    votes: number | string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    fileUrl: row.file_url,
    contentType: row.file_content_type,
    explanation: row.explanation,
    votes: Number(row.votes) || 0,
  }));
}

export async function listVoteSignals(pollId: string): Promise<ExistingVote[]> {
  const sql = getSql();
  const rows = (await sql`
    select email_key, submission_id, status, ip_hash, cookie_id, fingerprint_hash
    from votes
    where poll_id = ${pollId}
  `) as unknown as Array<{
    email_key: string;
    submission_id: string;
    status: string;
    ip_hash: string | null;
    cookie_id: string | null;
    fingerprint_hash: string | null;
  }>;
  return rows.map((row) => ({
    emailKey: row.email_key,
    submissionId: row.submission_id,
    status: asStatus(row.status),
    ipHash: row.ip_hash,
    cookieId: row.cookie_id,
    fingerprintHash: row.fingerprint_hash,
  }));
}

export async function listAdminVotes(pollId: string): Promise<StoredVote[]> {
  const sql = getSql();
  const rows = (await sql`
    select
      id, email_key, email, voter_name, submission_id, status,
      ip_hash, cookie_id, fingerprint_hash, user_agent,
      created_at, verified_at, voided_at
    from votes
    where poll_id = ${pollId}
    order by created_at desc
  `) as unknown as Array<{
    id: string;
    email_key: string;
    email: string;
    voter_name: string;
    submission_id: string;
    status: string;
    ip_hash: string | null;
    cookie_id: string | null;
    fingerprint_hash: string | null;
    user_agent: string | null;
    created_at: unknown;
    verified_at: unknown;
    voided_at: unknown;
  }>;
  return rows.map((row) => ({
    id: row.id,
    emailKey: row.email_key,
    email: row.email,
    voterName: row.voter_name,
    submissionId: row.submission_id,
    status: asStatus(row.status),
    ipHash: row.ip_hash,
    cookieId: row.cookie_id,
    fingerprintHash: row.fingerprint_hash,
    userAgent: row.user_agent,
    createdAt: asDate(row.created_at)?.toISOString() ?? "",
    verifiedAt: asDate(row.verified_at)?.toISOString() ?? null,
    voidedAt: asDate(row.voided_at)?.toISOString() ?? null,
  }));
}

export async function submissionOnBallot(
  pollId: string,
  submissionId: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    select 1 as ok
    from poll_entries
    where poll_id = ${pollId} and submission_id = ${submissionId}
    limit 1
  `) as unknown as Array<{ ok: number }>;
  return rows.length > 0;
}

export async function insertPendingVote(input: {
  pollId: string;
  submissionId: string;
  voterName: string;
  email: string;
  emailKey: string;
  tokenHash: string;
  ipHash: string | null;
  userAgent: string | null;
  cookieId: string;
  fingerprintHash: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    insert into votes (
      poll_id, submission_id, voter_name, email, email_key, status,
      verify_token_hash, ip_hash, user_agent, cookie_id, fingerprint_hash
    )
    values (
      ${input.pollId},
      ${input.submissionId},
      ${input.voterName},
      ${input.email},
      ${input.emailKey},
      'pending',
      ${input.tokenHash},
      ${input.ipHash},
      ${input.userAgent},
      ${input.cookieId},
      ${input.fingerprintHash}
    )
  `;
}

export async function rotateVoteToken(input: {
  pollId: string;
  emailKey: string;
  tokenHash: string;
}): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    update votes
    set verify_token_hash = ${input.tokenHash}
    where poll_id = ${input.pollId}
      and email_key = ${input.emailKey}
      and status = 'pending'
    returning id
  `) as unknown as Array<{ id: string }>;
  return rows.length > 0;
}

export async function findVoteByTokenHash(
  tokenHash: string,
): Promise<ConfirmationVote | null> {
  const sql = getSql();
  const rows = (await sql`
    select
      v.id, v.status, v.submission_id, v.voter_name, p.ends_at,
      s.file_url, s.file_content_type, s.explanation
    from votes v
    join polls p on p.id = v.poll_id
    join submissions s on s.id = v.submission_id
    where v.verify_token_hash = ${tokenHash}
    limit 1
  `) as unknown as Array<{
    id: string;
    status: string;
    submission_id: string;
    voter_name: string;
    ends_at: unknown;
    file_url: string;
    file_content_type: string;
    explanation: string | null;
  }>;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    status: asStatus(row.status),
    submissionId: row.submission_id,
    voterName: row.voter_name,
    endsAt: asDate(row.ends_at),
    fileUrl: row.file_url,
    contentType: row.file_content_type,
    explanation: row.explanation,
  };
}

export async function countVote(voteId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    update votes
    set status = 'counted', verified_at = now()
    where id = ${voteId} and status = 'pending'
    returning id
  `) as unknown as Array<{ id: string }>;
  return rows.length > 0;
}

export async function voidVote(voteId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    update votes
    set status = 'void', voided_at = now()
    where id = ${voteId} and status <> 'void'
    returning id
  `) as unknown as Array<{ id: string }>;
  return rows.length > 0;
}

export async function setBallotEntry(input: {
  pollId: string;
  submissionId: string;
  selected: boolean;
}): Promise<boolean> {
  const sql = getSql();
  if (!input.selected) {
    await sql`
      delete from poll_entries
      where poll_id = ${input.pollId} and submission_id = ${input.submissionId}
    `;
    return true;
  }
  const found = (await sql`
    select id from submissions where id = ${input.submissionId} limit 1
  `) as unknown as Array<{ id: string }>;
  if (found.length === 0) return false;
  await sql`
    insert into poll_entries (poll_id, submission_id)
    values (${input.pollId}, ${input.submissionId})
    on conflict (poll_id, submission_id) do nothing
  `;
  return true;
}

export type AdminCandidate = {
  id: string;
  explanation: string | null;
  fileUrl: string;
  contentType: string;
  name: string | null;
  selected: boolean;
  voteCount: number | null;
};

export async function listAdminCandidates(input: {
  pollId: string | null;
  includeNames: boolean;
  includeCounts: boolean;
}): Promise<AdminCandidate[]> {
  const sql = getSql();
  const rows = (
    input.includeNames
      ? await sql`
          select id, explanation, file_url, file_content_type, name
          from submissions
          order by created_at desc
          limit 500
        `
      : await sql`
          select id, explanation, file_url, file_content_type, null as name
          from submissions
          order by created_at desc
          limit 500
        `
  ) as unknown as Array<{
    id: string;
    explanation: string | null;
    file_url: string;
    file_content_type: string;
    name: string | null;
  }>;

  const selected = new Set<string>();
  const counts = new Map<string, number>();
  if (input.pollId) {
    const entryRows = (await sql`
      select submission_id from poll_entries where poll_id = ${input.pollId}
    `) as unknown as Array<{ submission_id: string }>;
    for (const entry of entryRows) selected.add(entry.submission_id);
    if (input.includeCounts) {
      const countRows = (await sql`
        select submission_id, count(*) as votes
        from votes
        where poll_id = ${input.pollId} and status = 'counted'
        group by submission_id
      `) as unknown as Array<{ submission_id: string; votes: number | string }>;
      for (const row of countRows) counts.set(row.submission_id, Number(row.votes) || 0);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    explanation: row.explanation,
    fileUrl: row.file_url,
    contentType: row.file_content_type,
    name: row.name,
    selected: selected.has(row.id),
    voteCount: input.includeCounts ? (counts.get(row.id) ?? 0) : null,
  }));
}
