import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlgoTrading AI — Quantitative Intelligence Platform",
  description: "Production-grade ML + Multi-Agent algorithmic trading system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
