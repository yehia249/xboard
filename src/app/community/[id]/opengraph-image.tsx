// app/community/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // make sure each /community/[id] is generated
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

async function getCommunity(id: string) {
  try {
    const res = await fetch(`https://xboardz.com/api/community/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function OpengraphImage({
  params,
}: {
  params: { id: string };
}) {
  const community = await getCommunity(params.id);

  const name =
    typeof community?.name === "string" && community.name.trim().length > 0
      ? community.name
      : "XBoard Community";

  const description =
    typeof community?.description === "string" &&
    community.description.trim().length > 0
      ? community.description.slice(0, 140)
      : "Discover, list, and boost X (Twitter) communities on XBoard.";

  const communityImage =
    typeof community?.image_url === "string" &&
    community.image_url.trim().length > 0
      ? community.image_url
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#020617",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* base layer: your global OG */}
        <img
          src="https://xboardz.com/og.png"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.55)",
          }}
        />

        {/* optional community image on the right */}
        {communityImage ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "55%",
              height: "100%",
              overflow: "hidden",
              borderTopLeftRadius: 36,
              borderBottomLeftRadius: 36,
            }}
          >
            <img
              src={communityImage}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* dark gradient to blend into the base */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.4) 50%, #020617 100%)",
              }}
            />
          </div>
        ) : null}

        {/* text content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            height: "100%",
            padding: "54px 56px",
            maxWidth: "56%",
            justifyContent: "center",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: 16,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            xboardz.com
          </div>
          <div
            style={{
              fontSize: name.length > 28 ? 50 : 58,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.25,
              color: "rgba(226, 232, 255, 0.88)",
            }}
          >
            {description}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.13), rgba(76, 81, 191, 0))",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              padding: "10px 18px",
              borderRadius: 999,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "9999px",
                background: "#38bdf8",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.9)",
              }}
            />
            <span style={{ fontSize: 18, opacity: 0.95 }}>
              XBoard community preview
            </span>
          </div>
        </div>

        {/* left vignette so text is readable even if remote imgs fail */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 0% 50%, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0) 46%)",
            pointerEvents: "none",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
