import logo from "@/assets/staffpilot-logo.png";

/**
 * The product's own details, for the platform homepage, sign-up and pages with no company yet.
 * Pricing is still an open question in the PRD (§13).
 */
export const SITE = {
  name: "StaffPilot",
  // Imported, so its address carries a hash of the file and a new logo is never served from a cache.
  logo,
  tagline: "HR, leave and people records for growing African companies",
  contactEmail: "hello@example.com",
};

export const SEO = {
  title: "HR software for growing companies in Nigeria",
  description:
    "Employee records, leave with approvals, documents with expiry reminders and self-service, in one secure place. Payroll is coming next.",
};
