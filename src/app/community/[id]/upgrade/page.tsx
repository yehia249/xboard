// app/community/[id]/page.tsx
import CommunityClient from "../CommunityClient";

const SITE_URL = "https://xboardz.com";

// this runs on the server – crawlers can see this
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // fetch the community from your API (same endpoint you use in client)
  const res = await fetch(`${SITE_URL}/api/communities/${id}`, {
    // make sure it doesn’t cache forever
    cache: "no-store",
  });

  // fallback if no comm
  if (!res.ok) {
    const url = `${SITE_URL}/community/${id}`;
    return {
      title: `XBoard Community`,
      description: "Discover and promote X (Twitter) communities on XBoard.",
      openGraph: {
        title: `XBoard Community`,
        description: "Discover and promote X (Twitter) communities on XBoard.",
        url,
        images: [`${SITE_URL}/og.png`],
      },
      twitter: {
        card: "summary_large_image",
        title: `XBoard Community`,
        description: "Discover and promote X (Twitter) communities on XBoard.",
        images: [`${SITE_URL}/og.png`],
      },
    };
  }

  const community = await res.json();
  const name = community?.name ?? `XBoard Community #${id}`;
  const imageUrl =
    typeof community?.image_url === "string" && community.image_url.length > 0
      ? community.image_url
      : `${SITE_URL}/og.png`;

  const url = `${SITE_URL}/community/${id}`;

  return {
    title: name,
    description: "Discover and promote X (Twitter) communities on XBoard.",
    openGraph: {
      title: name,
      description: "Discover and promote X (Twitter) communities on XBoard.",
      url,
      // 👇 THIS is the actual designated image
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: "Discover and promote X (Twitter) communities on XBoard.",
      images: [imageUrl],
    },
  };
}

export default function CommunityPage({
  params,
}: {
  params: { id: string };
}) {
  // render your original client page
  return <CommunityClient />;
}
