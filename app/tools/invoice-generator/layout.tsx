import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'Invoice Generator: Create Professional Invoices | AI Tool Rank',
  description: 'Free invoice generator tool. Create professional invoices in seconds for freelancers and small businesses. No sign-up required.',
  keywords: ['invoice generator', 'invoice maker', 'free invoice', 'professional invoice'],
  canonical: `${DOMAIN}/tools/invoice-generator`,
  openGraph: {
    title: 'Invoice Generator: Create Professional Invoices | AI Tool Rank',
    description: 'Free invoice generator tool. Create professional invoices in seconds.',
    url: `${DOMAIN}/tools/invoice-generator`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/invoice-generator.png`,
        width: 1200,
        height: 630,
        alt: 'Invoice Generator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoice Generator: Create Professional Invoices | AI Tool Rank',
    description: 'Free invoice generator tool. Create professional invoices in seconds.',
    images: [`${DOMAIN}/og-images/invoice-generator.png`],
  },
};

export default function InvoiceGeneratorLayout({
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
          name: 'Invoice Generator',
          description: 'Free tool for creating professional invoices for freelancers and small businesses.',
          url: `${DOMAIN}/tools/invoice-generator`,
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
