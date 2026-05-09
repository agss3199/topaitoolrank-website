import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'WhatsApp Formatter: Format Messages | AI Tool Rank',
  description: 'Free WhatsApp message formatter. Apply bold, italic, strikethrough, and monospace styling to your messages before sending. No sign-up required. Easy to use.',
  keywords: ['whatsapp formatter', 'whatsapp text formatting', 'whatsapp bold text', 'message formatter'],
  alternates: {
    canonical: `${DOMAIN}/tools/whatsapp-message-formatter`,
  },
  openGraph: {
    title: 'WhatsApp Formatter: Format Messages | AI Tool Rank',
    description: 'Free WhatsApp message formatter. Apply bold, italic, strikethrough, and monospace styling to your messages before sending.',
    url: `${DOMAIN}/tools/whatsapp-message-formatter`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/whatsapp-message-formatter.png`,
        width: 1200,
        height: 630,
        alt: 'WhatsApp Message Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp Formatter: Format Messages | AI Tool Rank',
    description: 'Free WhatsApp message formatter. Apply bold, italic, strikethrough, and monospace styling to your messages before sending.',
    images: [`${DOMAIN}/og-images/whatsapp-message-formatter.png`],
  },
};

export default function WhatsAppMessageFormatterLayout({
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
          name: 'WhatsApp Message Formatter',
          description: 'Free tool for formatting WhatsApp messages with bold, italic, and other text styles.',
          url: `${DOMAIN}/tools/whatsapp-message-formatter`,
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
