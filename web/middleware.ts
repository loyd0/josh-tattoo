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

  if (!adminUser || !adminPass) {
    // Allow in dev if not configured; require in production.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("ADMIN_USER/ADMIN_PASS not configured", {
      status: 500,
    });
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

  if (!constantTimeEqual(u, adminUser) || !constantTimeEqual(p, adminPass)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

