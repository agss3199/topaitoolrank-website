'use client';

import { useState, useMemo } from 'react';
import { Button, Card, Badge, Input } from '@/app/components';
import type { Metadata } from 'next';

// Mock blog data for build time
const mockBlogs = [
  {
    id: '1',
    title: 'Getting Started with Custom Software Development',
    excerpt: 'Learn the fundamentals of building custom solutions tailored to your business needs.',
    category: 'Development',
    date: '2026-04-28',
    readTime: '5 min',
  },
  {
    id: '2',
    title: 'AI Integration: Transforming Your Business',
    excerpt: 'Discover how AI can automate processes and improve decision-making in your organization.',
    category: 'AI',
    date: '2026-04-25',
    readTime: '7 min',
  },
  {
    id: '3',
    title: 'Digital Transformation Strategy',
    excerpt: 'A comprehensive guide to planning and executing your digital transformation journey.',
    category: 'Strategy',
    date: '2026-04-20',
    readTime: '8 min',
  },
  {
    id: '4',
    title: 'Building Scalable APIs',
    excerpt: 'Best practices for designing APIs that grow with your application.',
    category: 'Development',
    date: '2026-04-15',
    readTime: '6 min',
  },
  {
    id: '5',
    title: 'Machine Learning in Production',
    excerpt: 'Challenges and solutions for deploying ML models to production environments.',
    category: 'AI',
    date: '2026-04-10',
    readTime: '9 min',
  },
  {
    id: '6',
    title: 'Cloud Architecture Patterns',
    excerpt: 'Proven patterns for building reliable and scalable cloud applications.',
    category: 'Infrastructure',
    date: '2026-04-05',
    readTime: '10 min',
  },
];

const categories = ['All', 'Development', 'AI', 'Strategy', 'Infrastructure'];
const POSTS_PER_PAGE = 6;

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search
  const filteredPosts = useMemo(() => {
    return mockBlogs.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-light)' }}>
      {/* Hero Section */}
      <div style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-h1)',
            fontWeight: 'var(--font-weight-headline)',
            color: 'var(--color-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Blog
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-gray-500)',
            marginBottom: 'var(--spacing-2xl)',
          }}
        >
          Articles about custom software development, AI integration, and digital transformation.
        </p>

        {/* Search Bar */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <Input
            id="search"
            name="search"
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: 'var(--spacing-2xl)', overflowX: 'auto', paddingBottom: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', minWidth: 'min-content' }}>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'success' : 'neutral'}
                style={{
                  cursor: 'pointer',
                  opacity: selectedCategory === category ? 1 : 0.6,
                }}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCategory(category);
                    setCurrentPage(1);
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
      <div style={{ padding: '0 var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
        {paginatedPosts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-3xl)',
            }}
          >
            {paginatedPosts.map((post) => (
              <Card key={post.id} as="article" padding="lg" hover>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <Badge variant="info">{post.category}</Badge>
                </div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-h3)',
                    fontWeight: 'var(--font-weight-headline)',
                    color: 'var(--color-black)',
                    marginBottom: 'var(--spacing-sm)',
                    lineHeight: 'var(--line-height-headline)',
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-gray-600)',
                    marginBottom: 'var(--spacing-md)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-gray-500)',
                    marginBottom: 'var(--spacing-md)',
                    paddingBottom: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-gray-200)',
                  }}
                >
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <a
                  href={`#`}
                  style={{
                    color: 'var(--color-accent)',
                    textDecoration: 'none',
                    fontWeight: 'var(--font-weight-button)',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Read more →
                </a>
              </Card>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-3xl)',
              color: 'var(--color-gray-500)',
            }}
          >
            <p style={{ fontSize: 'var(--font-size-body)' }}>
              No articles found. Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-3xl)',
            }}
          >
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span style={{ color: 'var(--color-gray-600)' }}>
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
