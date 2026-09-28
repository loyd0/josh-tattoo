import { Resend } from "resend";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendVoteConfirmation(opts: {
  to: string;
  confirmUrl: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { ok: false, reason: "Email is not configured" };
  }

  const resend = new Resend(apiKey);
  const subject = "Confirm your tattoo vote";
  const safeUrl = escapeHtml(opts.confirmUrl);
  const text = [
    "Confirm your vote for Josh's tattoo.",
    "",
    "Your choice is locked. Open this link and press the button to count it:",
    opts.confirmUrl,
    "",
    "If you did not ask to vote, you can ignore this email.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f0e6;font-family:Georgia,serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:2px solid #1a1a1a;border-radius:12px;padding:24px;">
      <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Ink My Canvas</div>
      <h1 style="font-size:28px;line-height:1.1;margin:8px 0 12px;">Confirm your vote</h1>
      <p style="font-size:18px;line-height:1.4;">Your choice is locked. Open the link and press the button before voting ends, or it will not count.</p>
      <p style="margin:20px 0;">
        <a href="${safeUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Confirm my vote</a>
      </p>
      <p style="font-size:14px;word-break:break-all;">${safeUrl}</p>
    </div>
  </body>
</html>`;

  const result = await resend.emails.send({
    to: opts.to,
    from,
    subject,
    text,
    html,
    tags: [{ name: "source", value: "tattoo-vote" }],
  });

  if (result && "error" in result && result.error) {
    return { ok: false, reason: "Could not send the confirmation email" };
  }
  return { ok: true };
}
