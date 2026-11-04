import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { hostname, isPlatformHost } from "@/lib/hosts";
import { siteUrl } from "@/lib/site";

/**
 * The marketing site (homepage, sign-up, user guide) may be indexed. Each company's own address
 * holds its private workspace, so search engines are asked to stay out of it entirely.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = hostname((await headers()).get("host"));
  if (!isPlatformHost(host)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/", "/guide", "/signup"], disallow: ["/api/", "/graphql", "/login", "/home", "/closed"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
