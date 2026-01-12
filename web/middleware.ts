import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
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

