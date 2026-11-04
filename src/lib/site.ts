import logo from "@/assets/staffpilot-logo.png";

/**
 * The product's own details, for the platform homepage, sign-up and pages with no company yet.
 * Pricing is still an open question in the PRD (§13).
 */
export const SITE = {
  name: "StaffPilot",
  // Imported, so its address carries a hash of the file and a new logo is never served from a cache.
  logo,
  tagline: "HR, payroll, leave and attendance for growing African companies",
  contactEmail: "support@staffpilot.site",
  // Who runs the service, for the privacy policy and terms.
  legalName: "AdemicTech",
  location: "Lagos, Nigeria",
};

export const SEO = {
  title: "HR and payroll software for growing companies in Nigeria and Ghana",
  description:
    "StaffPilot keeps employee records, leave, payroll with PAYE, pension and NHF, attendance, performance reviews and expense claims in one secure place, with self-service on any phone.",
  keywords: ["HR software Nigeria", "payroll software Nigeria", "HRMS Nigeria", "payroll software Ghana", "leave management",
    "attendance software", "PAYE calculator", "employee self-service", "performance reviews", "expense claims"],
};

/** The marketing site's own address, for canonical links, the sitemap and social cards. */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const base = (process.env.TENANT_BASE_DOMAIN ?? "localhost").toLowerCase();
  return base === "localhost" ? "http://localhost:3000" : `https://${base}`;
}
