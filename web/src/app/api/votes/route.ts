import { getClientIpFromHeaders, hashIp } from "@/lib/ip";
import { enforceRateLimit } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { decideVote, voteRejectionMessage } from "@/lib/voting/duplicates";
import { emailRejectionMessage, normalizeEmail } from "@/lib/voting/email";
import { DEVICE_COOKIE } from "@/lib/voting/device";
import { getOriginFromRequest, readCookie } from "@/lib/voting/http";
import { sendVoteConfirmation } from "@/lib/voting/mail";
import { CastVoteSchema, ResendVoteSchema } from "@/lib/voting/schema";
import {
  insertPendingVote,
  listVoteSignals,
  loadPollPhase,
  rotateVoteToken,
  submissionOnBallot,
} from "@/lib/voting/store";
import { hashToken, isUniqueViolation, newVoteToken } from "@/lib/voting/token";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

async function issueAndSend(opts: {
  request: Request;
  pollId: string;
  email: string;
  emailKey: string;
  mode: "create" | "resend";
  create?: {
    submissionId: string;
    voterName: string;
    ipHash: string | null;
    userAgent: string | null;
    cookieId: string;
    fingerprintHash: string;
  };
}): Promise<Response> {
  const origin = getOriginFromRequest(opts.request);
  if (!origin) return jsonError(500, "Could not build the confirmation link");

  const token = newVoteToken();
  const tokenHash = hashToken(token);
  if (opts.mode === "create" && opts.create) {
    try {
      await insertPendingVote({
        pollId: opts.pollId,
        submissionId: opts.create.submissionId,
        voterName: opts.create.voterName,
        email: opts.email,
        emailKey: opts.emailKey,
        tokenHash,
        ipHash: opts.create.ipHash,
        userAgent: opts.create.userAgent,
        cookieId: opts.create.cookieId,
        fingerprintHash: opts.create.fingerprintHash,
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return resendExisting(opts.request, opts.pollId, opts.email, opts.emailKey);
    }
  } else {
    const rotated = await rotateVoteToken({
      pollId: opts.pollId,
      emailKey: opts.emailKey,
      tokenHash,
    });
    if (!rotated) {
      return Response.json({
        ok: true,
        emailed: false,
        message: "If that address still has a vote waiting, we sent another link.",
      });
    }
  }

  const sent = await sendVoteConfirmation({
    to: opts.email,
    confirmUrl: `${origin}/vote/verify?token=${encodeURIComponent(token)}`,
  });
  if (!sent.ok) {
    return Response.json({
      ok: true,
      emailed: false,
      message:
        "Your choice is locked, but the email could not be sent. Ask for the link again in a moment.",
    });
  }
  return Response.json({
    ok: true,
    emailed: true,
    message: "Check your email and confirm your vote. Your choice is locked.",
  });
}

async function resendExisting(
  request: Request,
  pollId: string,
  email: string,
  emailKey: string,
): Promise<Response> {
  const signals = await listVoteSignals(pollId);
  const pending = signals.find(
    (vote) => vote.emailKey === emailKey && vote.status === "pending",
  );
  if (!pending) {
    return Response.json({
      ok: true,
      emailed: false,
      message: "If that address still has a vote waiting, we sent another link.",
    });
  }
  return issueAndSend({
    request,
    pollId,
    email,
    emailKey,
    mode: "resend",
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = CastVoteSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "Invalid request payload");
  const data = parsed.data;

  if (data.honeypot && data.honeypot.trim().length > 0) {
    return jsonError(400, "Invalid vote");
  }
  if (data.startedAtMs && Date.now() - data.startedAtMs < 2000) {
    return jsonError(400, "Form submitted too quickly");
  }

  const ip = getClientIpFromHeaders(request.headers);
  const turnstile = await verifyTurnstileToken({
    token: data.turnstileToken,
    ip,
  });
  if (!turnstile.ok) return jsonError(400, "Security check failed");

  const ipHash = ip ? hashIp(ip, process.env.IP_HASH_SALT) : null;
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600");
  const max = Number(process.env.RATE_LIMIT_MAX_VOTES ?? "8");
  const limited = await enforceRateLimit({
    scope: "vote",
    ipHash: ipHash ?? "unknown",
    windowSeconds,
    max,
  });
  if (!limited.ok) {
    return Response.json(
      { error: "Too many attempts. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { poll, phase } = await loadPollPhase();
  if (!poll || phase !== "voting") {
    return jsonError(403, "Voting is not open.");
  }

  const email = normalizeEmail(data.email);
  if (!email.ok) return jsonError(400, emailRejectionMessage(email.reason));

  const cookieId = readCookie(request.headers.get("cookie"), DEVICE_COOKIE);
  if (!cookieId) {
    return jsonError(400, "Enable cookies to vote, then reload the page.");
  }

  const onBallot = await submissionOnBallot(poll.id, data.submissionId);
  if (!onBallot) return jsonError(400, "That design is not on the ballot.");

  const fingerprintHash = hashIp(data.fingerprint, process.env.IP_HASH_SALT);
  const signals = await listVoteSignals(poll.id);
  const decision = decideVote(signals, {
    emailKey: email.key,
    submissionId: data.submissionId,
    ipHash,
    cookieId,
    fingerprintHash,
  });

  if (decision.action === "reject") {
    return jsonError(409, voteRejectionMessage(decision.reason));
  }

  return issueAndSend({
    request,
    pollId: poll.id,
    email: data.email.trim(),
    emailKey: email.key,
    mode: decision.action === "resend" ? "resend" : "create",
    create:
      decision.action === "create"
        ? {
            submissionId: data.submissionId,
            voterName: data.name.trim(),
            ipHash,
            userAgent: request.headers.get("user-agent"),
            cookieId,
            fingerprintHash,
          }
        : undefined,
  });
}

export async function PUT(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = ResendVoteSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "Invalid request payload");
  const data = parsed.data;
  if (data.honeypot && data.honeypot.trim().length > 0) {
    return jsonError(400, "Invalid vote");
  }

  const ip = getClientIpFromHeaders(request.headers);
  const turnstile = await verifyTurnstileToken({ token: data.turnstileToken, ip });
  if (!turnstile.ok) return jsonError(400, "Security check failed");

  const ipHash = ip ? hashIp(ip, process.env.IP_HASH_SALT) : null;
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600");
  const max = Number(process.env.RATE_LIMIT_MAX_VOTES ?? "8");
  const limited = await enforceRateLimit({
    scope: "vote",
    ipHash: ipHash ?? "unknown",
    windowSeconds,
    max,
  });
  if (!limited.ok) {
    return Response.json(
      { error: "Too many attempts. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const email = normalizeEmail(data.email);
  if (!email.ok) return jsonError(400, emailRejectionMessage(email.reason));

  const { poll, phase } = await loadPollPhase();
  if (!poll || phase === "results") {
    return jsonError(403, "Voting has closed.");
  }
  if (phase !== "voting") {
    return jsonError(403, "Voting is not open.");
  }

  return resendExisting(request, poll.id, data.email.trim(), email.key);
}
