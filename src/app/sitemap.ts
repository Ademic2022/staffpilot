import type { MetadataRoute } from "next";

import { ARTICLES } from "@/help";
import { siteUrl } from "@/lib/site";

/** The public pages: the homepage, sign-up and every user guide article. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...ARTICLES.map((a) => ({ url: `${base}/guide/${a.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
