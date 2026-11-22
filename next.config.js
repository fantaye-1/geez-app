/** @type {import('next').NextConfig} */

// Security headers sent with every page and asset.
//
// - nosniff: browsers must not guess content types (stops an uploaded
//   file being run as a script).
// - Referrer-Policy: other sites see only our origin, never full URLs.
// - X-Frame-Options + frame-ancestors: no other site can put the app in
//   an iframe (clickjacking). The CSP below sets ONLY frame-ancestors, so
//   it doesn't restrict scripts, styles, fonts or Supabase requests.
// - Permissions-Policy: the microphone is allowed for our own pages (the
//   letter recorder needs it) and blocked for anything embedded; camera,
//   location and payment APIs are turned off because the app never uses them.
//
// HSTS is left to the host: Vercel already sends it on HTTPS domains.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig = {
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
