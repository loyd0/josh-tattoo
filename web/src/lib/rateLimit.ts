import { getSql } from "@/lib/db";

const inMemoryBuckets = new Map<string, { count: number; bucketStart: number }>();

function getBucketStartEpochSeconds(nowSeconds: number, windowSeconds: number) {
  return Math.floor(nowSeconds / windowSeconds) * windowSeconds;
}

export async function enforceRateLimit(opts: {
  scope: "blob_token" | "submission";
  ipHash: string;
  windowSeconds: number;
  max: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const bucketStart = getBucketStartEpochSeconds(nowSeconds, opts.windowSeconds);
  const key = `${opts.scope}:${opts.ipHash}:${bucketStart}`;

  // DB-backed if configured; otherwise in-memory fallback for local dev.
  if (!process.env.DATABASE_URL) {
    const existing = inMemoryBuckets.get(key) ?? { count: 0, bucketStart };
    existing.count += 1;
    inMemoryBuckets.set(key, existing);
    if (existing.count > opts.max) {
      const retryAfterSeconds = bucketStart + opts.windowSeconds - nowSeconds;
      return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }
    return { ok: true };
  }

  const sql = getSql();
  const bucketStartTs = new Date(bucketStart * 1000).toISOString();

  // Upsert + return new count.
  const rows = (await sql`
    insert into rate_limits (scope, ip_hash, bucket_start, count)
    values (${opts.scope}, ${opts.ipHash}, ${bucketStartTs}, 1)
    on conflict (scope, ip_hash, bucket_start)
    do update set count = rate_limits.count + 1
    returning count
  `) as unknown as Array<{ count: number }>;

  const nextCount = rows[0]?.count ?? 1;
  if (nextCount > opts.max) {
    const retryAfterSeconds = bucketStart + opts.windowSeconds - nowSeconds;
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  return { ok: true };
}

