-- Simple Neon-backed rate limiting buckets

create table if not exists rate_limits (
  scope text not null,
  ip_hash text not null,
  bucket_start timestamptz not null,
  count integer not null default 0,
  primary key (scope, ip_hash, bucket_start)
);
