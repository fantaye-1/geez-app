import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Vocabulary practice",
  description: "10-question rounds to learn core Ge'ez words: read the word and pick its meaning, or the other way round.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
