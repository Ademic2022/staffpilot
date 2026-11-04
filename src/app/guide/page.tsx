import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/landing/JsonLd";
import { ARTICLES, SECTIONS } from "@/help";
import { SITE, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `User guide: how to use ${SITE.name}` },
  description: `Step-by-step help for ${SITE.name}: leave, payslips, clocking in, timesheets, expenses, reviews, setting up the company and running payroll in Nigeria and Ghana.`,
  alternates: { canonical: "/guide" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", url: "/guide", title: `${SITE.name} user guide`, siteName: SITE.name },
};

export default function GuideIndex() {
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: `${SITE.name} user guide`, url: `${siteUrl()}/guide`,
        hasPart: ARTICLES.map((a) => ({ "@type": "TechArticle", headline: a.title, url: `${siteUrl()}/guide/${a.slug}` })),
      }} />
      <div className="max-w-3xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-clay)]">User guide</p>
        <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.06] text-[var(--lp-green)] sm:text-[52px]">How to use {SITE.name}</h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[var(--lp-muted)]">
          {ARTICLES.length} short articles for everyone in the company, for managers, for HR and for payroll. The same help is inside the app,
          behind the <strong>?</strong> on every page.
        </p>
      </div>
      <div className="mt-14 grid gap-12">
        {SECTIONS.map((s) => (
          <section key={s.key} aria-labelledby={`s-${s.key}`}>
            <h2 id={`s-${s.key}`} className="font-display text-[28px] font-medium text-[var(--lp-green)]">{s.title}</h2>
            <p className="mt-1 text-[15px] text-[var(--lp-muted)]">{s.description}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/guide/${a.slug}`} className="block h-full rounded-2xl border border-[var(--lp-rule)] bg-[var(--lp-card)] p-5 transition hover:border-[var(--lp-green)]/40">
                    <span className="block text-[16px] font-semibold text-[var(--lp-green)]">{a.title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-[var(--lp-muted)]">{a.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
