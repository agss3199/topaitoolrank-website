import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'Palm Reader: AI-Powered Palm Reading | AI Tool Rank',
  description: 'Free AI palm reader. Upload or capture a photo of your palm and get instant readings of your life, heart, head, fate, and sun lines. Made by Abhishek Gupta for MGMT6095.',
  keywords: ['palm reader', 'palm reading', 'AI palm reader', 'palmistry', 'hand reading'],
  alternates: {
    canonical: `${DOMAIN}/tools/palm-reader`,
  },
  openGraph: {
    title: 'Palm Reader: AI-Powered Palm Reading | AI Tool Rank',
    description: 'Free AI palm reader. Upload or capture a photo of your palm and get instant readings of your life, heart, head, fate, and sun lines.',
    url: `${DOMAIN}/tools/palm-reader`,
    type: 'website',
    siteName: BRAND,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palm Reader: AI-Powered Palm Reading | AI Tool Rank',
    description: 'Free AI palm reader. Upload or capture a photo of your palm and get instant readings of your life, heart, head, fate, and sun lines.',
  },
};

export default function PalmReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Palm Reader',
          description: 'Free AI-powered palm reading tool. Analyze life, heart, head, fate, and sun lines from a photo of your palm.',
          url: `${DOMAIN}/tools/palm-reader`,
          applicationCategory: 'Entertainment',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          author: {
            '@type': 'Person',
            name: 'Abhishek Gupta',
          },
        })}
      </script>
    </>
  );
}
