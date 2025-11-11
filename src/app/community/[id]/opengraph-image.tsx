// app/community/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// helper to fetch the community data
async function getCommunity(id: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://xboardz.com";
  try {
    const res = await fetch(`${base}/api/communities/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({
  params,
}: {
  params: { id: string };
}) {
  const community = await getCommunity(params.id);

  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL || "https://xboardz.com";

  // your global OG
  const globalOg = `${siteBase}/og.png`;

  const name = community?.name || "XBoard Community";
  const communityImage =
    community?.image_url ||
    `${siteBase}/og.png`; // fallback if comm has no image

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          backgroundColor: "#020617",
          overflow: "hidden",
        }}
      >
        {/* 1) your global og.png as the base */}
        <img
          src={globalOg}
          alt="XBoard"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 1,
          }}
        />

        {/* 2) dark gradient overlay to make text readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 85%)",
          }}
        />

        {/* 3) content area */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            gap: 32,
          }}
        >
          {/* LEFT: text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 560,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 10,
                alignItems: "center",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "6px 16px",
                width: "fit-content",
              }}
            >
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>
                XBoard
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
                Community Listing
              </span>
            </div>

            <h1
              style={{
                fontSize: 58,
                lineHeight: 1.03,
                margin: 0,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </h1>

            <p
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.65)",
                maxWidth: 500,
              }}
            >
              Promote, boost, and get seen by X users.
            </p>

            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              xboardz.com
            </p>
          </div>

          {/* RIGHT: the designated community image in a glass card */}
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: 28,
              overflow: "hidden",
              background:
                "linear-gradient(160deg, rgba(2,6,23,0.1), rgba(255,255,255,0))",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 18px 44px rgba(0,0,0,0.35)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* background gradient from global OG to comm image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(145deg, rgba(3,7,18,0.9) 0%, rgba(3,7,18,0) 40%), url(${communityImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "saturate(1.15)",
              }}
            />

            {/* small label on top right */}
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "4px 12px",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                Designated image
              </span>
            </div>
          </div>
        </div>

        {/* extra edge fade so it looks clean in preview */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 120,
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(2,6,23,0) 0%, rgba(2,6,23,1) 100%)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
