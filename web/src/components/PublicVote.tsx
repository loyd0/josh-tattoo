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
  // Capture this request's time on the server so hydration starts at the same second.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  return (
    <VoteBoard
      entries={ordered}
      endsAt={endsAt}
      initialNow={initialNow}
      endsLabel={endsLabel}
      preview={preview}
      banner={banner}
    />
  );
}
