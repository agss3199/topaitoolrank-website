import React from "react";
import "./styles.css";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marketing-context">{children}</div>;
}
