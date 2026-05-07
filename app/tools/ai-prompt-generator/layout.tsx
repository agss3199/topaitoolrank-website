import { Metadata } from 'next';

const DOMAIN = 'https://topaitoolrank.com';
const BRAND = 'AI Tool Rank';

export const metadata: Metadata = {
  title: 'AI Prompt Generator: Create Better Prompts | AI Tool Rank',
  description: 'Free AI prompt generator for ChatGPT and Claude. Create better prompts with structure and examples. No sign-up required.',
  keywords: ['prompt generator', 'ai prompt engineering', 'chatgpt prompt', 'prompt templates'],
  canonical: `${DOMAIN}/tools/ai-prompt-generator`,
  openGraph: {
    title: 'AI Prompt Generator: Create Better Prompts | AI Tool Rank',
    description: 'Free AI prompt generator for ChatGPT and Claude. Create better prompts with structure.',
    url: `${DOMAIN}/tools/ai-prompt-generator`,
    type: 'website',
    siteName: BRAND,
    images: [
      {
        url: `${DOMAIN}/og-images/ai-prompt-generator.png`,
        width: 1200,
        height: 630,
        alt: 'AI Prompt Generator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Prompt Generator: Create Better Prompts | AI Tool Rank',
    description: 'Free AI prompt generator for ChatGPT and Claude.',
    images: [`${DOMAIN}/og-images/ai-prompt-generator.png`],
  },
};

export default function AIPromptGeneratorLayout({
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
          name: 'AI Prompt Generator',
          description: 'Free tool for creating optimized prompts for ChatGPT, Claude, and other AI models.',
          url: `${DOMAIN}/tools/ai-prompt-generator`,
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
