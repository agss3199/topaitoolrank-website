/**
 * Dynamic Article Page
 * Renders individual blog articles with SEO metadata, table of contents, and related articles
 */

import { Metadata } from 'next';
import Script from 'next/script';
import {
  ArticleBody,
  ArticleHeader,
  RelatedArticles,
  ShareButtons,
  TableOfContents,
  ScrollProgressBar,
} from '@/app/components/blog';
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  generateStaticParams as getStaticBlogParams,
} from '@/app/lib/blog';
import './article.css';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate SEO metadata for each article
 */
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
    };
  }

  const canonicalUrl = `https://topaitoolrank.com/blogs/${slug}`;

  return {
    title: `${post.title} | Top AI Tool Rank`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      images: [
        {
          url: post.heroImage,
          width: post.heroImageWidth,
          height: post.heroImageHeight,
          alt: post.heroImageAlt,
        },
      ],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.heroImage],
    },
  };
}

/**
 * Generate static parameters for all articles at build time
 */
export function generateStaticParams() {
  return getStaticBlogParams();
}

/**
 * Article Page Component
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const relatedArticles = await getRelatedPosts(
    slug,
    post?.pillar || '',
    post?.tags || []
  );

  if (!post) {
    return (
      <div className="article-not-found">
        <h1>Article Not Found</h1>
        <p>Sorry, the article you're looking for doesn't exist.</p>
      </div>
    );
  }

  const canonicalUrl = `https://topaitoolrank.com/blogs/${slug}`;

  return (
    <>
      <ScrollProgressBar />

      <main className="article-page">
        {/* Article Header with Hero Image */}
        <ArticleHeader post={post} />

        {/* Two-column layout: TOC + Article Content */}
        <div className="article-layout">
          {/* Sidebar: Table of Contents (sticky on desktop, collapsible on mobile) */}
          <aside className="article-sidebar">
            <TableOfContents headings={post.headings} />
          </aside>

          {/* Main Article Content */}
          <article className="article-content">
            {/* Article Body - MDX Content */}
            <ArticleBody content={post.content} />

            {/* Share Buttons */}
            <div className="article-share">
              <ShareButtons
                title={post.title}
                description={post.description}
                slug={slug}
                url={canonicalUrl}
              />
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <RelatedArticles articles={relatedArticles} />
            )}
          </article>
        </div>
      </main>

      {/* JSON-LD Schema Markup for SEO */}
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            image: [
              {
                '@type': 'ImageObject',
                url: post.heroImage,
                width: post.heroImageWidth,
                height: post.heroImageHeight,
              },
            ],
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: {
              '@type': 'Person',
              name: post.author.name,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Top AI Tool Rank',
              logo: {
                '@type': 'ImageObject',
                url: 'https://topaitoolrank.com/logo.png',
                width: 250,
                height: 60,
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
            articleBody: post.content,
            keywords: post.tags.join(', '),
            wordCount: post.wordCount,
            isPartOf: {
              '@type': 'Blog',
              name: 'Top AI Tool Rank Blog',
              url: 'https://topaitoolrank.com/blogs',
            },
          }),
        }}
      />
    </>
  );
}
