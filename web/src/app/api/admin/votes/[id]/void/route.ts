import { z } from "zod";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import { voidVote } from "@/lib/voting/store";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return jsonError(401, "Sign in required");
  if ((session.user?.role ?? "full") === "limited") {
    return jsonError(403, "Only the full admin can void a vote.");
  }

  const params = await ctx.params;
  const id = z.string().uuid().safeParse(params.id);
  if (!id.success) return jsonError(400, "Invalid vote");

  const voided = await voidVote(id.data);
  if (!voided) return jsonError(404, "Vote not found");
  return Response.json({ ok: true });
}
