// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./hooks/AuthContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = "https://xboardz.com";
const OG_IMAGE = `${SITE_URL}/og.png`;

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
    // Avoid width/height so we never mismatch the real file dimensions
    images: [OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description: "Find, boost, and grow X communities. Join the best groups on X.",
    images: [OG_IMAGE],
  },

  // If you add a manifest file, declaring it here (and in page.tsx) keeps things consistent.
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
