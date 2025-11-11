// src/app/community/[id]/layout.tsx
import React from "react";

export const metadata = {
  title: "Community | XBoard",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
