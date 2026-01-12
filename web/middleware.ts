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

function unauthorized(realm: string) {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export function middleware(req: NextRequest) {
  const realmId = req.cookies.get("admin_realm")?.value ?? "v1";
  const realm = `Admin-${realmId}`;

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

  // Sign out: rotate realm so browser must re-prompt next time.
  if (req.nextUrl.pathname === "/api/admin/logout") {
    const newRealmId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const res = unauthorized(`Admin-${newRealmId}`);
    res.cookies.set("admin_realm", newRealmId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized(realm);

  const base64 = auth.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return unauthorized(realm);
  }

  const [u, p] = decoded.split(":");
  if (!u || !p) return unauthorized(realm);

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
  if (!role) return unauthorized(realm);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-role", role);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Ensure realm cookie exists (so we can rotate on logout).
  if (!req.cookies.get("admin_realm")) {
    res.cookies.set("admin_realm", realmId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

