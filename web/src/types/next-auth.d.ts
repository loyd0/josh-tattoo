import "next-auth";
import "next-auth/jwt";

import type { AdminRole } from "@/auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: AdminRole;
    };
  }

  interface User {
    role?: AdminRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AdminRole;
  }
}

