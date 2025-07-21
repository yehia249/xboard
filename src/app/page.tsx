// app/page.tsx (Server Component)
import HomeClient from "./HomeClient";
import type { Metadata, Viewport } from "next";

// ✅ Fix for Next.js warning: viewport should be defined separately
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Sign Up on XBoard – Discover & Promote Top X (Twitter) Communities",
  description:
    "Sign up on XBoard today and explore the best X (Twitter) communities in crypto, gaming, tech, and more. Connect and promote your favorites now!",
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
    canonical: "https://xboardz.com/signup",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Sign Up on XBoard – Discover & Promote X (Twitter) Communities",
    description:
      "Sign up to XBoard and discover thousands of X (Twitter) communities across gaming, crypto, tech, and more.",
    url: "https://xboardz.com/signup",
    siteName: "XBoard",
    images: [
      {
        url: "https://xboardz.com/xboard-banner.png", // Ensure image is optimized 1200x630
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
    title: "Sign Up on XBoard – Discover & Promote X (Twitter) Communities",
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
  verification: {
    google: "your-google-verification-code", // Replace with actual code
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Sign Up on XBoard",
      description:
        "Sign up on XBoard to discover and promote the best X (Twitter) communities.",
      url: "https://xboardz.com/signup",
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
    }),
  },
};

export default function Page() {
  return (
    <>
      {/* ✅ Visible H1 for SEO */}
      <h1 className="sr-only">
        Sign Up to Discover and Promote X (Twitter) Communities on XBoard
      </h1>
      <HomeClient />
    </>
  );
}
