import { Metadata } from "next";
import { getAllPosts } from "@/app/lib/blog";
import { ArticleCard } from "@/app/components/blog";
import { notFound } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://topaitoolrank.com";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const categories = new Set<string>();

  posts.forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });

  return Array.from(categories).map((category) => ({
    category,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const posts = await getAllPosts();
  const decodedCategory = decodeURIComponent(categorySlug);
  const filteredPosts = posts.filter(
    (post) => post.category === decodedCategory
  );

  if (filteredPosts.length === 0) {
    return notFound();
  }

  const firstPost = filteredPosts[0];
  const canonicalUrl = `${baseUrl}/blogs/category/${encodeURIComponent(decodedCategory)}`;

  return {
    title: `${decodedCategory} | Top AI Tool Rank`,
    description: `Browse ${filteredPosts.length} articles in the ${decodedCategory} category`,
    openGraph: {
      title: decodedCategory,
      description: `Browse ${filteredPosts.length} articles in the ${decodedCategory} category`,
      url: canonicalUrl,
      type: "website",
      images: firstPost.heroImage
        ? [
            {
              url: firstPost.heroImage,
              width: firstPost.heroImageWidth || 1200,
              height: firstPost.heroImageHeight || 630,
              alt: firstPost.heroImageAlt || decodedCategory,
            },
          ]
        : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const posts = await getAllPosts();
  const decodedCategory = decodeURIComponent(categorySlug);
  const filteredPosts = posts.filter(
    (post) => post.category === decodedCategory
  );

  if (filteredPosts.length === 0) {
    return notFound();
  }

  const canonicalUrl = `${baseUrl}/blogs/category/${encodeURIComponent(decodedCategory)}`;

  // JSON-LD CollectionPage schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: decodedCategory,
    url: canonicalUrl,
    description: `Browse ${filteredPosts.length} articles in the ${decodedCategory} category`,
    hasPart: filteredPosts.map((post) => ({
      "@type": "Article",
      headline: post.title,
      url: `${baseUrl}/blogs/${post.slug}`,
      image: post.heroImage,
      datePublished: post.publishedAt,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <link rel="canonical" href={canonicalUrl} />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">{decodedCategory}</h1>
        <p className="text-gray-600 mb-8">
          {filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""}{" "}
          in this category
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </>
  );
}
