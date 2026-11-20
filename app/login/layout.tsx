import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with a one-time email link to save your progress.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
