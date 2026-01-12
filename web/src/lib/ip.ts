import crypto from "crypto";

export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  // Some platforms use this header.
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

export function hashIp(ip: string, salt?: string): string {
  if (!salt) return ip;
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

