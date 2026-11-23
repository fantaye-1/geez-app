// The site's public base URL, for canonical links, the sitemap and
// social previews. Set NEXT_PUBLIC_SITE_URL in production; on Vercel the
// production domain is picked up automatically.
export const SITE_NAME = "Learn Ge'ez";

export const SITE_DESCRIPTION =
  "A free, open platform for learning Ge'ez, the classical language of Ethiopia and Eritrea: the Fidel script, vocabulary, grammar and reading.";

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

/** Public pages, for the sitemap. */
export const PUBLIC_PATHS = [
  "/",
  "/learn/script",
  "/learn/script/practice",
  "/learn/vocabulary",
  "/learn/vocabulary/practice",
] as const;
