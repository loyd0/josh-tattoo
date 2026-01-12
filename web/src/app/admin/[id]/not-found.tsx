import Link from "next/link";

export default function AdminSubmissionNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-800">
        Submission not found
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This page expects a real submission ID in the URL (e.g.{" "}
        <span className="font-mono">/admin/&lt;uuid&gt;</span>). If you clicked
        through from the list and still see this, the submission may have been
        deleted or you may be connected to a different database environment.
      </p>
      <div className="mt-6">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold text-[#1a1a1a] hover:bg-[#fff176]"
        >
          Back to admin list
        </Link>
      </div>
    </main>
  );
}

