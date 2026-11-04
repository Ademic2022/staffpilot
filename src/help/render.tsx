import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A small Markdown reader for help articles: ## and ### headings, paragraphs, - and 1. lists,
 * > tips, **bold** and [links](/path). Articles are our own text; nothing is read as HTML.
 */

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Where a link in an article goes: the app (default), or the public guide, where app pages are not links. */
type LinkMode = "app" | "public";

function target(href: string, mode: LinkMode): string | null {
  if (mode === "app" || !href.startsWith("/")) return href;
  return href.startsWith("/help/") ? `/guide/${href.slice(6)}` : null;
}

function inline(text: string, key: string, mode: LinkMode = "app"): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-${i++}`} className="font-semibold text-ink">{m[1]}</strong>);
    else {
      const href = target(m[3], mode);
      const cls = "font-medium text-brand-ink underline-offset-2 hover:underline";
      if (href === null) out.push(<strong key={`${key}-${i++}`} className="font-semibold text-ink">{m[2]}</strong>);
      else out.push(href.startsWith("/")
        ? <Link key={`${key}-${i++}`} href={href} className={cls}>{m[2]}</Link>
        : <a key={`${key}-${i++}`} href={href} className={cls} target="_blank" rel="noreferrer">{m[2]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h2" | "h3" | "p" | "tip"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

export function parse(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r/g, "").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    const tip = line.match(/^>\s?(.*)$/);
    if (heading) { flush(); blocks.push({ kind: heading[1].length === 2 ? "h2" : "h3", text: heading[2] }); }
    else if (bullet || numbered) {
      flush();
      const kind = bullet ? "ul" : "ol";
      const prev = blocks[blocks.length - 1];
      const text = (bullet ?? numbered)![1];
      if (prev && prev.kind === kind) prev.items.push(text);
      else blocks.push({ kind, items: [text] });
    } else if (tip) {
      flush();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.kind === "tip") prev.text += ` ${tip[1]}`;
      else blocks.push({ kind: "tip", text: tip[1] });
    } else {
      // A line under a list item continues it.
      const prev = blocks[blocks.length - 1];
      if (!para.length && prev && (prev.kind === "ul" || prev.kind === "ol") && raw.startsWith("  ")) prev.items[prev.items.length - 1] += ` ${line}`;
      else para.push(line);
    }
  }
  flush();
  return blocks;
}

export function headings(source: string) {
  return parse(source).filter((b): b is { kind: "h2"; text: string } => b.kind === "h2").map((b) => ({ id: slugify(b.text), text: b.text }));
}

export function Markdown({ source, mode = "app" }: { source: string; mode?: LinkMode }) {
  return (
    <div className="grid gap-4 text-[15px] leading-relaxed text-ink/90">
      {parse(source).map((b, i) => {
        const key = `b${i}`;
        switch (b.kind) {
          case "h2": return <h2 key={key} id={slugify(b.text)} className="mt-4 scroll-mt-20 text-lg font-semibold text-ink">{b.text}</h2>;
          case "h3": return <h3 key={key} id={slugify(b.text)} className="mt-2 scroll-mt-20 text-[15px] font-semibold text-ink">{b.text}</h3>;
          case "tip": return <div key={key} className="rounded-lg border border-brand/25 bg-brand/5 px-4 py-3 text-sm">{inline(b.text, key, mode)}</div>;
          case "ul": return <ul key={key} className="grid list-disc gap-1.5 pl-5">{b.items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`, mode)}</li>)}</ul>;
          case "ol": return <ol key={key} className="grid list-decimal gap-1.5 pl-5">{b.items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`, mode)}</li>)}</ol>;
          default: return <p key={key}>{inline(b.text, key, mode)}</p>;
        }
      })}
    </div>
  );
}
