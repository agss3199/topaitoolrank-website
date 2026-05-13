import Header from "@/app/components/Header";
import Footer from "@/app/tools/lib/Footer";
import React from "react";
import "../(blog)/styles.css";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="blog-context">{children}</div>
      <Footer />
    </>
  );
}
