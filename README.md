# Tattoo Upload Portal

This repo contains a **Next.js (App Router) + Tailwind** app for uploading tattoo drawings to **Vercel Blob** with metadata stored in **Neon Postgres**, plus an **admin-only** submissions browser and **Resend** notifications.

The Next.js app lives in `web/` (set your Vercel “Root Directory” to `web`).

## Local development

```bash
cd web
npm install
npm run dev
```

## Environment variables

Create `web/.env.local`:

- **Database**
  - `DATABASE_URL` (Neon Postgres connection string)
- **Vercel Blob**
  - `BLOB_READ_WRITE_TOKEN`
- **Admin auth (Basic Auth)**
  - `ADMIN_USER`
  - `ADMIN_PASS`
  - `ADMIN_LIMITED_USER` (optional; can view admin but **name/email are hidden**)
  - `ADMIN_LIMITED_PASS` (optional; can view admin but **name/email are hidden**)
- **Resend**
  - `RESEND_API_KEY`
  - `NOTIFY_EMAIL_FROM`
  - `NOTIFY_EMAIL_TO`
- **Turnstile**
  - `TURNSTILE_SECRET_KEY`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Privacy**
  - `IP_HASH_SALT`

Optional:

- `RATE_LIMIT_WINDOW_SECONDS` (default: 600)
- `RATE_LIMIT_MAX_TOKENS` (default: 10)
- `RATE_LIMIT_MAX_SUBMISSIONS` (default: 5)
- `RATE_LIMIT_MAX_VOTES` (default: 8)

## Voting

Run `migrations/005_create_voting.sql` before opening a ballot.

Admins choose the shortlist and the UK start/end at `/admin/vote`. The limited admin can change the shortlist and open the preview, and cannot see totals or voter details. Before the start, the homepage still takes submissions. During the window it becomes the ballot and submissions close. After the end it shows the winner (or every tie) and each design's count, and submissions stay closed.

A vote stores a hashed IP, a device cookie, a hashed browser fingerprint, and the user agent. Plus-tags are removed, Gmail and Googlemail are one inbox, and dotted addresses stay distinct. Disposable inboxes are rejected. The same email, cookie, IP, or fingerprint cannot vote again, including after a void.

## Database migrations (Neon)

Run these SQL files against your Neon database:

- `migrations/001_create_submissions.sql`
- `migrations/002_create_rate_limits.sql`
- `migrations/003_add_email.sql`
- `migrations/004_add_explanation_and_rating.sql`
- `migrations/005_create_voting.sql`

## Vercel deployment notes

- Set the Vercel Project “Root Directory” to `web`.
- Add the env vars above in Vercel project settings.
- Ensure `BLOB_READ_WRITE_TOKEN` is set for Blob uploads.
