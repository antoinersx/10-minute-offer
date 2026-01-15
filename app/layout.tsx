import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "10 Minute Offer - Generate Complete Offer Packages with AI",
  description: "Generate complete $100M-style offer packages in minutes using AI. Based on Alex Hormozi and Russell Brunson frameworks.",
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
