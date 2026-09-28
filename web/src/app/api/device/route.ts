import { cookies } from "next/headers";

import { DEVICE_COOKIE, deviceCookieOptions } from "@/lib/voting/device";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing) {
    return Response.json({ ok: true, created: false });
  }
  const id = crypto.randomUUID();
  jar.set(DEVICE_COOKIE, id, deviceCookieOptions());
  return Response.json({ ok: true, created: true });
}
