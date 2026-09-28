import { cookies } from "next/headers";

import { VoteBoard, type VoteCard } from "@/components/VoteBoard";
import { DEVICE_COOKIE } from "@/lib/voting/device";
import { formatLondonLong } from "@/lib/voting/londonTime";
import { seededShuffle } from "@/lib/voting/shuffle";

export async function PublicVote({
  entries,
  endsAt,
  preview = false,
  banner = null,
}: {
  entries: VoteCard[];
  endsAt: string | null;
  preview?: boolean;
  banner?: string | null;
}) {
  const jar = await cookies();
  const seed = jar.get(DEVICE_COOKIE)?.value ?? "pending-device";
  const ordered = seededShuffle(entries, seed);
  const endsLabel = endsAt ? formatLondonLong(new Date(endsAt)) : null;
  return (
    <VoteBoard
      entries={ordered}
      endsLabel={endsLabel}
      preview={preview}
      banner={banner}
    />
  );
}
