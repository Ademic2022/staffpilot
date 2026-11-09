"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { ARTICLES, AUDIENCE_LABEL, type Article, type Audience, articleForPath, audienceFor, search, SECTIONS } from "@/help";
import { startTour } from "@/components/Tour";
import { Badge, Button, Card, cx, Loading, PageHeader, SearchInput } from "@/components/ui";
import { useSession } from "@/lib/session";

function ArticleLink({ a }: { a: Article }) {
  return (
    <li>
      <Link href={`/help/${a.slug}`} className="block rounded-lg px-3 py-2.5 hover:bg-subtle">
        <span className="block font-medium text-ink">{a.title}</span>
        <span className="block text-[13px] text-muted">{a.summary}</span>
      </Link>
    </li>
  );
}

function Help() {
  const { me, can } = useSession();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<Audience | "all">(() => (me ? audienceFor(me.roles, can) : "all"));
  const from = params.get("from");
  const suggested = from ? articleForPath(from.split("?")[0], new URLSearchParams(from.split("?")[1] ?? "").get("tab")) : undefined;
  const pool = useMemo(() => (audience === "all" ? ARTICLES : ARTICLES.filter((a) => a.audience.includes(audience))), [audience]);
  const results = query.trim().length > 1 ? search(query, ARTICLES) : null;
  const filters: (Audience | "all")[] = ["all", "employee", "manager", "hr", "payroll"];
  return (
    <>
      <PageHeader title="Help" subtitle="How to use StaffPilot, for everyone, managers, HR and payroll."
        actions={<Button variant="secondary" onClick={startTour}>Take the tour</Button>} />
      <div className="grid gap-5">
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the guide, e.g. “carry over” or “bank file”" aria-label="Search the guide" />
        {suggested && !results && (
          <Card title="For the page you were on">
            <ul className="-mx-3 -my-2"><ArticleLink a={suggested} /></ul>
          </Card>
        )}
        {results ? (
          <Card title={`${results.length} article${results.length === 1 ? "" : "s"} found`}>
            {results.length ? <ul className="-mx-3 -my-2 grid">{results.map((a) => <ArticleLink key={a.slug} a={a} />)}</ul>
              : <p className="text-sm text-muted">Nothing matches. Try other words, or ask your HR team.</p>}
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show articles for">
              {filters.map((f) => (
                <button key={f} type="button" onClick={() => setAudience(f)} aria-pressed={audience === f}
                  className={cx("rounded-full border px-3 py-1 text-sm", audience === f ? "border-brand bg-brand text-white" : "border-line-strong text-ink hover:bg-subtle")}>
                  {f === "all" ? "All" : AUDIENCE_LABEL[f]}
                </button>
              ))}
            </div>
            {SECTIONS.map((s) => {
              const items = s.articles.filter((a) => pool.includes(a));
              if (!items.length) return null;
              return (
                <Card key={s.key} title={s.title} description={s.description}>
                  <ul className="-mx-3 -my-2 grid gap-x-4 md:grid-cols-2">{items.map((a) => <ArticleLink key={a.slug} a={a} />)}</ul>
                </Card>
              );
            })}
          </>
        )}
        <p className="text-sm text-muted">Can&apos;t find what you need? Ask your HR team. <Badge>{ARTICLES.length} articles</Badge></p>
      </div>
    </>
  );
}

export default function HelpPage() {
  return <Suspense fallback={<Loading />}><Help /></Suspense>;
}
