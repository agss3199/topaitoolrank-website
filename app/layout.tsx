import type { Metadata } from "next";
import React from "react";
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
      </body>
    </html>
  );
}
