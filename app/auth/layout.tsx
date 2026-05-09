import type { Metadata } from "next";
import React from "react";
import "../globals.css";

export const metadata: Metadata = {
  title: "Auth - Top AI Tool Rank",
  description: "Authentication for WA Sender",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
