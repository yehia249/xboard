import { Metadata } from 'next';
import { ReactNode } from 'react';

type Props = {
  params: { id: string };
  children: ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const communityId = params.id;

  try {
    const res = await fetch(`https://xboardz.com/api/community/${communityId}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error('Community not found');

    const community = await res.json();
    const ogImageUrl = `https://xboardz.com/api/og/community/${communityId}`;

    return {
      title: `${community.name} - XBoard`,
      description: community.description || `Join the ${community.name} community on XBoard`,
      openGraph: {
        title: community.name,
        description: community.description || `Join the ${community.name} community on XBoard`,
        url: `https://xboardz.com/community/${communityId}`,
        siteName: 'XBoard',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${community.name} community`,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: community.name,
        description: community.description || `Join the ${community.name} community on XBoard`,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Community - XBoard',
      openGraph: {
        images: ['https://xboardz.com/og.png'],
      },
    };
  }
}

export default function CommunityLayout({ children }: Props) {
  return <>{children}</>;
}