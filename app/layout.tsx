import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "./components/components.css";

export const metadata: Metadata = {
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
        <title>Top AI Tool Rank</title>
        <meta name="description" content="Building custom software solutions for businesses worldwide." />
        <link rel="preload" href="/css/style.css" as="style" />
        <link rel="preload" href="/css/animations.css" as="style" />
      </head>
      <body>
        <a href="#main" className="skip-to-content">Skip to main content</a>
        {children}

        {/* Load CSS non-blocking */}
        <script dangerouslySetInnerHTML={{ __html: `
          ['style','animations'].forEach(function(n){
            var l=document.createElement('link');l.rel='stylesheet';l.href='/css/'+n+'.css';
            document.head.appendChild(l);
          });
        `}} />
        {/* Main JS for form handling, nav, animations */}
        <script src="/js/main.js"></script>
      </body>
    </html>
  );
}
