import { notFound } from "next/navigation";
import type { Metadata } from "next";

/**
 * /community is intentionally not a real page (only /community/[id] exists).
 * We serve a proper 404 and ask crawlers not to index this path.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function CommunityIndex() {
  notFound(); // Sends a real 404 (no redirect)
}
