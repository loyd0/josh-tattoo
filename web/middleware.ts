import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function constantTimeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const aBuf = enc.encode(a);
  const bBuf = enc.encode(b);

  // Keep runtime roughly proportional even on length mismatch.
  const len = Math.max(aBuf.length, bBuf.length);
  let diff = aBuf.length ^ bBuf.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0);
  }
  return diff === 0;
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export function middleware(req: NextRequest) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  const limitedUser = process.env.ADMIN_LIMITED_USER;
  const limitedPass = process.env.ADMIN_LIMITED_PASS;

  const hasFull = Boolean(adminUser && adminPass);
  const hasLimited = Boolean(limitedUser && limitedPass);

  if (!hasFull && !hasLimited) {
    // Allow in dev if not configured; require in production.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse(
      "No admin credentials configured (set ADMIN_USER/ADMIN_PASS and/or ADMIN_LIMITED_USER/ADMIN_LIMITED_PASS)",
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const base64 = auth.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return unauthorized();
  }

  const [u, p] = decoded.split(":");
  if (!u || !p) return unauthorized();

  let role: "full" | "limited" | null = null;
  if (hasFull && adminUser && adminPass) {
    if (constantTimeEqual(u, adminUser) && constantTimeEqual(p, adminPass)) {
      role = "full";
    }
  }
  if (!role && hasLimited && limitedUser && limitedPass) {
    if (
      constantTimeEqual(u, limitedUser) &&
      constantTimeEqual(p, limitedPass)
    ) {
      role = "limited";
    }
  }
  if (!role) return unauthorized();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-role", role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

