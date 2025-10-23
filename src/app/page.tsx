// src/app/page.tsx (Server Component)
import HomeClient from "./HomeClient";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const SITE_URL = "https://xboardz.com";
const OG_IMAGE = `${SITE_URL}/og.png?v=99`; // static 1200x600 PNG

export const metadata: Metadata = {
  title: "Xboard – Discover & Promote Top X (Twitter) Communities",
  description:
    "Xboard – Discover & Promote X (Twitter) Communities in crypto, gaming, tech, DeFi, NFTs, and more. Connect and promote your favorites now!",
  keywords: [
    "X communities", "Twitter communities", "community sign up", "promote X communities",
    "Discord servers", "X groups", "social communities", "gaming communities",
    "tech communities", "Xboard sign up", "crypto", "crypto communities",
    "crypto groups", "crypto trading", "crypto signals", "crypto news", "crypto analysis",
    "crypto education", "crypto beginners", "crypto portfolio", "crypto airdrops",
    "airdrops", "airdrops farming", "airdrops calendar", "airdrops strategy",
    "airdrops guides", "memecoins", "altcoins", "Bitcoin", "Ethereum", "Solana",
    "BNB Chain", "Base", "Arbitrum", "Optimism", "Polygon", "layer 2", "L2", "web3",
    "web3 communities", "web3 builders", "web3 education", "blockchain",
    "blockchain communities", "DeFi", "DeFi communities", "yield farming", "staking",
    "liquid staking", "restaking", "DEX", "CEX", "on-chain", "onchain", "token launches",
    "IDO", "IEO", "fair launch", "NFT", "NFTs", "NFT communities", "NFT collectors",
    "NFT trading", "NFT drops", "NFT artists", "metaverse", "GameFi", "play to earn",
    "P2E", "airdrops hunters", "crypto TA", "technical analysis", "crypto signals groups"
  ],
  authors: [{ name: "Xboard Team", url: SITE_URL }],
  creator: "Xboard",
  publisher: "Xboard",
  category: "Community",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: {
      en: `${SITE_URL}/`,
      "en-US": `${SITE_URL}/`,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },

  // Open Graph
  openGraph: {
    title: "Xboard – Discover & Promote X (Twitter) Communities",
    description:
      "Xboard – Discover & Promote X (Twitter) Communities across crypto, DeFi, NFTs, gaming, and tech.",
    url: `${SITE_URL}/`,
    siteName: "Xboard",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 600,
        alt: "Xboard - Discover X Communities",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter card – use TwitterImageDescriptor (object) with type/width/height
  twitter: {
    card: "summary_large_image",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description:
      "Join Xboard and explore elite X (Twitter) communities in crypto, DeFi, NFTs, gaming, and tech.",
    creator: "@xboardz",
    site: "@xboardz",
    images: [
      {
        url: "https://xboardz.com/og.png?v=999",
        width: 1200,
        height: 600,
        type: "image/png",
        alt: "Xboard – Discover X Communities",
      },
    ],
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function Page() {
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}/`,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Xboard",
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: OG_IMAGE,
        width: 1200,
        height: 600,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Xboard",
    alternateName: ["XBoard", "Xboardz"],
    url: `${SITE_URL}/`,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Xboard",
    url: `${SITE_URL}/`,
    logo: OG_IMAGE,
    sameAs: ["https://twitter.com/xboardz"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@xboardz.com",
        availableLanguage: ["en"],
      },
    ],
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    ],
  };

  const nav = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: ["Home", "Login", "Sign Up"],
    url: [`${SITE_URL}/`, `${SITE_URL}/login`, `${SITE_URL}/signup/`],
  };

  return (
    <>
      <h1 className="sr-only">
        Xboard – Discover & Promote X (Twitter) Communities across crypto, DeFi, NFTs, gaming, and tech.
      </h1>
      <HomeClient />
      <Script id="ld-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }} />
      <Script id="ld-webpage" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }} />
      <Script id="ld-organization" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <Script id="ld-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <Script id="ld-sitenav" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(nav) }} />
    </>
  );
}
