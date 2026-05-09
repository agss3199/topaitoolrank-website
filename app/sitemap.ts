/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml from all published blog articles + static pages + tools
 */

import { MetadataRoute } from 'next';
import { getAllPosts, slugifyTag } from '@/app/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://topaitoolrank.com';
  const posts = await getAllPosts();

  // Marketing & core pages
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
  ];

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  // Blog articles (published only)
  const articleUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Blog tag index pages
  const tagUrls: MetadataRoute.Sitemap = (() => {
    const tagsWithDates = new Map<string, number>();

    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        const slug = slugifyTag(tag);
        const postDate = new Date(post.publishedAt).getTime();
        const currentMax = tagsWithDates.get(slug) || 0;
        if (postDate > currentMax) {
          tagsWithDates.set(slug, postDate);
        }
      });
    });

    return Array.from(tagsWithDates.entries()).map(([slug, timestamp]) => ({
      url: `${baseUrl}/blogs/tag/${slug}`,
      lastModified: new Date(timestamp),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  })();

  // Blog category index pages
  const categoryUrls: MetadataRoute.Sitemap = (() => {
    const categoriesWithDates = new Map<string, number>();

    posts.forEach((post) => {
      if (post.category) {
        const postDate = new Date(post.publishedAt).getTime();
        const currentMax = categoriesWithDates.get(post.category) || 0;
        if (postDate > currentMax) {
          categoriesWithDates.set(post.category, postDate);
        }
      }
    });

    return Array.from(categoriesWithDates.entries()).map(([category, timestamp]) => ({
      url: `${baseUrl}/blogs/category/${encodeURIComponent(category)}`,
      lastModified: new Date(timestamp),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  })();

  // Tool pages (fixed lastModified date instead of dynamic new Date())
  const toolPublishDate = new Date('2026-05-07'); // Tool articles published date
  const toolPages: MetadataRoute.Sitemap = [
    // Tools directory listing page
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date('2026-05-08'),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    // Tier 1 tools (primary SEO focus) - priority 0.8
    {
      url: `${baseUrl}/tools/json-formatter`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/word-counter`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/email-subject-tester`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    // Tier 2 tools - priority 0.7
    {
      url: `${baseUrl}/tools/ai-prompt-generator`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/utm-link-builder`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/invoice-generator`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/seo-analyzer`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/whatsapp-link-generator`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/whatsapp-message-formatter`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    // WA-Sender tool
    {
      url: `${baseUrl}/tools/wa-sender`,
      lastModified: toolPublishDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ];

  // Legal & info pages
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Combine all entries — order matters for clarity (core → blog → articles → tags → categories → tools → legal)
  // Note: Auth pages (/auth/login, /auth/signup) are excluded from sitemap as they are not meant for SEO indexing
  return [...corePages, ...blogPages, ...articleUrls, ...tagUrls, ...categoryUrls, ...toolPages, ...legalPages];
}
