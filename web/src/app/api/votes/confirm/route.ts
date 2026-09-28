import { ConfirmVoteSchema } from "@/lib/voting/schema";
import { countVote, findVoteByTokenHash } from "@/lib/voting/store";
import { hashToken } from "@/lib/voting/token";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = ConfirmVoteSchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "That confirmation link is not valid.");

  const vote = await findVoteByTokenHash(hashToken(parsed.data.token));
  if (!vote) return jsonError(400, "That confirmation link is not valid.");
  if (vote.status === "void") {
    return jsonError(409, "This vote has been removed.");
  }
  if (vote.status === "counted") {
    return Response.json({ ok: true, status: "counted" });
  }

  if (vote.endsAt && Date.now() >= vote.endsAt.getTime()) {
    return jsonError(403, "Voting has closed, so this vote was not counted.");
  }

  const counted = await countVote(vote.id);
  if (!counted) {
    const again = await findVoteByTokenHash(hashToken(parsed.data.token));
    if (again?.status === "counted") {
      return Response.json({ ok: true, status: "counted" });
    }
    return jsonError(409, "This vote could not be counted.");
  }
  return Response.json({ ok: true, status: "counted" });
}
