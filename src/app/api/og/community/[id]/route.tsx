// src/app/api/og/community/[id]/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

// helper to convert ArrayBuffer -> base64 in edge runtime
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available on the edge runtime
  return btoa(binary);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;

    // fetch community data from your API
    const communityRes = await fetch(
      `https://xboardz.com/api/community/${communityId}`,
      { cache: "no-store" }
    );

    if (!communityRes.ok) {
      throw new Error("Community not found");
    }

    const community = await communityRes.json();

    // base OG image
    const baseImageRes = await fetch("https://xboardz.com/og.png");
    const baseImageBuffer = await baseImageRes.arrayBuffer();
    const baseImageBase64 = arrayBufferToBase64(baseImageBuffer);

    // community image (optional)
    let communityImageBase64 = "";
    if (community.image_url) {
      try {
        const communityImageRes = await fetch(community.image_url);
        const communityImageBuffer = await communityImageRes.arrayBuffer();
        communityImageBase64 = arrayBufferToBase64(communityImageBuffer);
      } catch (err) {
        // if the comm image fails we just skip it
        console.error("Failed to fetch community image:", err);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "#000",
          }}
        >
          {/* Base XBoard background */}
          <img
            src={`data:image/png;base64,${baseImageBase64}`}
            style={{
              position: "absolute",
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />

          {/* Community image with gradient blend */}
          {communityImageBase64 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
              }}
            >
              <img
                src={`data:image/jpeg;base64,${communityImageBase64}`}
                style={{
                  width: "1200px",
                  height: "630px",
                  objectFit: "cover",
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)",
                }}
              />
            </div>
          ) : null}

          {/* Content overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "60px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)",
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 20,
                textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                lineHeight: 1.05,
              }}
            >
              {community.name || "Community"}
            </div>

            {community.description ? (
              <div
                style={{
                  fontSize: 30,
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  maxWidth: 900,
                  lineHeight: 1.3,
                  display: "flex",
                }}
              >
                {community.description.length > 120
                  ? community.description.slice(0, 120) + "..."
                  : community.description}
              </div>
            ) : null}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    // if something goes wrong, return the base image as png
    const baseImageRes = await fetch("https://xboardz.com/og.png");
    const baseImageBuffer = await baseImageRes.arrayBuffer();

    return new Response(baseImageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
}
