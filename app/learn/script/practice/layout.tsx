import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Fidel practice",
  description: "10-question rounds to learn the Ge'ez letters, with spaced review of the ones you miss.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
