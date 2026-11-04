import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn Ge'ez",
  description: "Learn the Ge'ez script, vocabulary, grammar, and reading.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
