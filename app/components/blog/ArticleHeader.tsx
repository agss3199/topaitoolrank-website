/**
 * ArticleHeader Component
 * Displays article hero image, title, author, date, reading time, and tags
 */

import Image from "next/image";
import { Avatar, Badge } from "@/app/components";
import { BlogPost } from "@/app/lib/blog-types";
import "./ArticleHeader.css";

interface ArticleHeaderProps {
  post: BlogPost;
}

export function ArticleHeader({ post }: ArticleHeaderProps) {
  const publishDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="article-header">
      <div className="article-header-hero">
        <Image
          src={post.heroImage}
          alt={post.heroImageAlt}
          width={post.heroImageWidth}
          height={post.heroImageHeight}
          priority
          sizes="100vw"
          className="article-header-hero-img"
        />
      </div>

      <div className="article-header-container">
        <div className="article-header-meta">
          <Badge variant="info">{post.category}</Badge>
        </div>

        <h1 className="article-header-title">{post.title}</h1>

        <div className="article-header-author-row">
          <Avatar alt={post.author.name} name={post.author.name} src={post.author.avatar} />

          <div className="article-header-author-info">
            <div className="article-header-author-name">{post.author.name}</div>
            <div className="article-header-author-role">{post.author.role}</div>
          </div>

          <span className="article-header-separator">•</span>

          <div className="article-header-meta-info">
            <span className="article-header-date">{publishDate}</span>
            <span className="article-header-reading-time">
              {post.readingTime} min read
            </span>
          </div>
        </div>

        <div className="article-header-tags">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  );
}
