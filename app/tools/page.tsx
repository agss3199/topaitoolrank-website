import { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "./lib/Footer";
import {
  TOOL_SEO_CONFIG,
  getToolsByCategory,
  type ToolSEOConfig,
} from "./seo-config";
import "./tools-directory.css";

export const metadata: Metadata = {
  title: "Free AI Tools Directory | Top AI Tool Rank",
  description:
    "Browse 9 free AI-powered tools for developers, marketers, and businesses. JSON formatting, SEO analysis, prompt generation, invoicing, WhatsApp tools, and more. No sign-up required.",
  openGraph: {
    title: "Free AI Tools Directory | Top AI Tool Rank",
    description:
      "Discover free AI tools for writing, coding, marketing, and business. No sign-up required.",
    url: "https://topaitoolrank.com/tools",
    type: "website",
  },
  alternates: {
    canonical: "https://topaitoolrank.com/tools",
  },
};

/** Category display order and icon mapping */
const CATEGORY_ORDER: Record<string, string> = {
  Featured: "star",
  "Text & Language": "type",
  Content: "edit",
  "Links & UTM": "link",
  Messaging: "message",
};

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "Featured":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "Text & Language":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case "Content":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "Links & UTM":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "Messaging":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

function ToolCard({ tool }: { tool: ToolSEOConfig }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="tools-directory__card">
      <div
        className="tools-directory__card-accent"
        style={{ backgroundColor: tool.color }}
      />
      <div className="tools-directory__card-body">
        <div className="tools-directory__card-header">
          <span className="tools-directory__card-emoji">{tool.emoji}</span>
          <span
            className="tools-directory__card-category"
            style={{ color: tool.color, borderColor: tool.color }}
          >
            {tool.category}
          </span>
        </div>
        <h3 className="tools-directory__card-title">
          {tool.slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </h3>
        <p className="tools-directory__card-description">{tool.description}</p>
        <ul className="tools-directory__card-features">
          {tool.features.slice(0, 3).map((feature) => (
            <li key={feature} className="tools-directory__card-feature">
              {feature}
            </li>
          ))}
        </ul>
        <span className="tools-directory__card-cta" style={{ color: tool.color }}>
          Use Tool
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function ToolsDirectoryPage() {
  const allTools = Object.values(TOOL_SEO_CONFIG);
  const toolsByCategory = getToolsByCategory();

  // Sort categories by defined order
  const sortedCategories = Object.keys(toolsByCategory).sort((a, b) => {
    const orderA = Object.keys(CATEGORY_ORDER).indexOf(a);
    const orderB = Object.keys(CATEGORY_ORDER).indexOf(b);
    return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
  });

  return (
    <>
      {/* CollectionPage + ItemList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Free AI Tools Directory",
            description:
              "Browse free AI-powered tools for developers, marketers, and businesses. No sign-up required.",
            url: "https://topaitoolrank.com/tools",
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: allTools.length,
              itemListElement: allTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.title.split(" - ")[0],
                url: tool.url,
                description: tool.description,
              })),
            },
          }),
        }}
      />

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://topaitoolrank.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Tools",
                item: "https://topaitoolrank.com/tools",
              },
            ],
          }),
        }}
      />

      <Header />

      <main className="tools-directory">
        {/* Hero section */}
        <section className="tools-directory__hero">
          <div className="tools-directory__hero-inner">
            <h1 className="tools-directory__title">
              Free AI Tools Directory
            </h1>
            <p className="tools-directory__subtitle">
              {allTools.length} free tools for developers, marketers, and
              businesses. No sign-up required.
            </p>
          </div>
        </section>

        {/* Tools grouped by category */}
        <section className="tools-directory__content">
          {sortedCategories.map((category) => (
            <div key={category} className="tools-directory__category">
              <div className="tools-directory__category-header">
                <CategoryIcon category={category} />
                <h2 className="tools-directory__category-title">{category}</h2>
                <span className="tools-directory__category-count">
                  {toolsByCategory[category].length}{" "}
                  {toolsByCategory[category].length === 1 ? "tool" : "tools"}
                </span>
              </div>
              <div className="tools-directory__grid">
                {toolsByCategory[category].map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="tools-directory__cta">
          <h2 className="tools-directory__cta-title">
            Need custom AI software?
          </h2>
          <p className="tools-directory__cta-text">
            These tools are a sample of what we build. Get custom AI-powered
            software tailored to your business workflows.
          </p>
          <Link href="/#contact" className="tools-directory__cta-button">
            Discuss Your Project
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
