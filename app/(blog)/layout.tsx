import React from "react";
import "./styles.css";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="blog-context">{children}</div>;
}
