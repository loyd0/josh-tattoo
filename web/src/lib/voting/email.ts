import { isDisposableDomain } from "./disposableDomains";

export type NormalizedEmail =
  | { ok: true; key: string }
  | { ok: false; reason: "invalid" | "disposable" };

/**
 * Fold plus-tags and treat gmail.com / googlemail.com as one inbox.
 * Dots in the local part are preserved on purpose.
 */
export function normalizeEmail(raw: string): NormalizedEmail {
  const trimmed = raw.trim().toLowerCase();
  const match = /^([^@\s]+)@([^@\s]+\.[^@\s]+)$/.exec(trimmed);
  if (!match) return { ok: false, reason: "invalid" };

  let local = match[1] ?? "";
  let domain = match[2] ?? "";
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  if (!local || local.startsWith(".") || local.endsWith(".")) {
    return { ok: false, reason: "invalid" };
  }
  if (domain === "googlemail.com") domain = "gmail.com";

  if (isDisposableDomain(domain)) return { ok: false, reason: "disposable" };
  return { ok: true, key: `${local}@${domain}` };
}

export function emailRejectionMessage(reason: "invalid" | "disposable"): string {
  if (reason === "disposable") {
    return "Use a personal email address. Disposable inboxes can't vote.";
  }
  return "Enter a valid email address.";
}
