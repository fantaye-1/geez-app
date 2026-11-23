import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Fidel chart",
  description: "All 26 Ge'ez letter families in their seven vowel forms. Tap a letter to see and hear it.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
