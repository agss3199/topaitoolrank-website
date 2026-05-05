/**
 * Blog Tag Index Page
 * Lists all published posts matching a tag slug.
 * Static generation via generateStaticParams.
 */

import { getAllPosts, slugifyTag } from '@/app/lib/blog';
import { ArticleCard } from '@/app/components/blog';
import type { Metadata } from 'next';
import type { BlogPostMeta } from '@/app/lib/blog-types';

/**
 * Filter posts by tag slug, excluding drafts.
 * Exported for testability.
 */
export async function getFilteredPosts(tagSlug: string): Promise<BlogPostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter(
    (post) =>
      post.status === 'published' &&
      post.tags?.some((tag) => slugifyTag(tag) === tagSlug)
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const tags = new Set<string>();

  posts.forEach((post) => {
    if (post.status === 'published') {
      post.tags?.forEach((tag) => {
        tags.add(slugifyTag(tag));
      });
    }
  });

  return Array.from(tags).map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const filtered = await getFilteredPosts(tagSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://topaitoolrank.com';
  const canonicalUrl = `${siteUrl}/blogs/tag/${tagSlug}`;

  return {
    title: `Posts tagged: ${tagSlug} | Top AI Tool Rank`,
    description: `${filtered.length} posts about ${tagSlug}`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      url: canonicalUrl,
      title: `Posts tagged: ${tagSlug}`,
      description: `${filtered.length} posts about ${tagSlug}`,
      images: filtered[0]?.heroImage ? [{ url: filtered[0].heroImage }] : [],
      type: 'website',
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: tagSlug } = await params;
  const filtered = await getFilteredPosts(tagSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://topaitoolrank.com';
  const canonicalUrl = `${siteUrl}/blogs/tag/${tagSlug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Posts tagged: ${tagSlug}`,
    url: canonicalUrl,
    hasPart: filtered.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blogs/${post.slug}`,
    })),
  };

  return (
    <main className="blog-tag-page">
      <h1>Posts tagged: {tagSlug}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="posts-grid">
        {filtered.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p>No published posts found for this tag.</p>
      )}
    </main>
  );
}
