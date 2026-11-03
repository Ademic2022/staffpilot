"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { article, AUDIENCE_LABEL, sectionOf } from "@/help";
import { headings, Markdown } from "@/help/render";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";

export default function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const a = article(slug);
  const section = a ? sectionOf(a.slug) : undefined;
  if (!a || !section) {
    return (
      <>
        <PageHeader title="Help" back={{ href: "/help", label: "Help" }} />
        <Notice tone="warning" title="Article not found">It may have moved. <Link href="/help" className="font-medium underline">Browse the guide</Link>.</Notice>
      </>
    );
  }
  const toc = headings(a.body);
  const i = section.articles.indexOf(a);
  const next = section.articles[i + 1];
  const others = section.articles.filter((x) => x !== a).slice(0, 6);
  return (
    <>
      <PageHeader title={a.title} back={{ href: "/help", label: "Help" }} eyebrow={section.title}
        subtitle={<>{a.summary} {a.audience.length < 4 && a.audience.map((x) => <Badge key={x}>{AUDIENCE_LABEL[x]}</Badge>)}</>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 max-w-3xl">
          <Markdown source={a.body} />
          {next && (
            <Link href={`/help/${next.slug}`} className="mt-8 block rounded-xl border border-line p-4 hover:bg-subtle">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Next</span>
              <span className="block font-medium text-ink">{next.title}</span>
            </Link>
          )}
        </article>
        <aside className="grid content-start gap-5 lg:sticky lg:top-6">
          {toc.length > 1 && (
            <Card title="On this page">
              <ul className="grid gap-1.5 text-sm">{toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-muted hover:text-ink">{h.text}</a></li>)}</ul>
            </Card>
          )}
          {others.length > 0 && (
            <Card title={`More in ${section.title.toLowerCase()}`}>
              <ul className="grid gap-1.5 text-sm">{others.map((x) => <li key={x.slug}><Link href={`/help/${x.slug}`} className="text-muted hover:text-ink">{x.title}</Link></li>)}</ul>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
