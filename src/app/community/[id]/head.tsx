// app/community/[id]/head.tsx
export default function Head({ params }: { params: { id: string } }) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL || "https://xboardz.com";
    const ogUrl = `${base}/community/${params.id}/opengraph-image`;
  
    return (
      <>
        <title>XBoard Community</title>
        <meta
          name="description"
          content="XBoard — discover and promote X (Twitter) communities."
        />
        <meta property="og:title" content="XBoard Community" />
        <meta
          property="og:description"
          content="Promote, boost, and get seen by X users."
        />
        <meta property="og:image" content={ogUrl} />
        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content={ogUrl} />
      </>
    );
  }
  