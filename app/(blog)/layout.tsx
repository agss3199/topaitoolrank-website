import React from "react";
import { BlogSearch } from "@/app/components/BlogSearch";
import "./styles.css";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-context">
      <div className="blog-header">
        <div className="blog-header-search">
          <BlogSearch />
        </div>
      </div>
      {children}
    </div>
  );
}
