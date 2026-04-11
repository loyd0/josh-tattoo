/**
 * Trim and strip a single pair of surrounding ASCII quotes from secret values.
 * Pasted keys from some dashboards/secret stores include quotes, which makes the
 * Authorization header invalid and can surface as Resend HTTP 404
 * ("Application not found") rather than a clear "invalid API key".
 */
export function normalizeResendApiKey(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"') && k.length >= 2) ||
    (k.startsWith("'") && k.endsWith("'") && k.length >= 2)
  ) {
    k = k.slice(1, -1).trim();
  }
  return k.length > 0 ? k : undefined;
}

const RESEND_DEFAULT_HOST = "api.resend.com";

/**
 * When RESEND_BASE_URL points at a non-Resend host, the Resend Node SDK still
 * POSTs to `/emails` on that host, which often returns 404 with a generic body
 * (observed as "Application not found").
 */
export function getMisconfiguredResendBaseUrlMessage(): string | null {
  const raw = process.env.RESEND_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const pathOk = u.pathname === "" || u.pathname === "/";
    const hostOk = u.hostname === RESEND_DEFAULT_HOST;
    const protocolOk = u.protocol === "https:";
    if (protocolOk && hostOk && pathOk) return null;
  } catch {
    return `Invalid RESEND_BASE_URL: ${JSON.stringify(process.env.RESEND_BASE_URL)} is not a valid URL.`;
  }
  return `Invalid RESEND_BASE_URL: must be https://${RESEND_DEFAULT_HOST} (got ${JSON.stringify(raw)}).`;
}

export function assertProductionResendBaseUrl(): void {
  if (process.env.NODE_ENV !== "production") return;
  const msg = getMisconfiguredResendBaseUrlMessage();
  if (msg) throw new Error(msg);
}
