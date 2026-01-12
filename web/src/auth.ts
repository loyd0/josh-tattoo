import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type AdminRole = "full" | "limited";

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

export const authOptions: NextAuthOptions = {
  // Store session in a signed/encrypted cookie-backed JWT (no DB).
  session: { strategy: "jwt" },

  // Required in production; also used by middleware to validate tokens.
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "");
        const password = String(credentials?.password ?? "");

        if (!username || !password) return null;

        const adminUser = process.env.ADMIN_USER;
        const adminPass = process.env.ADMIN_PASS;
        const limitedUser = process.env.ADMIN_LIMITED_USER;
        const limitedPass = process.env.ADMIN_LIMITED_PASS;

        if (adminUser && adminPass) {
          if (
            constantTimeEqual(username, adminUser) &&
            constantTimeEqual(password, adminPass)
          ) {
            return { id: "admin-full", name: username, role: "full" as const };
          }
        }

        if (limitedUser && limitedPass) {
          if (
            constantTimeEqual(username, limitedUser) &&
            constantTimeEqual(password, limitedPass)
          ) {
            return {
              id: "admin-limited",
              name: username,
              role: "limited" as const,
            };
          }
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof (user as any).role === "string") {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role ?? "full";
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/signin",
  },
};

