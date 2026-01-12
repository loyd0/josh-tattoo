type TurnstileVerifyResult = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

export async function verifyTurnstileToken(opts: {
  token: string;
  ip?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // For local dev, allow missing Turnstile secret; for production, require it.
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, reason: "TURNSTILE_SECRET_KEY is not configured" };
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", opts.token);
  if (opts.ip) form.append("remoteip", opts.ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );

  if (!res.ok) {
    return { ok: false, reason: `Turnstile verify failed (${res.status})` };
  }

  const json = (await res.json()) as TurnstileVerifyResult;
  if (json.success) return { ok: true };

  const codes = json["error-codes"]?.join(", ") ?? "unknown_error";
  return { ok: false, reason: `Turnstile rejected token: ${codes}` };
}

