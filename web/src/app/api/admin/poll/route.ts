import { z } from "zod";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import { formatLondonLocal, parseLondonLocal } from "@/lib/voting/londonTime";
import { ensurePoll, loadPollPhase, savePollWindow } from "@/lib/voting/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  startsAtLocal: z.string().trim().min(1),
  endsAtLocal: z.string().trim().min(1),
});

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return jsonError(401, "Sign in required");
  if ((session.user?.role ?? "full") === "limited") {
    return jsonError(403, "Only the full admin can change the voting dates.");
  }

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return jsonError(400, "Enter a start and an end.");

  const startsAt = parseLondonLocal(parsed.data.startsAtLocal);
  const endsAt = parseLondonLocal(parsed.data.endsAtLocal);
  if (!startsAt || !endsAt) {
    return jsonError(400, "Those times are not valid UK times.");
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return jsonError(400, "The end must be after the start.");
  }

  const { poll, phase } = await loadPollPhase();
  const current = poll ?? (await ensurePoll());
  if (
    phase !== "submissions" &&
    current.startsAt &&
    formatLondonLocal(current.startsAt) !== parsed.data.startsAtLocal
  ) {
    return jsonError(400, "The start time is locked once voting has begun.");
  }

  await savePollWindow(current.id, startsAt, endsAt);
  return Response.json({ ok: true });
}
