// src/app/api/og/community/[id]/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

// edge-safe ArrayBuffer -> base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function GET(req: Request, context: any) {
  try {
    const communityId = context?.params?.id as string;

    // Fetch community data
    const communityRes = await fetch(
      `https://xboardz.com/api/community/${communityId}`,
      { cache: "no-store" }
    );

    if (!communityRes.ok) {
      throw new Error("Community not found");
    }

    const community = await communityRes.json();

    // Fetch the base OG image
    const baseImageRes = await fetch("https://xboardz.com/og.png");
    const baseImageBuffer = await baseImageRes.arrayBuffer();
    const baseImageBase64 = arrayBufferToBase64(baseImageBuffer);

    // Fetch community image
    let communityImageBase64 = "";
    if (community.image_url) {
      try {
        const communityImageRes = await fetch(community.image_url);
        const communityImageBuffer = await communityImageRes.arrayBuffer();
        communityImageBase64 = arrayBufferToBase64(communityImageBuffer);
      } catch (e) {
        console.error("Failed to fetch community image:", e);
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
          {communityImageBase64 && (
            <div
              style={{
                position: "absolute",
                width: "1200px",
                height: "630px",
                display: "flex",
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
              {/* Dark gradient overlay for blending */}
              <div
                style={{
                  position: "absolute",
                  width: "1200px",
                  height: "630px",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
                  display: "flex",
                }}
              />
            </div>
          )}

          {/* Content overlay */}
          <div
            style={{
              position: "absolute",
              width: "1200px",
              height: "630px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "60px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "20px",
                textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                display: "flex",
              }}
            >
              {community.name || "Community"}
            </div>
            {community.description && (
              <div
                style={{
                  fontSize: "32px",
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  display: "flex",
                  maxWidth: "900px",
                }}
              >
                {community.description.slice(0, 100)}
                {community.description.length > 100 ? "..." : ""}
              </div>
            )}
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

    // Fallback to base image if something goes wrong
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
