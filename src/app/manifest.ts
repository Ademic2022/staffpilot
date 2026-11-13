import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/**
 * Lets people install StaffPilot on their phone or computer (Add to Home Screen) and open it
 * full screen like an app. Each company's address is its own app, so it opens on that company.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: SITE.name,
    short_name: SITE.name,
    description: "Your time off, payslips, clocking in and approvals.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7a6c2e",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Request time off", url: "/leave", icons: [{ src: "/icons/app-192.png", sizes: "192x192" }] },
      { name: "My payslips", url: "/payslips", icons: [{ src: "/icons/app-192.png", sizes: "192x192" }] },
      { name: "Notifications", url: "/notifications", icons: [{ src: "/icons/app-192.png", sizes: "192x192" }] },
    ],
  };
}
