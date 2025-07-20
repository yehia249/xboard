import CommunityPageContent from '../CommunityPageContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XBoard – Sign Up to Discover & Promote X (Twitter) Communities',
  description:
    'Join XBoard today and discover the best X (Twitter) communities across crypto, gaming, tech, fitness, and more. Sign up and start promoting your communities now!',
  keywords: [
    'X communities', 'Twitter communities', 'community sign up',
    'promote X communities', 'Discord servers', 'X groups', 'social communities',
    'crypto communities', 'gaming communities', 'tech communities', 'XBoard sign up'
  ],
  authors: [{ name: 'XBoard Team', url: 'https://xboardz.com' }],
  creator: 'XBoard',
  publisher: 'XBoard',
  metadataBase: new URL('https://xboardz.com'),
  alternates: {
    canonical: 'https://xboardz.com/signup',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'XBoard – Sign Up Today',
    description:
      'Sign up to XBoard and discover thousands of X (Twitter) communities across gaming, crypto, tech, and more.',
    url: 'https://xboardz.com/signup',
    siteName: 'XBoard',
    images: [
      {
        url: 'https://xboardz.com/xboard-banner.png', // Replace with actual banner
        width: 1200,
        height: 630,
        alt: 'XBoard - Discover X Communities',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XBoard – Sign Up Today',
    description:
      'Join XBoard and discover the best X (Twitter) communities. Promote your favorites and connect with others.',
    images: ['https://xboardz.com/xboard-banner.png'],
    creator: '@xboardz',
    site: '@xboardz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // Replace when ready
  },
  verification: {
    google: 'your-google-verification-code', // Replace later
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'XBoard – Sign Up',
      description:
        'Sign up on XBoard to discover and promote the best X (Twitter) communities.',
      url: 'https://xboardz.com/signup',
      publisher: {
        '@type': 'Organization',
        name: 'XBoard',
        url: 'https://xboardz.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://xboardz.com/xboard-banner.png', // Replace with actual logo if available
        },
      },
    }),
  },
};

export default function CommunityPage() {
  return <CommunityPageContent />;
}