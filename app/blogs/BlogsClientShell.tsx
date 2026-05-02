'use client';

import { useState, useMemo } from 'react';
import { Badge, Input, Button } from '@/app/components';
import { ArticleCard } from '@/app/components/blog';
import { BlogPostMeta } from '@/app/lib/blog-types';
import './blogs.css';

interface BlogsClientShellProps {
  initialPosts: BlogPostMeta[];
  categories: string[];
}

const POSTS_PER_PAGE = 6;

export function BlogsClientShell({
  initialPosts,
  categories,
}: BlogsClientShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, initialPosts]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + POSTS_PER_PAGE
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="blogs-page">
      {/* Hero Section */}
      <div className="blogs-hero">
        <h1 className="blogs-hero-title">Blog</h1>
        <p className="blogs-hero-subtitle">
          Articles about custom software development, AI integration, and digital
          transformation.
        </p>

        {/* Search Bar */}
        <div className="blogs-search">
          <Input
            id="search"
            name="search"
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="blogs-categories">
          <div className="blogs-categories-scroll">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'success' : 'neutral'}
                className="blogs-category-badge"
                onClick={() => handleCategoryChange(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCategoryChange(category);
                  }
                }}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="blogs-container">
        {paginatedPosts.length > 0 ? (
          <div className="blogs-grid">
            {paginatedPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="blogs-empty">
            <p>No articles found. Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="blogs-pagination">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="blogs-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="md"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
