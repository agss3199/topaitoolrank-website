import type { Metadata } from "next";
import React from "react";
import "./styles.css";

export const metadata: Metadata = {
  title: "Free AI Tools Directory | Top Rated AI Tools 2026",
  description:
    "Discover and compare 100+ free AI tools for writing, coding, design, and more. No sign-up required. Reviewed and ranked by AI experts.",
  keywords: [
    "free AI tools",
    "online AI tools",
    "AI tools directory",
    "best AI tools 2026",
    "free online tools",
  ],
  openGraph: {
    title: "Free AI Tools Directory | Top Rated 2026",
    description:
      "Discover 100+ free AI tools for every task. No sign-up required.",
    url: "https://topaitoolrank.com",
    type: "website",

    siteName: "Top AI Tool Rank",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Tools Directory | Top Rated 2026",
    description:
      "Discover 100+ free AI tools for writing, coding, design, and more.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
