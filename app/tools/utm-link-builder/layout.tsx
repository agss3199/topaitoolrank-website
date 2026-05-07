import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'UTM Link Builder: Track Campaign Links | AI Tool Rank',
  description: 'Free UTM link builder. Create tracking links for Google Analytics campaigns instantly. No sign-up required.',
  keywords: ['utm builder', 'utm parameter', 'google analytics', 'campaign tracking', 'url builder'],
  canonical: `${DOMAIN}/tools/utm-link-builder`,
  openGraph: {
    title: 'UTM Link Builder: Track Campaign Links | AI Tool Rank',
    description: 'Free UTM link builder. Create tracking links for Google Analytics campaigns instantly.',
    url: `${DOMAIN}/tools/utm-link-builder`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/utm-link-builder.png`,
        width: 1200,
        height: 630,
        alt: 'UTM Link Builder Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UTM Link Builder: Track Campaign Links | AI Tool Rank',
    description: 'Free UTM link builder. Create tracking links for Google Analytics campaigns.',
    images: [`${DOMAIN}/og-images/utm-link-builder.png`],
  },
};

export default function UTMLinkBuilderLayout({
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
          name: 'UTM Link Builder',
          description: 'Free tool for building UTM-tagged links for Google Analytics campaign tracking.',
          url: `${DOMAIN}/tools/utm-link-builder`,
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
