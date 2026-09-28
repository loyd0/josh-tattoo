import { z } from "zod";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import { ensurePoll, setBallotEntry } from "@/lib/voting/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  submissionId: z.string().uuid(),
  selected: z.boolean(),
});

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return jsonError(401, "Sign in required");

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "Invalid design");

  const poll = await ensurePoll();
  const saved = await setBallotEntry({
    pollId: poll.id,
    submissionId: parsed.data.submissionId,
    selected: parsed.data.selected,
  });
  if (!saved) return jsonError(404, "Submission not found");
  return Response.json({ ok: true });
}
