import React from "react";
import "./styles.css";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="tools-context">{children}</div>;
}
