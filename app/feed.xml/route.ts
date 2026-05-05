import { getAllPosts, escapeXml } from "@/app/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://topaitoolrank.com";
const SITE_TITLE = "Top AI Tool Rank";
const SITE_DESCRIPTION =
  "Discover, review, and rank the best AI tools for your workflow";

export async function GET() {
  const t0 = Date.now();

  try {
    const posts = await getAllPosts();

    // Build RSS items for each published post (getAllPosts already filters by published status)
    const items = posts
      .map((post) => {
        const postUrl = `${SITE_URL}/blogs/${post.slug}`;
        const pubDate = new Date(post.publishedAt).toUTCString();

        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description)}</description>
      <author>${escapeXml(post.author.name)}</author>
      <category>${escapeXml(post.category)}</category>
      ${post.tags?.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ") || ""}
    </item>`;
      })
      .join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>team@topaitoolrank.com</managingEditor>
    <webMaster>team@topaitoolrank.com</webMaster>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

    const latencyMs = Date.now() - t0;

    return new Response(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - t0;
    console.error("feed.xml.error", {
      error: error instanceof Error ? error.message : String(error),
      latency_ms: latencyMs,
    });

    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
