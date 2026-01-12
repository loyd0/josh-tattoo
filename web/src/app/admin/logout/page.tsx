"use client";

import { useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AdminLogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/" });
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-[#1a1a1a]">
        Signing out…
      </h1>
      <p className="mt-2 text-sm text-zinc-700">
        You should be redirected shortly.
      </p>
      <div className="mt-4">
        <Link
          href="/"
          className="rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold text-[#1a1a1a] hover:bg-[#fff176]"
        >
          Back to public form
        </Link>
      </div>
    </main>
  );
}

