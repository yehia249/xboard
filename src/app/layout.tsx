// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./hooks/AuthContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xboard",
  description: "Discover X communities",
  metadataBase: new URL("https://xboardz.com"),
  alternates: { canonical: "https://xboardz.com/" },

  // ----- Social previews -----
  openGraph: {
    type: "website",
    url: "https://xboardz.com/",
    siteName: "Xboard",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description: "Find, boost, and grow X communities. Join the best groups on X.",
    images: [
      {
        // Place og.png in /public so this resolves to https://xboardz.com/og.png
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Xboard – Discover & Promote X Communities",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xboard – Discover & Promote Top X (Twitter) Communities",
    description: "Find, boost, and grow X communities. Join the best groups on X.",
    images: ["/og.png"], // same image works for Twitter
  },

  // If you add a manifest file, declaring it here (and in page.tsx) keeps things consistent.
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
