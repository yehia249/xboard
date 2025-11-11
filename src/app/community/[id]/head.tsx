// app/community/[id]/head.tsx
const SITE_URL = "https://xboardz.com";

export default async function Head({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 👇 match your layout typing
  const { id } = await params;

  const ogImageUrl = `${SITE_URL}/community/${id}/opengraph-image`;

  return (
    <>
      <title>XBoard Community #{id}</title>
      <meta
        name="description"
        content="Discover and promote X (Twitter) communities on XBoard."
      />

      {/* OG */}
      <meta property="og:title" content={`XBoard Community #${id}`} />
      <meta
        property="og:description"
        content="Promote your community, get visibility, and join top X communities."
      />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:url" content={`${SITE_URL}/community/${id}`} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`XBoard Community #${id}`} />
      <meta
        name="twitter:description"
        content="Promote your community, get visibility, and join top X communities."
      />
      <meta name="twitter:image" content={ogImageUrl} />
    </>
  );
}
