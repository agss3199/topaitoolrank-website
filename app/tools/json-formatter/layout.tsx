import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
  description: 'Free JSON formatter and validator. Beautify, minify, and debug JSON instantly with real-time syntax highlighting. No sign-up required. Built for developers.',
  keywords: ['JSON formatter', 'JSON beautifier', 'JSON validator', 'minify JSON'],
  alternates: {
    canonical: `${DOMAIN}/tools/json-formatter`,
  },
  openGraph: {
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter and validator. Beautify, minify, and debug JSON instantly with real-time syntax highlighting. No sign-up required.',
    url: `${DOMAIN}/tools/json-formatter`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/json-formatter.png`,
        width: 1200,
        height: 630,
        alt: 'JSON Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter and validator. Beautify, minify, and debug JSON instantly with real-time syntax highlighting. No sign-up required.',
    images: [`${DOMAIN}/og-images/json-formatter.png`],
  },
};

export default function JsonFormatterLayout({
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
          name: 'JSON Formatter',
          description: 'Free online JSON formatter and validator with syntax highlighting.',
          url: `${DOMAIN}/tools/json-formatter`,
          applicationCategory: 'Utility',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          author: {
            '@type': 'Organization',
            name: BRAND,
            url: DOMAIN,
          },
        })}
      </script>
    </>
  );
}
