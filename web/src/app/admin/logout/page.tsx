"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // Best-effort: trigger 401 challenge to clear cached basic auth creds.
        await fetch("/api/admin/logout", { cache: "no-store" });
      } finally {
        router.replace("/");
      }
    };

    void run();
  }, [router]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-[#1a1a1a]">
        Signing out…
      </h1>
      <p className="mt-2 text-sm text-zinc-700">
        Redirecting you back to the public form.
      </p>
    </main>
  );
}

