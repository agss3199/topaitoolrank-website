import type { Metadata } from "next";
import React from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "./components/components.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://topaitoolrank.com'),
  title: "Top AI Tool Rank",
  description:
    "Building custom software solutions for businesses worldwide.",
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      "application/rss+xml": "https://topaitoolrank.com/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <a href="#main" className="skip-to-content">Skip to main content</a>
        {children}

        {/* Main JS for form handling, nav, animations */}
        <script src="/js/main.js"></script>

        {/* GA4 tracking — placed at end of body for async loading */}
        <GoogleAnalytics gaId="G-D98KCREKZC" />
      </body>
    </html>
  );
}
