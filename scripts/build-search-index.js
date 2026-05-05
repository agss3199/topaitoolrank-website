/**
 * Build script to generate search index at build time
 * Runs as a prebuild hook before `next build`
 *
 * Usage: node scripts/build-search-index.js
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const BLOG_CONTENT_DIR = path.join(__dirname, "..", "content", "blog");

/**
 * Strips MDX/Markdown syntax from content
 */
function stripMdxSyntax(content) {
  return content
    .replace(/^#+ .+$/gm, "") // Remove headings
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert [text](url) to text
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold **
    .replace(/__(.+?)__/g, "$1") // Remove bold __
    .replace(/\*(.+?)\*/g, "$1") // Remove italic *
    .replace(/_(.+?)_/g, "$1") // Remove italic _
    .replace(/`(.+?)`/g, "$1") // Remove inline code
    .replace(/<[^>]+>/g, "") // Remove JSX/HTML tags
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Extracts first 200 characters of content as excerpt
 */
function generateExcerpt(content) {
  const stripped = stripMdxSyntax(content);
  return stripped.substring(0, 200).trim();
}

/**
 * Reads a single MDX file and extracts searchable data
 */
function readSearchablePost(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    // Only include published posts
    if (frontmatter.status !== "published") {
      return null;
    }

    return {
      slug: frontmatter.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      author: frontmatter.author?.name || "Unknown",
      category: frontmatter.category,
      tags: frontmatter.tags || [],
      publishedAt: frontmatter.publishedAt,
      excerpt: generateExcerpt(content),
    };
  } catch (error) {
    console.warn(
      `Failed to read post at ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Generates the search index for all published posts
 */
function generateSearchIndex() {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) {
    console.log("Blog content directory does not exist. Skipping search index generation.");
    return [];
  }

  const files = fs
    .readdirSync(BLOG_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"));

  const entries = [];

  for (const file of files) {
    const filePath = path.join(BLOG_CONTENT_DIR, file);
    const entry = readSearchablePost(filePath);

    if (entry) {
      entries.push(entry);
    }
  }

  // Sort by publishedAt descending (newest first)
  entries.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return entries;
}

/**
 * Main: Generate index and write to public/search-index.json
 */
function main() {
  try {
    const index = generateSearchIndex();
    const outputPath = path.join(__dirname, "..", "public", "search-index.json");

    // Ensure public directory exists
    const publicDir = path.dirname(outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), "utf-8");
    console.log(`✓ Search index written to ${outputPath} (${index.length} posts)`);
  } catch (error) {
    console.error("Failed to generate search index:", error);
    process.exit(1);
  }
}

main();
