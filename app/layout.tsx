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
        <a
          href="#content"
          className="sr-only rounded-md bg-ink px-4 py-2 text-parchment focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="content" tabIndex={-1} className="focus:outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
