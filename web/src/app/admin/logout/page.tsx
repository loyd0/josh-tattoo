"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminLogoutPage() {
  useEffect(() => {
    // Use a real navigation (not fetch) so the browser's Basic Auth UI engages.
    window.location.assign("/api/admin/logout");
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-[#1a1a1a]">
        Signing out…
      </h1>
      <p className="mt-2 text-sm text-zinc-700">
        If you see a login prompt, press <span className="font-semibold">Cancel</span> to
        complete sign out.
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

