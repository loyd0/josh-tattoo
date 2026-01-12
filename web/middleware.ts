import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    // Keep middleware token encryption/decryption aligned with the NextAuth handler.
    // If this differs, you'll see `JWT_SESSION_ERROR` / `JWEDecryptionFailed`.
    secret:
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV !== "production" ? "dev-secret-change-me" : undefined),
    pages: {
      signIn: "/admin/signin",
    },
    callbacks: {
      authorized: ({ req, token }) => {
        // Prevent redirect loops: allow the sign-in page through without a session.
        if (req.nextUrl.pathname === "/admin/signin") return true;
        return Boolean(token);
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

