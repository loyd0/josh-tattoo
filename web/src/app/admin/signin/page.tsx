import { Suspense } from "react";

import AdminSignInClient from "./AdminSignInClient";

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-950">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Admin sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Loading…
            </p>
          </div>
        </main>
      }
    >
      <AdminSignInClient />
    </Suspense>
  );
}

