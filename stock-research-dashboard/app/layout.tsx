import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stockwise — Make sense of the market",
  description: "Your beginner-friendly space to research companies, explore financials, understand the news, and write your own research summary.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
