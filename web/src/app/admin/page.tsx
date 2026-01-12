import Link from "next/link";
import Image from "next/image";

import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  body_area: string;
  status: string;
  file_url: string;
  file_content_type: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const sql = getSql();
  
  // Pagination
  const page = parseInt(searchParams.page || "1", 10);
  const perPage = 20;
  const offset = (page - 1) * perPage;
  
  // Search
  const search = searchParams.search?.trim() || "";
  
  // Build query with search and pagination
  let rows: Submission[];
  let totalCount: number;
  
  if (search) {
    const searchPattern = `%${search}%`;
    rows = (await sql`
      select id, created_at, name, email, body_area, status, file_url, file_content_type
      from submissions
      where 
        name ilike ${searchPattern}
        or email ilike ${searchPattern}
        or body_area ilike ${searchPattern}
        or status ilike ${searchPattern}
      order by created_at desc
      limit ${perPage}
      offset ${offset}
    `) as unknown as Submission[];
    
    const countResult = (await sql`
      select count(*) as count
      from submissions
      where 
        name ilike ${searchPattern}
        or email ilike ${searchPattern}
        or body_area ilike ${searchPattern}
        or status ilike ${searchPattern}
    `) as unknown as Array<{ count: string }>;
    totalCount = parseInt(countResult[0]?.count || "0", 10);
  } else {
    rows = (await sql`
      select id, created_at, name, email, body_area, status, file_url, file_content_type
      from submissions
      order by created_at desc
      limit ${perPage}
      offset ${offset}
    `) as unknown as Submission[];
    
    const countResult = (await sql`
      select count(*) as count
      from submissions
    `) as unknown as Array<{ count: string }>;
    totalCount = parseInt(countResult[0]?.count || "0", 10);
  }
  
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {totalCount} total submission{totalCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
        >
          Public form
        </Link>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <form method="get" action="/admin" className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, body area, or status..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:bg-black/40 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Body area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-zinc-600 dark:text-zinc-400"
                  colSpan={7}
                >
                  {search ? "No submissions found." : "No submissions yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/5 hover:bg-zinc-50/70 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    {r.file_content_type.startsWith("image/") ? (
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                      >
                        <Image
                          src={r.file_url}
                          alt={`${r.name}'s tattoo`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                        <svg
                          className="h-6 w-6 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                    {new Date(r.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${r.id}`}
                      className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.body_area}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.status}
                  </td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
