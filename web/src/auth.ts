import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type AdminRole = "full" | "limited";

function isAdminRole(role: unknown): role is AdminRole {
  return role === "full" || role === "limited";
}

/**
 * NextAuth uses this secret to encrypt/decrypt the JWT session cookie.
 *
 * If it changes (or is missing and implicitly generated), any existing session
 * cookies become undecryptable and NextAuth will log `JWT_SESSION_ERROR` with
 * `JWEDecryptionFailed` (often showing up as redirect loops to /admin/signin).
 */
const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== "production" ? "dev-secret-change-me" : undefined);

if (!NEXTAUTH_SECRET) {
  throw new Error(
    "Missing NEXTAUTH_SECRET. Set it to a long random string to enable stable admin sessions.",
  );
}

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
  secret: NEXTAUTH_SECRET,

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
      const role = (user as { role?: unknown } | null | undefined)?.role;
      if (isAdminRole(role)) {
        token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? "full";
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/signin",
  },
};

