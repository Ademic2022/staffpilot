import type { NextConfig } from "next";

// The Django API. src/proxy.ts forwards API paths to it with the company address and visitor
// IP; these rewrites are the fallback. In development the browser talks only to this Next.js server, which
// forwards API paths to Django with the original host in X-Forwarded-Host, so Django can
// resolve the tenant from the subdomain. In production a load balancer does the same.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

const API_PATHS = ["/graphql", "/api/:path*"];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.localhost"],
  poweredByHeader: false,
  // Django's API paths end in "/"; let them through untouched instead of redirecting.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // `:path*` drops a trailing slash, so slash-terminated paths get their own rule first.
    const withSlash = API_PATHS.filter((p) => p.endsWith("*")).map((p) => `${p}/`);
    return [...withSlash, ...API_PATHS].map((source) => ({ source, destination: `${API_ORIGIN}${source}` }));
  },
};

export default nextConfig;
