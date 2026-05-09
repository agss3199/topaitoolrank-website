import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — TopAIToolRank",
  description:
    "The page you're looking for doesn't exist. Browse our AI tools directory or go home.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "3rem 1.5rem",
        textAlign: "center",
        fontFamily: "inherit",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700,
          color: "var(--color-text-headline)",
          margin: "0 0 0.5rem",
        }}
      >
        404 — Page Not Found
      </h1>

      <p
        style={{
          fontSize: "var(--font-size-body)",
          color: "var(--color-text-muted)",
          maxWidth: "480px",
          margin: "0 0 2rem",
          lineHeight: 1.6,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>

      <nav
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "2.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-white)",
            borderRadius: "var(--radius-md, 8px)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "var(--font-size-button)",
          }}
        >
          Go Home
        </Link>
        <Link
          href="/tools"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-body)",
            borderRadius: "var(--radius-md, 8px)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "var(--font-size-button)",
          }}
        >
          Browse All Tools
        </Link>
      </nav>

      <section style={{ maxWidth: "400px" }}>
        <p
          style={{
            fontSize: "var(--font-size-small)",
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          Were you looking for one of these?
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {[
            { href: "/tools/seo-analyzer", label: "SEO Analyzer" },
            { href: "/tools/ai-prompt-generator", label: "AI Prompt Generator" },
            { href: "/tools/json-formatter", label: "JSON Formatter" },
            { href: "/tools/word-counter", label: "Word Counter" },
            { href: "/tools/invoice-generator", label: "Invoice Generator" },
          ].map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "none",
                  fontSize: "var(--font-size-small)",
                }}
              >
                {tool.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
