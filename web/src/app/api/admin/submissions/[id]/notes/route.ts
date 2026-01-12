import { z } from "zod";

import { getSql } from "@/lib/db";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const BodySchema = z.object({
  notes: z
    .string()
    .max(5000)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function PATCH(
  request: Request,
  ctx: { params: { id: string } },
) {
  // Protected by `middleware.ts` via `/api/admin/:path*` matcher.
  const parsedParams = ParamsSchema.safeParse(ctx.params);
  if (!parsedParams.success) return jsonError(400, "Invalid submission id");

  const json = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(json);
  if (!parsedBody.success) return jsonError(400, "Invalid request payload");

  const notesRaw = parsedBody.data.notes;
  const notes =
    typeof notesRaw === "string" && notesRaw.trim().length > 0
      ? notesRaw.trim()
      : null;

  const sql = getSql();
  const rows = (await sql`
    update submissions
    set notes = ${notes}
    where id = ${parsedParams.data.id}
    returning notes
  `) as unknown as Array<{ notes: string | null }>;

  if (rows.length === 0) return jsonError(404, "Submission not found");
  return Response.json({ ok: true, notes: rows[0]!.notes });
}

