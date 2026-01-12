"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

export default function AdminSignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return raw && raw.startsWith("/") ? raw : "/admin";
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with your admin credentials to access the submissions dashboard.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              const res = await signIn("credentials", {
                redirect: false,
                username,
                password,
                callbackUrl,
              });

              if (!res || res.error) {
                setError("Invalid username or password.");
                return;
              }

              window.location.assign(res.url ?? callbackUrl);
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block">
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Username
            </div>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Password
            </div>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              required
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="pt-1 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
            >
              Back to public form
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

