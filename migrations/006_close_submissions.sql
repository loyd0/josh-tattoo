-- Close submissions independently of the voting schedule.
alter table polls add column if not exists submissions_closed_at timestamptz null;
