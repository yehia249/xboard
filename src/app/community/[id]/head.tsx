// app/community/[id]/head.tsx
export default function Head({ params }: { params: { id: string } }) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL || "https://xboardz.com";
    const og = `${base}/community/${params.id}/opengraph-image`;
  
    return (
      <>
        <title>Community | XBoard</title>
        <meta property="og:title" content="XBoard Community" />
        <meta
          property="og:description"
          content="Promote and grow your X community on XBoard."
        />
        <meta property="og:image" content={og} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content={og} />
      </>
    );
  }
  