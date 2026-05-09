import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'WhatsApp Link Generator: Create WhatsApp Links | AI Tool Rank',
  description: 'Free WhatsApp link and QR code generator. Create click-to-chat links with pre-filled messages for websites and marketing. No sign-up required. Instant.',
  keywords: ['whatsapp link generator', 'whatsapp qr code', 'whatsapp business', 'click to chat'],
  alternates: {
    canonical: `${DOMAIN}/tools/whatsapp-link-generator`,
  },
  openGraph: {
    title: 'WhatsApp Link Generator: Create WhatsApp Links | AI Tool Rank',
    description: 'Free WhatsApp link and QR code generator. Create click-to-chat links with pre-filled messages for websites and marketing.',
    url: `${DOMAIN}/tools/whatsapp-link-generator`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/whatsapp-link-generator.png`,
        width: 1200,
        height: 630,
        alt: 'WhatsApp Link Generator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp Link Generator: Create WhatsApp Links | AI Tool Rank',
    description: 'Free WhatsApp link and QR code generator. Create click-to-chat links with pre-filled messages for websites and marketing.',
    images: [`${DOMAIN}/og-images/whatsapp-link-generator.png`],
  },
};

export default function WhatsAppLinkGeneratorLayout({
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
          name: 'WhatsApp Link Generator',
          description: 'Free tool for creating clickable WhatsApp chat links and QR codes.',
          url: `${DOMAIN}/tools/whatsapp-link-generator`,
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
