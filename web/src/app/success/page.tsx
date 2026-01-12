import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">
          Submission received
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Thanks — your drawing and details were submitted successfully.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Submit another
          </Link>
        </div>
      </div>
    </main>
  );
}

