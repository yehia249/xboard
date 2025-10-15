// src/app/page.tsx (Server Component)
import HomeClient from "./HomeClient";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "XBoard – Discover & Promote Top X (Twitter) Communities",
  description:
    "XBoard – Discover & Promote X (Twitter) Communities in crypto, gaming, tech, and more. Connect and promote your favorites now!",
  keywords: [
    "X communities",
    "Twitter communities",
    "community sign up",
    "promote X communities",
    "Discord servers",
    "X groups",
    "social communities",
    "crypto communities",
    "gaming communities",
    "tech communities",
    "XBoard sign up",
  ],
  authors: [{ name: "XBoard Team", url: "https://xboardz.com" }],
  creator: "XBoard",
  publisher: "XBoard",
  metadataBase: new URL("https://xboardz.com"),
  alternates: {
    canonical: "https://xboardz.com",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "XBoard – Discover & Promote X (Twitter) Communities",
    description:
      "XBoard – Discover & Promote X (Twitter) Communities across gaming, crypto, tech, and more.",
    url: "https://xboardz.com",
    siteName: "XBoard",
    images: [
      {
        url: "https://xboardz.com/xboard-banner.png",
        width: 1200,
        height: 630,
        alt: "XBoard - Discover X Communities",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XBoard – Discover & Promote Top X (Twitter) Communities",
    description:
      "Join XBoard and explore the best X (Twitter) communities. Promote your favorites and connect with others.",
    images: ["https://xboardz.com/xboard-banner.png"],
    creator: "@xboardz",
    site: "@xboardz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function Page() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "XBoard – Discover & Promote X (Twitter) Communities",
    description:
      "XBoard – Discover & Promote X (Twitter) Communities across gaming, crypto, tech, and more.",
    url: "https://xboardz.com",
    publisher: {
      "@type": "Organization",
      name: "XBoard",
      url: "https://xboardz.com",
      logo: {
        "@type": "ImageObject",
        url: "https://xboardz.com/xboard-banner.png",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://xboardz.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <h1 className="sr-only">
        XBoard – Discover & Promote X (Twitter) Communities across gaming, crypto, tech, and more.
      </h1>
      <HomeClient />
      <Script
        id="ld-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}