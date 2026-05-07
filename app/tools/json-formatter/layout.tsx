import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
  description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting. No sign-up required.',
  keywords: ['JSON formatter', 'JSON beautifier', 'JSON validator', 'minify JSON'],
  canonical: `${DOMAIN}/tools/json-formatter`,
  openGraph: {
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
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
    description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
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
