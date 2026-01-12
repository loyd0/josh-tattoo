-- Tattoo upload portal - submissions table
-- Requires pgcrypto for gen_random_uuid()

create extension if not exists pgcrypto;

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  body_area text not null,
  notes text null,

  file_url text not null,
  file_path text not null,
  file_size_bytes integer not null,
  file_content_type text not null,

  ip_hash text null,
  user_agent text null,

  status text not null default 'new'
);

create index if not exists submissions_created_at_idx on submissions (created_at desc);
