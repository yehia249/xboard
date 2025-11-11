// app/community/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const SITE_URL = "https://xboardz.com";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 👇 your setup expects a Promise
  const { id: communityId } = await params;

  const communityRes = await fetch(
    `${SITE_URL}/api/communities/${communityId}`,
    { cache: "no-store" }
  );

  if (!communityRes.ok) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        XBoard Community
      </div>,
      size
    );
  }

  const community = await communityRes.json();
  const communityName = community?.name ?? "XBoard Community";
  const communityImage: string | null =
    community?.image_url && typeof community.image_url === "string"
      ? community.image_url
      : null;

  const baseOg = `${SITE_URL}/og.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          backgroundColor: "#0f172a",
          overflow: "hidden",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* base OG */}
        <img
          src={baseOg}
          alt="XBoard"
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />

        {/* dark gradient so 2 images blend */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 90%)",
          }}
        />

        {/* left text */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "60px",
            width: "60%",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            xboardz.com/community/{communityId}
          </div>
          <div
            style={{
              fontSize: 56,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "white",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {communityName}
          </div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.75)" }}>
            Discover & promote top X (Twitter) communities.
          </div>
        </div>

        {/* right: designated community image */}
        {communityImage ? (
          <div
            style={{
              position: "absolute",
              right: "48px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "360px",
              height: "360px",
              borderRadius: "28px",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.18)",
              background:
                "radial-gradient(circle at top, rgba(15,23,42,0.5), rgba(15,23,42,0))",
              boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
            }}
          >
            <img
              src={communityImage}
              alt={communityName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%)",
              }}
            />
          </div>
        ) : null}

        {/* badge */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 60,
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.4)",
            color: "white",
            fontSize: 16,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "999px",
              background: "#22c55e",
            }}
          />
          XBoard — Promote your community
        </div>
      </div>
    ),
    { ...size }
  );
}
