/**
 * Blog Listing Page
 * Server component that fetches blog posts and renders them with client-side search/filter
 */

import type { Metadata } from 'next';
import { getAllPosts } from '@/app/lib/blog';
import { BlogsClientShell } from './BlogsClientShell';

export const metadata: Metadata = {
  title: 'Blog | Top AI Tool Rank',
  description:
    'Articles about custom software development, AI integration, and digital transformation.',
};

export default async function BlogsPage() {
  const posts = await getAllPosts();

  // Extract unique categories
  const uniqueCategories = Array.from(
    new Set(posts.map((post) => post.category))
  ).sort();
  const categories = ['All', ...uniqueCategories];

  return <BlogsClientShell initialPosts={posts} categories={categories} />;
}
