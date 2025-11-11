// app/community/[id]/head.tsx

export default async function Head({ params }: { params: { id: string } }) {
    const id = params.id;
  
    // optional: you can also fetch the community here to set <title>
    return (
      <>
        <title>Community {id} · XBoard</title>
        <meta name="description" content="Discover, post and promote your X community on XBoard." />
  
        {/* OG / Twitter */}
        <meta property="og:title" content={`Community ${id} · XBoard`} />
        <meta
          property="og:image"
          content={`https://xboardz.com/community/${id}/opengraph-image`}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://xboardz.com/community/${id}`} />
  
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={`https://xboardz.com/community/${id}/opengraph-image`}
        />
      </>
    );
  }
  