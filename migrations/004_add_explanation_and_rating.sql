-- Add public explanation + admin rating to submissions

alter table submissions add column if not exists explanation text;

alter table submissions add column if not exists rating smallint;
alter table submissions add column if not exists rated_at timestamptz;

-- Keep rating in the 1-5 star range when set.
alter table submissions
  drop constraint if exists submissions_rating_range_chk;
alter table submissions
  add constraint submissions_rating_range_chk
  check (rating is null or (rating >= 1 and rating <= 5));

create index if not exists submissions_rating_idx on submissions (rating);
