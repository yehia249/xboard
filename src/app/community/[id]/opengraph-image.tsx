// app/community/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function getCommunity(id: string) {
  try {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL || "https://xboardz.com";
    const res = await fetch(`${base}/api/communities/${id}`, {
      // make sure it works on edge
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function OpenGraphImage({
  params,
}: {
  params: { id: string };
}) {
  const community = await getCommunity(params.id);

  const name = community?.name || "XBoard Community";
  const imageUrl =
    community?.image_url ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/og.png`
      : "https://xboardz.com/og.png");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top, #10131a 0%, #020617 45%, #000 100%)",
          position: "relative",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        {/* background image with soft opacity */}
        <img
          src={imageUrl}
          alt={name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
            filter: "blur(1.5px)",
          }}
        />

        {/* gradient overlay to make text readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 80%)",
          }}
        />

        {/* main content */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
            padding: "60px 70px",
            width: "100%",
          }}
        >
          {/* mini top label */}
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 999,
              padding: "6px 16px",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 20, color: "white" }}>XBoard</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
              Community Listing
            </span>
          </div>

          {/* title */}
          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                fontSize: 56,
                lineHeight: 1.05,
                margin: 0,
                color: "white",
              }}
            >
              {name}
            </h1>
          </div>

          <p
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 540,
            }}
          >
            Discover & promote your X community on XBoard.
          </p>

          {/* bottom small */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span style={{ fontSize: 20, color: "white" }}>★</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>
              xboardz.com
            </span>
          </div>
        </div>

        {/* right side actual avatar/banner */}
        <div
          style={{
            position: "absolute",
            right: 56,
            top: 56,
            width: 220,
            height: 220,
            borderRadius: 32,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.28)",
            background:
              "linear-gradient(140deg, rgba(0,0,0,0.15), rgba(255,255,255,0))",
          }}
        >
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
