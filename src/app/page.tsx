// app/page.tsx (Server Component)
import HomeClient from "./HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XBoard – Discover & Promote Communities",
  description: "Find and promote X (Twitter) communities easily with XBoard.",
  openGraph: {
    title: "XBoard",
    description: "Find and promote X (Twitter) communities easily with XBoard.",
    url: "https://xboardz.com",
    images: [
      {
        url: "https://xboardz.com/xboard-banner.png",
        width: 1200,
        height: 630,
        alt: "XBoard – Discover & Promote Communities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XBoard – Discover & Promote Communities",
    description: "Find and promote X (Twitter) communities easily with XBoard.",
    images: ["https://xboardz.com/xboard-banner.png"],
  },
};

export default function Page() {
  return <HomeClient />;
}
