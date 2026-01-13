import { Suspense } from "react";

import AdminSignInClient from "./AdminSignInClient";

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Admin sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
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

