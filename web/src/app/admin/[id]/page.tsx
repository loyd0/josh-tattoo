import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { getSql } from "@/lib/db";
import { AdminNotesModal } from "@/components/AdminNotesModal";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

function readOptionalString(obj: unknown, key: string): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function readOptionalNullableString(
  obj: unknown,
  key: string,
): string | null | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  if (v === null) return null;
  return typeof v === "string" ? v : undefined;
}

export default async function AdminSubmissionDetailPage(props: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/signin");

  // In newer Next versions, `params` may be a Promise.
  const params = await Promise.resolve(props.params);
  const id = readOptionalString(params, "id");
  if (!id) notFound();

  const role = session.user?.role ?? "full";
  const isLimited = role === "limited";

  const sql = getSql();
  const rows = isLimited
    ? ((await sql`
        select
          id,
          created_at,
          body_area,
          notes,
          file_url,
          file_path,
          file_size_bytes,
          file_content_type,
          status
        from submissions
        where id = ${id}
        limit 1
      `) as unknown as Array<{
        id: string;
        created_at: string;
        body_area: string;
        notes: string | null;
        file_url: string;
        file_path: string;
        file_size_bytes: number;
        file_content_type: string;
        status: string;
      }>)
    : ((await sql`
        select
          id,
          created_at,
          name,
          email,
          body_area,
          notes,
          file_url,
          file_path,
          file_size_bytes,
          file_content_type,
          status
        from submissions
        where id = ${id}
        limit 1
      `) as unknown as Array<{
        id: string;
        created_at: string;
        name: string;
        email: string | null;
        body_area: string;
        notes: string | null;
        file_url: string;
        file_path: string;
        file_size_bytes: number;
        file_content_type: string;
        status: string;
      }>);

  const s = rows[0];
  if (!s) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Submission detail
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {new Date(s.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold text-[#1a1a1a] hover:bg-[#fff176]"
          >
            Back to list
          </Link>
          <Link
            href="/admin/logout"
            className="rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold text-[#1a1a1a] hover:bg-[#fff176]"
          >
            Sign out
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-950">
        <dl className="grid gap-4 sm:grid-cols-2">
          {isLimited ? null : (
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Name
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {readOptionalString(s, "name") ?? ""}
              </dd>
            </div>
          )}
          {isLimited ? null : (
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Email
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {readOptionalNullableString(s, "email") || "-"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Body area
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{s.body_area}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Status
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{s.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Content type
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{s.file_content_type}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Size
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {(s.file_size_bytes / 1024 / 1024).toFixed(2)} MB
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Blob path
            </dt>
            <dd className="mt-1 break-all text-sm font-mono text-zinc-900 dark:text-zinc-100">{s.file_path}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2">
          <AdminNotesModal submissionId={s.id} initialNotes={s.notes} />

          {s.file_content_type.startsWith("image/") ? (
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Upload preview
              </div>
              <a
                href={s.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block overflow-hidden rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/15 dark:bg-black/20"
                title="Open full image in new tab"
              >
                <Image
                  src={s.file_url}
                  alt="Uploaded tattoo"
                  width={1600}
                  height={1600}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="h-auto w-full"
                />
              </a>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Click the image to open full size.
              </div>
            </div>
          ) : null}

          <div className="pt-2">
            <a
              href={s.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Open uploaded file
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

