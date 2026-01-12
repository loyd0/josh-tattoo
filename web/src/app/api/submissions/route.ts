import { Resend } from "resend";

import { getSql } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getClientIpFromHeaders, hashIp } from "@/lib/ip";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { SubmissionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function getOriginFromRequest(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : null;
}

async function maybeSendNotificationEmail(opts: {
  to: string;
  from: string;
  submissionId: string;
  name: string;
  bodyArea: string;
  notes?: string | null;
  fileUrl: string;
  adminLink?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    to: opts.to,
    from: opts.from,
    subject: `New tattoo submission: ${opts.name} (${opts.bodyArea})`,
    text: [
      `New tattoo submission received.`,
      ``,
      `Name: ${opts.name}`,
      `Body area: ${opts.bodyArea}`,
      opts.notes ? `Notes: ${opts.notes}` : `Notes: (none)`,
      ``,
      `File: ${opts.fileUrl}`,
      opts.adminLink ? `Admin: ${opts.adminLink}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = SubmissionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "Invalid request payload");
  }

  const data = parsed.data;

  // Spam hardening
  if (data.honeypot && data.honeypot.trim().length > 0) {
    return jsonError(400, "Invalid submission");
  }

  if (data.startedAtMs) {
    const elapsed = Date.now() - data.startedAtMs;
    if (elapsed < 2000) {
      return jsonError(400, "Form submitted too quickly");
    }
  }

  const ip = getClientIpFromHeaders(request.headers);
  const ipHash = ip ? hashIp(ip, process.env.IP_HASH_SALT) : "unknown";

  const turnstile = await verifyTurnstileToken({
    token: data.turnstileToken,
    ip,
  });
  if (!turnstile.ok) return jsonError(400, turnstile.reason);

  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600");
  const max = Number(process.env.RATE_LIMIT_MAX_SUBMISSIONS ?? "5");
  const rl = await enforceRateLimit({
    scope: "submission",
    ipHash,
    windowSeconds,
    max,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  const sql = getSql();

  const notes = data.notes?.trim() ? data.notes.trim() : null;
  const userAgent = request.headers.get("user-agent");

  const rows = (await sql`
    insert into submissions (
      name,
      body_area,
      notes,
      file_url,
      file_path,
      file_size_bytes,
      file_content_type,
      ip_hash,
      user_agent
    )
    values (
      ${data.name},
      ${data.bodyArea},
      ${notes},
      ${data.blob.url},
      ${data.blob.pathname},
      ${data.blob.size},
      ${data.blob.contentType},
      ${ipHash},
      ${userAgent}
    )
    returning id
  `) as unknown as Array<{ id: string }>;

  const submissionId = rows[0]?.id;
  if (!submissionId) {
    return jsonError(500, "Failed to create submission");
  }

  const notifyTo = process.env.NOTIFY_EMAIL_TO;
  const notifyFrom = process.env.NOTIFY_EMAIL_FROM;
  const origin = getOriginFromRequest(request);
  const adminLink = origin ? `${origin}/admin/${submissionId}` : undefined;

  if (notifyTo && notifyFrom) {
    try {
      await maybeSendNotificationEmail({
        to: notifyTo,
        from: notifyFrom,
        submissionId,
        name: data.name,
        bodyArea: data.bodyArea,
        notes,
        fileUrl: data.blob.url,
        adminLink,
      });
    } catch (e) {
      // Don't fail the submission if email fails.
      console.error("Resend notification failed", e);
    }
  }

  return Response.json({ ok: true, id: submissionId });
}

