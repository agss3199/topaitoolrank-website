/**
 * ArticleCard Component
 * Displays article summary on blog listing page
 */

import Link from "next/link";
import Image from "next/image";
import { Card, Badge } from "@/app/components";
import { BlogPostMeta } from "@/app/lib/blog-types";
import "./ArticleCard.css";

interface ArticleCardProps {
  post: BlogPostMeta;
  priority?: boolean;
}

export function ArticleCard({ post, priority = false }: ArticleCardProps) {
  const publishDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blogs/${post.slug}`} className="article-card-link">
      <Card as="article" hover className="article-card">
        <div className="article-card-image">
          <Image
            src={post.heroImage}
            alt={post.heroImageAlt}
            width={post.heroImageWidth}
            height={post.heroImageHeight}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="article-card-image-img"
          />
        </div>

        <div className="article-card-content">
          <div className="article-card-meta">
            <Badge variant="info">{post.category}</Badge>
            <span className="article-card-date">{publishDate}</span>
          </div>

          <h3 className="article-card-title">{post.title}</h3>

          <p className="article-card-excerpt">{post.excerpt}</p>

          <div className="article-card-footer">
            <div className="article-card-tags">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="neutral" className="article-card-tag">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="article-card-reading-time">
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
