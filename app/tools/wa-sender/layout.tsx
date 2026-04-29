import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "WA Sender - Top AI Tool Rank",
  description:
    "WA Sender: A practical communication tool for WhatsApp and Email campaigns.",
  alternates: {
    canonical: "https://topaitoolrank.com/tools/wa-sender",
  },
};

export default function WASenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
