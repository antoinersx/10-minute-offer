import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketReveal.ai - AI-Powered Market Research in Minutes",
  description: "Reveal deep market insights in minutes using AI. Understand your market, competitors, and customers with comprehensive research reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-gray-900">
        {children}
      </body>
    </html>
  );
}
