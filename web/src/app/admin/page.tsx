import Link from "next/link";

import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sql = getSql();
  const rows = (await sql`
    select id, created_at, name, body_area, status, file_url
    from submissions
    order by created_at desc
    limit 200
  `) as unknown as Array<{
    id: string;
    created_at: string;
    name: string;
    body_area: string;
    status: string;
    file_url: string;
  }>;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Latest submissions (max 200).
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
        >
          Public form
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:bg-black/40 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Body area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                  No submissions yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/5 hover:bg-zinc-50/70 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${r.id}`}
                      className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.body_area}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <a
                      href={r.file_url}
                      className="text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

