// app/community/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function OpengraphImage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  // 1) get community data from YOUR api
  // you used /api/communities/[id] in your client file, so I’ll use that
  let community: any = null;
  try {
    const res = await fetch(`https://xboardz.com/api/communities/${id}`, {
      // let it revalidate every minute
      next: { revalidate: 60 },
    });

    if (res.ok) {
      community = await res.json();
    }
  } catch (e) {
    // ignore, we’ll just fallback
  }

  const communityName =
    community?.name?.toString()?.slice(0, 60) || `Community #${id}`;
  const communityImage = community?.image_url || null;

  // your global OG
  const baseBg = "https://xboardz.com/og.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          backgroundColor: "#000",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* layer 1: your global og.png */}
        <img
          src={baseBg}
          alt="XBoard background"
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />

        {/* layer 2: community image on the right (if exists) */}
        {communityImage ? (
          <img
            src={communityImage}
            alt={communityName}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "54%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* gradient to blend between the two */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 48%, rgba(0,0,0,0) 65%)",
          }}
        />

        {/* content on left */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "48px 54px",
            width: "56%",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              background: "rgba(99,102,241,0.14)",
              border: "1px solid rgba(99,102,241,0.35)",
              padding: "6px 14px",
              borderRadius: 999,
              color: "#fff",
              fontSize: 16,
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
            XBoard · X Communities
          </div>

          <h1
            style={{
              fontSize: 58,
              lineHeight: 1,
              color: "#fff",
              letterSpacing: "-0.03em",
              maxWidth: "95%",
            }}
          >
            {communityName}
          </h1>

          <p
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.7)",
              maxWidth: "95%",
            }}
          >
            Discover, post and promote your X community.
          </p>

          {/* little footer */}
          <div
            style={{
              marginTop: "auto",
              fontSize: 18,
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 8,
                height: 44,
                background:
                  "linear-gradient(180deg, #6366F1 0%, rgba(99,102,241,0) 100%)",
                borderRadius: 99,
              }}
            />
            xboardz.com/community/{id}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
