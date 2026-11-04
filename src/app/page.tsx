import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Landing } from "@/components/landing/Landing";
import "@/components/landing/landing.css";
import { BASE_DOMAIN, hostname, isPlatformHost } from "@/lib/hosts";
import { FAQS } from "@/components/landing/faqs";
import { JsonLd } from "@/components/landing/JsonLd";
import { SEO, SITE, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SEO.title} | ${SITE.name}` },
  description: SEO.description,
  keywords: SEO.keywords,
  robots: { index: true, follow: true, "max-image-preview": "large" },
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: `${SITE.name}: ${SEO.title}`, description: SEO.description },
  twitter: { card: "summary_large_image", title: `${SITE.name}: ${SEO.title}`, description: SEO.description },
};

/** What search engines read about the product: who makes it, what it is, and the FAQ shown on the page. */
function structuredData() {
  const url = siteUrl();
  return [
    { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url, logo: `${url}/icon.png`, email: SITE.contactEmail },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url },
    {
      "@context": "https://schema.org", "@type": "SoftwareApplication", name: SITE.name, url, applicationCategory: "BusinessApplication",
      applicationSubCategory: "HR and payroll software", operatingSystem: "Web browser, any phone", description: SEO.description,
      areaServed: ["Nigeria", "Ghana"],
      featureList: ["Employee records", "Leave management", "Payroll with PAYE, pension, NHF and SSNIT", "Attendance and timesheets",
        "Performance reviews and goals", "Expense claims", "Employee self-service", "Reports"],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
}

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

/**
 * Whether this address belongs to a company, as confirmed by the API. "<slug>.<base domain>"
 * may name a company that does not exist; anything the API cannot confirm, including when it
 * is unreachable, shows the homepage rather than a workspace that will not load.
 */
async function isCompanyHost(host: string) {
  if (isPlatformHost(host)) return false;
  try {
    // A GET query is read-only, so Django's CSRF check does not apply.
    const response = await fetch(`${API_ORIGIN}/graphql?${new URLSearchParams({ query: "{ tenant { slug } }" })}`, {
      headers: { "X-Forwarded-Host": host },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return Boolean(body?.data?.tenant?.slug);
  } catch {
    return false;
  }
}

/** A company's address, with "{slug}" for its name: the same shape the API sends in emails. */
function companyUrl() {
  return BASE_DOMAIN === "localhost" ? "http://{slug}.localhost:3000" : `https://{slug}.${BASE_DOMAIN}`;
}

export default async function Home() {
  // A company's own address goes straight into the app; the platform's address shows the homepage.
  const host = hostname((await headers()).get("host"));
  if (await isCompanyHost(host)) redirect("/home");
  return (
    <>
      <JsonLd data={structuredData()} />
      <Landing companyUrl={companyUrl()} />
    </>
  );
}
