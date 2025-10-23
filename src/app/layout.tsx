// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./hooks/AuthContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = "https://xboardz.com";

export const metadata: Metadata = {
  title: "Xboard",
  description: "Discover X communities",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: `${SITE_URL}/` },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    siteName: "Xboard",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description: "Find, boost, and grow X communities. Join the best groups on X.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        secureUrl: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Xboard – Discover X Communities",
      },
    ],
  },

  // TwitterImageDescriptor with type/width/height/secureUrl
  twitter: {
    card: "summary_large_image",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description: "Find, boost, and grow X communities. Join the best groups on X.",
    images: [
      {
        url: `${SITE_URL}/twitter-image`,
        secureUrl: `${SITE_URL}/twitter-image`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Xboard – Discover X Communities",
      },
    ],
    site: "@xboardz",
    creator: "@xboardz",
  },

  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
