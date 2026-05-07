import React from "react";

export const dynamic = 'force-dynamic';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="tools-context">{children}</div>;
}
