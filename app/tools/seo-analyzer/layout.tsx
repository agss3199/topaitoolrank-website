import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'SEO Analyzer: Check On-Page SEO | AI Tool Rank',
  description: 'Free SEO analyzer tool. Check on-page SEO scores and get optimization recommendations. No sign-up required.',
  keywords: ['seo analyzer', 'seo checker', 'website audit', 'seo tool', 'search engine optimization'],
  canonical: `${DOMAIN}/tools/seo-analyzer`,
  openGraph: {
    title: 'SEO Analyzer: Check On-Page SEO | AI Tool Rank',
    description: 'Free SEO analyzer tool. Check on-page SEO scores and get optimization recommendations.',
    url: `${DOMAIN}/tools/seo-analyzer`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/seo-analyzer.png`,
        width: 1200,
        height: 630,
        alt: 'SEO Analyzer Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Analyzer: Check On-Page SEO | AI Tool Rank',
    description: 'Free SEO analyzer tool. Check on-page SEO scores and get optimization recommendations.',
    images: [`${DOMAIN}/og-images/seo-analyzer.png`],
  },
};

export default function SEOAnalyzerLayout({
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
          name: 'SEO Analyzer',
          description: 'Free tool for analyzing on-page SEO scores and getting optimization recommendations.',
          url: `${DOMAIN}/tools/seo-analyzer`,
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
