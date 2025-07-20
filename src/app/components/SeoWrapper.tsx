"use client";

import { DefaultSeo } from "next-seo";
import SEO from "@/app/next-seo.config"; // ✅ Adjust the path if needed

export default function SeoWrapper() {
  return <DefaultSeo {...SEO} />;
}
