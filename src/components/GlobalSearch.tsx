"use client";

import { faChartColumn, faFile, faGear, faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useQuery } from "urql";

import { Photo } from "@/components/home/Widgets";
import { ACCOUNT_SETTINGS, visibleAreas } from "@/components/settings/areas";
import { cx } from "@/components/ui";
import { graphql } from "@/gql";
import { useSession } from "@/lib/session";

const SearchDocument = graphql(`
  query GlobalSearch($q: String!) {
    search(q: $q) { kind title subtitle href photoUrl }
  }
`);

// The sidebar can be mounted twice (desktop and the mobile drawer); only one copy answers a key press.
let handledAt = -1;

type Hit = { kind: string; title: string; subtitle: string; href: string; photoUrl?: string | null };
const ICONS = { person: faUser, file: faFile, report: faChartColumn, setting: faGear };
const GROUPS: [string, string][] = [["person", "People"], ["file", "Files"], ["report", "Reports"], ["setting", "Settings"]];

type Entry = { hit: Hit; words: string };

/**
 * Settings that match every word typed, by name first and then by the other words people use
 * for them ("2fa", "tax", "brand"). Each word may match the start of a word or part of one.
 */
export function searchSettings(query: string, entries: Entry[]): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = entries.flatMap(({ hit, words }) => {
    const title = hit.title.toLowerCase();
    const all = `${title} ${hit.subtitle ?? ""} ${words}`.toLowerCase();
    if (!terms.every((t) => all.includes(t))) return [];
    const score = title.startsWith(terms[0]) ? 0 : terms.every((t) => title.includes(t)) ? 1 : 2;
    return [{ hit, score }];
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, 8).map((s) => s.hit);
}

/** Search people, files, reports and settings from anywhere. Ctrl/⌘ K opens it. */
export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const { can, tenant, me } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const q = useDeferredValue(text.trim());
  const [{ data, fetching }] = useQuery({ query: SearchDocument, variables: { q }, pause: q.length < 2 });

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && handledAt !== e.timeStamp) {
        handledAt = e.timeStamp;
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  const settings = q.length < 2 ? [] : searchSettings(q, [
    ...visibleAreas(can, tenant).flatMap((a) => [
      { hit: { kind: "setting", title: a.label, subtitle: "Settings", href: a.href }, words: `settings ${a.keywords ?? ""}` },
      ...(a.tabs ?? []).map((t) => ({
        hit: { kind: "setting", title: t.label, subtitle: `Settings · ${a.label}`, href: `${a.href}?tab=${t.key}` },
        words: `settings ${a.label} ${a.keywords ?? ""} ${t.keywords ?? ""}`,
      })),
    ]),
    ...ACCOUNT_SETTINGS.map((s) => ({ hit: { kind: "setting", title: s.label, subtitle: "Your account", href: "/account" }, words: `account settings my ${s.keywords}` })),
  ]);
  // Admin settings stay hidden until two-step sign-in is on: say so rather than finding nothing.
  const locked = q.length >= 2 && me?.mfaSetupRequired && /setting|logo|payroll|leave|user|polic|holiday|compan/i.test(q);
  const hits: Hit[] = [...(q.length >= 2 ? data?.search ?? [] : []), ...settings];
  const go = (h: Hit) => { setOpen(false); setText(""); router.push(h.href); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search"
        className={cx("flex items-center gap-2.5 rounded-lg border border-line bg-surface text-sm text-muted transition hover:border-line-strong hover:text-ink",
          compact ? "h-9 w-9 justify-center" : "h-9 w-full px-3")}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
        {!compact && <><span className="flex-1 text-left">Search</span><kbd className="rounded border border-line px-1.5 text-[10px] pointer-coarse:hidden">⌘K</kbd></>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={() => setOpen(false)}>
          <div role="dialog" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted" />
              <input ref={input} value={text} placeholder="Search people, files, reports and settings" aria-label="Search"
                onChange={(e) => { setText(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  else if (e.key === "Enter" && hits[active]) go(hits[active]);
                }}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {q.length < 2 ? <p className="px-4 py-6 text-center text-sm text-muted">Type at least two letters.</p>
                : !hits.length ? <p className="px-4 py-6 text-center text-sm text-muted">
                  {fetching ? "Searching…" : locked ? "Company settings appear once you turn on two-step sign-in on your account page." : "Nothing found."}
                </p>
                : GROUPS.map(([kind, label]) => {
                  const group = hits.filter((h) => h.kind === kind);
                  if (!group.length) return null;
                  return (
                    <div key={kind} className="py-1">
                      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
                      {group.map((h) => {
                        const index = hits.indexOf(h);
                        return (
                          <button key={h.href + h.title} type="button" onMouseEnter={() => setActive(index)} onClick={() => go(h)}
                            className={cx("flex w-full items-center gap-3 px-4 py-2 text-left", index === active && "bg-subtle")}>
                            {h.kind === "person" ? <Photo name={h.title} src={h.photoUrl} size={30} /> : (
                              <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-subtle text-xs text-muted">
                                <FontAwesomeIcon icon={ICONS[h.kind as keyof typeof ICONS] ?? faFile} />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-ink">{h.title}</span>
                              {h.subtitle && <span className="block truncate text-xs text-muted">{h.subtitle}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
