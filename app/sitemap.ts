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

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tools/wa-sender`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    // Future tools will be added here automatically via tool registration pattern
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

  // Auth pages (public routes, not indexed heavily)
  const authPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  // Combine all entries — order matters for clarity (core → blog → articles → tags → categories → tools → legal → auth)
  return [...corePages, ...blogPages, ...articleUrls, ...tagUrls, ...categoryUrls, ...toolPages, ...legalPages, ...authPages];
}
