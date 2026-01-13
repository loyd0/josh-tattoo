import { z } from "zod";

import { getSql } from "@/lib/db";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const RatingSchema = z
  .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
  .nullable()
  .optional()
  .or(z.literal(""));

const BodySchema = z.object({
  rating: RatingSchema,
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  // Protected by `middleware.ts` via `/api/admin/:path*` matcher.
  const params = await ctx.params;
  const parsedParams = ParamsSchema.safeParse(params);
  if (!parsedParams.success) return jsonError(400, "Invalid submission id");

  const json = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(json);
  if (!parsedBody.success) return jsonError(400, "Invalid request payload");

  const ratingRaw = parsedBody.data.rating;
  const rating =
    ratingRaw === "" || ratingRaw === undefined ? null : (ratingRaw as 1 | 2 | 3 | 4 | 5 | null);

  const ratedAt = rating ? new Date() : null;

  const sql = getSql();
  const rows = (await sql`
    update submissions
    set rating = ${rating}, rated_at = ${ratedAt}
    where id = ${parsedParams.data.id}
    returning rating
  `) as unknown as Array<{ rating: number | null }>;

  if (rows.length === 0) return jsonError(404, "Submission not found");
  const nextRating = rows[0]!.rating;
  return Response.json({ ok: true, rating: nextRating });
}

