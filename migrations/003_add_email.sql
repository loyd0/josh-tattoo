-- Add email column to submissions table
alter table submissions add column if not exists email text;

-- Create index on email for searching
create index if not exists submissions_email_idx on submissions (email);
