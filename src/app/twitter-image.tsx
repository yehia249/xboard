// app/twitter-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Xboard – Discover & Promote Top X (Twitter) Communities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

export default function TwitterImage() {
  // Mirror the OG image so both endpoints are identical and cacheable
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 800,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          letterSpacing: -1,
          textAlign: "center",
          padding: 48,
        }}
      >
        Xboard — Discover & Promote X Communities
      </div>
    ),
    size
  );
}
