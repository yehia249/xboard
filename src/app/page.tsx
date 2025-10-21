// src/app/page.tsx (Server Component)
import HomeClient from "./HomeClient";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Xboard – Discover & Promote Top X (Twitter) Communities",
  description:
    "Xboard – Discover & Promote X (Twitter) Communities in crypto, gaming, tech, DeFi, NFTs, and more. Connect and promote your favorites now!",
  keywords: [
    // Core
    "X communities",
    "Twitter communities",
    "community sign up",
    "promote X communities",
    "Discord servers",
    "X groups",
    "social communities",
    "gaming communities",
    "tech communities",
    "Xboard sign up",

    // Crypto/Web3 expanded
    "crypto",
    "crypto communities",
    "crypto groups",
    "crypto trading",
    "crypto signals",
    "crypto news",
    "crypto analysis",
    "crypto education",
    "crypto beginners",
    "crypto portfolio",
    "crypto airdrops",
    "airdrops",
    "airdrops farming",
    "airdrops calendar",
    "airdrops strategy",
    "airdrops guides",
    "memecoins",
    "altcoins",
    "Bitcoin",
    "Ethereum",
    "Solana",
    "BNB Chain",
    "Base",
    "Arbitrum",
    "Optimism",
    "Polygon",
    "layer 2",
    "L2",
    "web3",
    "web3 communities",
    "web3 builders",
    "web3 education",
    "blockchain",
    "blockchain communities",
    "DeFi",
    "DeFi communities",
    "yield farming",
    "staking",
    "liquid staking",
    "restaking",
    "DEX",
    "CEX",
    "on-chain",
    "onchain",
    "token launches",
    "IDO",
    "IEO",
    "fair launch",
    "NFT",
    "NFTs",
    "NFT communities",
    "NFT collectors",
    "NFT trading",
    "NFT drops",
    "NFT artists",
    "metaverse",
    "GameFi",
    "play to earn",
    "P2E",
    "airdrops hunters",
    "crypto TA",
    "technical analysis",
    "crypto signals groups",
  ],
  authors: [{ name: "Xboard Team", url: "https://xboardz.com" }],
  creator: "Xboard",
  publisher: "Xboard",
  category: "Community",
  metadataBase: new URL("https://xboardz.com"),
  alternates: {
    canonical: "https://xboardz.com/",
    languages: {
      en: "https://xboardz.com/",
      "en-US": "https://xboardz.com/",
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: "Xboard – Discover & Promote X (Twitter) Communities",
    description:
      "Xboard – Discover & Promote X (Twitter) Communities across crypto, DeFi, NFTs, gaming, and tech.",
    url: "https://xboardz.com/",
    siteName: "Xboard",
    images: [
      {
        url: "https://xboardz.com/xboard-banner.png",
        width: 1200,
        height: 630,
        alt: "Xboard - Discover X Communities",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description:
      "Join Xboard and explore elite X (Twitter) communities in crypto, DeFi, NFTs, gaming, and tech.",
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
  // WebPage JSON-LD
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Xboard – Discover & Promote X (Twitter) Communities",
    description:
      "Xboard – Discover & Promote X (Twitter) Communities across crypto, DeFi, NFTs, gaming, and tech.",
    url: "https://xboardz.com/",
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Xboard",
      url: "https://xboardz.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://xboardz.com/xboard-banner.png",
        width: 1200,
        height: 630,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://xboardz.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  // WebSite JSON-LD
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Xboard",
    alternateName: ["XBoard", "Xboardz"],
    url: "https://xboardz.com/",
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://xboardz.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  // Organization JSON-LD
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Xboard",
    url: "https://xboardz.com/",
    logo: "https://xboardz.com/xboard-banner.png",
    sameAs: [
      "https://twitter.com/xboardz",
      // Add more official profiles when available:
      // "https://www.linkedin.com/company/xboardz",
      // "https://www.facebook.com/xboardz",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@xboardz.com",
        availableLanguage: ["en"],
      },
    ],
  };

  // Breadcrumbs JSON-LD
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://xboardz.com/" },
    ],
  };

  // SiteNavigationElement JSON-LD
  const nav = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: ["Home", "Login", "Sign Up"],
    url: ["https://xboardz.com/", "https://xboardz.com/login", "https://xboardz.com/signup/"],
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
