import { Resend } from "resend";

import { getSql } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getClientIpFromHeaders, hashIp } from "@/lib/ip";
import { SubmissionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  email: string;
  bodyArea: string;
  notes?: string | null;
  fileUrl: string;
  adminLink?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);

  const subject = `New tattoo submission (${opts.bodyArea})`;

  const text = [
    `New tattoo submission received.`,
    ``,
    `Body area: ${opts.bodyArea}`,
    opts.notes ? `Notes: ${opts.notes}` : `Notes: (none)`,
    ``,
    `File: ${opts.fileUrl}`,
    opts.adminLink ? `Admin: ${opts.adminLink}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const safeBodyArea = escapeHtml(opts.bodyArea);
  const safeNotes = opts.notes ? escapeHtml(opts.notes) : "";
  const safeFileUrl = escapeHtml(opts.fileUrl);
  const safeAdminLink = opts.adminLink ? escapeHtml(opts.adminLink) : "";
  const safeSubmissionId = escapeHtml(opts.submissionId);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      New tattoo submission received.
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:18px 20px;background:#18181b;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Ink My Canvas</div>
                <div style="margin-top:6px;font-size:20px;font-weight:700;">New submission received</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Body area</div>
                      <div style="margin-top:4px;font-size:16px;">${safeBodyArea}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Notes</div>
                      <div style="margin-top:4px;font-size:16px;white-space:pre-wrap;">${safeNotes || "(none)"}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Links</div>
                      <div style="margin-top:8px;font-size:14px;line-height:1.5;">
                        <div>
                          <a href="${safeFileUrl}" style="color:#2563eb;text-decoration:underline;">Open uploaded file</a>
                        </div>
                        ${
                          safeAdminLink
                            ? `<div style="margin-top:6px;"><a href="${safeAdminLink}" style="color:#2563eb;text-decoration:underline;">View in admin</a></div>`
                            : ""
                        }
                      </div>
                      <div style="margin-top:12px;font-size:12px;color:#71717a;">
                        Submission ID: <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${safeSubmissionId}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background:#fafafa;border-top:1px solid #f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#71717a;font-size:12px;">
                Notification only.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const result = await resend.emails.send({
    to: opts.to,
    from: opts.from,
    replyTo: opts.from,
    subject,
    text,
    html,
    tags: [{ name: "source", value: "tattoo-submission" }],
  });

  if (result && "error" in result && result.error) {
    throw result.error;
  }
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

  // Note: Turnstile token was already verified during blob upload in /api/blob/token.
  // We don't verify it again here because Turnstile tokens are single-use.
  // If the blob upload succeeded, we can trust the turnstile was valid.

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
      email,
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
      ${data.email},
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
        email: data.email,
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

