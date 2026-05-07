import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'Email Subject Tester: Optimize Subject Lines | AI Tool Rank',
  description: 'Free email subject line tester. Preview subject lines across email clients and detect spam words. No sign-up required.',
  keywords: ['email subject tester', 'subject line preview', 'email marketing tool', 'inbox preview'],
  canonical: `${DOMAIN}/tools/email-subject-tester`,
  openGraph: {
    title: 'Email Subject Tester: Optimize Subject Lines | AI Tool Rank',
    description: 'Free email subject line tester. Preview subject lines across email clients.',
    url: `${DOMAIN}/tools/email-subject-tester`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/email-subject-tester.png`,
        width: 1200,
        height: 630,
        alt: 'Email Subject Tester Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Subject Tester: Optimize Subject Lines | AI Tool Rank',
    description: 'Free email subject line tester. Preview subject lines across email clients.',
    images: [`${DOMAIN}/og-images/email-subject-tester.png`],
  },
};

export default function EmailSubjectTesterLayout({
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
          name: 'Email Subject Tester',
          description: 'Free email subject line tester for optimizing open rates and engagement.',
          url: `${DOMAIN}/tools/email-subject-tester`,
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
