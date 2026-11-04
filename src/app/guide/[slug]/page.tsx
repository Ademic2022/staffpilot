import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/landing/JsonLd";
import { ARTICLES, article, AUDIENCE_LABEL, sectionOf } from "@/help";
import { headings, Markdown } from "@/help/render";
import { SITE, siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

// Every article is built ahead of time; an unknown slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = article((await params).slug);
  if (!a) return {};
  return {
    title: { absolute: `${a.title} · ${SITE.name} user guide` },
    description: a.summary,
    alternates: { canonical: `/guide/${a.slug}` },
    robots: { index: true, follow: true },
    openGraph: { type: "article", url: `/guide/${a.slug}`, title: a.title, description: a.summary, siteName: SITE.name },
  };
}

export default async function GuideArticle({ params }: Props) {
  const a = article((await params).slug);
  const section = a ? sectionOf(a.slug) : undefined;
  if (!a || !section) notFound();
  const toc = headings(a.body);
  const i = section.articles.indexOf(a);
  const next = section.articles[i + 1];
  const url = `${siteUrl()}/guide/${a.slug}`;
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "TechArticle", headline: a.title, description: a.summary, url,
          about: SITE.name, publisher: { "@type": "Organization", name: SITE.name, url: siteUrl() }, inLanguage: "en" },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "User guide", item: `${siteUrl()}/guide` },
          { "@type": "ListItem", position: 2, name: section.title, item: `${siteUrl()}/guide#s-${section.key}` },
          { "@type": "ListItem", position: 3, name: a.title, item: url },
        ] },
      ]} />
      <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--lp-muted)]">
        <Link href="/guide" className="hover:text-[var(--lp-green)]">User guide</Link> / <span>{section.title}</span>
      </nav>
      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 max-w-3xl">
          <h1 className="font-display text-[36px] font-medium leading-[1.08] text-[var(--lp-green)] sm:text-[46px]">{a.title}</h1>
          <p className="mt-3 text-[17px] text-[var(--lp-muted)]">{a.summary}</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--lp-clay)]">
            For {a.audience.map((x) => AUDIENCE_LABEL[x].toLowerCase()).join(", ")}
          </p>
          <div className="mt-8"><Markdown source={a.body} mode="public" /></div>
          {next && (
            <Link href={`/guide/${next.slug}`} className="mt-12 block rounded-2xl border border-[var(--lp-rule)] bg-[var(--lp-card)] p-5 hover:border-[var(--lp-green)]/40">
              <span className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--lp-muted)]">Next</span>
              <span className="mt-1 block text-[17px] font-semibold text-[var(--lp-green)]">{next.title}</span>
            </Link>
          )}
        </article>
        <aside className="grid content-start gap-8 lg:sticky lg:top-24">
          {toc.length > 1 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--lp-muted)]">On this page</p>
              <ul className="mt-3 grid gap-2 text-[14px]">{toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-[var(--lp-muted)] hover:text-[var(--lp-green)]">{h.text}</a></li>)}</ul>
            </div>
          )}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--lp-muted)]">{section.title}</p>
            <ul className="mt-3 grid gap-2 text-[14px]">
              {section.articles.map((x) => (
                <li key={x.slug}><Link href={`/guide/${x.slug}`} aria-current={x === a ? "page" : undefined}
                  className={x === a ? "font-semibold text-[var(--lp-green)]" : "text-[var(--lp-muted)] hover:text-[var(--lp-green)]"}>{x.title}</Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
