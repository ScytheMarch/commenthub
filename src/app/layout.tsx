import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommentHub — Manage All Your Social Comments in One Place",
  description:
    "View and reply to Instagram, TikTok, YouTube, and Twitter comments from a single dashboard. Never miss engagement again.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
