/**
 * RelatedArticles Component
 * Displays 3 related articles at the bottom of an article page
 */

import { BlogPostMeta } from '@/app/lib/blog-types';
import { ArticleCard } from './ArticleCard';
import './RelatedArticles.css';

interface RelatedArticlesProps {
  articles: BlogPostMeta[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="related-articles">
      <div className="related-articles-container">
        <h2 className="related-articles-title">Related Articles</h2>
        <div className="related-articles-grid">
          {articles.map((article) => (
            <ArticleCard key={article.slug} post={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
