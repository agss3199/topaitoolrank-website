import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'Word Counter: Count Words & Characters | AI Tool Rank',
  description: 'Free word counter tool. Instantly count words, characters, sentences, and paragraphs with reading time estimates. No sign-up required. Supports any text.',
  keywords: ['word counter', 'character counter', 'text analyzer', 'reading time calculator'],
  alternates: {
    canonical: `${DOMAIN}/tools/word-counter`,
  },
  openGraph: {
    title: 'Word Counter: Count Words & Characters | AI Tool Rank',
    description: 'Free word counter tool. Instantly count words, characters, sentences, and paragraphs with reading time estimates. No sign-up required.',
    url: `${DOMAIN}/tools/word-counter`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/word-counter.png`,
        width: 1200,
        height: 630,
        alt: 'Word Counter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Word Counter: Count Words & Characters | AI Tool Rank',
    description: 'Free word counter tool. Instantly count words, characters, sentences, and paragraphs with reading time estimates. No sign-up required.',
    images: [`${DOMAIN}/og-images/word-counter.png`],
  },
};

export default function WordCounterLayout({
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
          name: 'Word Counter',
          description: 'Free online word counter and text analyzer with detailed statistics.',
          url: `${DOMAIN}/tools/word-counter`,
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
