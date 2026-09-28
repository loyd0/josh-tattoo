-- One public poll, its shortlist, and the votes cast on it.

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polls_window_chk check (
    starts_at is null
    or ends_at is null
    or ends_at > starts_at
  )
);

create table if not exists poll_entries (
  poll_id uuid not null references polls (id) on delete cascade,
  submission_id uuid not null references submissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, submission_id)
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls (id) on delete cascade,
  submission_id uuid not null references submissions (id),
  voter_name text not null,
  email text not null,
  email_key text not null,
  status text not null default 'pending',
  verify_token_hash text null,
  created_at timestamptz not null default now(),
  verified_at timestamptz null,
  voided_at timestamptz null,
  ip_hash text null,
  user_agent text null,
  cookie_id text null,
  fingerprint_hash text null,
  constraint votes_status_chk check (status in ('pending', 'counted', 'void')),
  constraint votes_email_key_unique unique (poll_id, email_key)
);

create index if not exists votes_poll_status_idx on votes (poll_id, status);
create index if not exists votes_poll_cookie_idx on votes (poll_id, cookie_id);
create index if not exists votes_poll_ip_idx on votes (poll_id, ip_hash);
create index if not exists votes_poll_fingerprint_idx on votes (poll_id, fingerprint_hash);
create index if not exists votes_verify_token_hash_idx on votes (verify_token_hash);
