// app/community/[id]/head.tsx

async function getCommunity(id: string) {
    try {
      const res = await fetch(`https://xboardz.com/api/community/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }
  
  export default async function Head({
    params,
  }: {
    params: { id: string };
  }) {
    const community = await getCommunity(params.id);
  
    const title = community?.name
      ? `${community.name} | XBoard`
      : "XBoard Community";
  
    const description =
      community?.description ||
      "Discover, list, and boost X (Twitter) communities on XBoard.";
  
    // this points to the OG route we just made above
    const ogImage = `https://xboardz.com/community/${params.id}/opengraph-image`;
  
    const url = `https://xboardz.com/community/${params.id}`;
  
    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
  
        {/* Open Graph / Facebook / Discord */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
  
        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </>
    );
  }
  