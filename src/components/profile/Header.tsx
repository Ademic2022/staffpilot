"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { faCaretDown, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconCamera } from "@/components/icons";
import { Avatar, cx, statusLabel, statusTone, type BadgeTone } from "@/components/ui";
import { initials } from "@/lib/format";

import { PhotoEditor } from "./PhotoEditor";
import type { LayoutTab, Profile } from "./query";

// Status dots that stay visible on the brand band.
const BAND_DOTS: Record<BadgeTone, string> = {
  neutral: "bg-white/60",
  good: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-red-400",
  brand: "bg-white",
};

/** Pick a photo, frame it, and upload it for this employee; the server re-encodes it. */
function PhotoButton({ employeeId, onUploaded }: { employeeId: string; onUploaded: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  return (
    <>
      <button type="button" onClick={() => input.current?.click()}
        className="absolute inset-0 grid place-items-center rounded-[22px] bg-black/0 text-transparent transition hover:bg-black/45 hover:text-white focus-visible:bg-black/45 focus-visible:text-white focus-visible:outline-none"
        aria-label="Change photo">
        <span className="flex flex-col items-center gap-1 text-xs font-semibold"><IconCamera size={22} />Change photo</span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => {
        const picked = e.target.files?.[0];
        e.target.value = "";
        if (picked) setFile(picked);
      }} />
      {file && <PhotoEditor file={file} employeeId={employeeId} onClose={() => setFile(null)} onUploaded={() => { setFile(null); onUploaded(); }} />}
    </>
  );
}

function Tabs({ tabs, active, onSelect, compact, onCustomize }: {
  tabs: LayoutTab[]; active: string; onSelect: (key: string) => void; compact?: boolean; onCustomize?: () => void;
}) {
  // Tabs that do not fit go under "More", as on a narrow screen.
  const limit = compact ? 7 : 6;
  const shown = tabs.slice(0, limit);
  const rest = tabs.slice(limit);
  const activeHidden = rest.find((t) => t.key === active);
  const [open, setOpen] = useState(false);
  const more = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => more.current && !more.current.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const tabClass = (selected: boolean) => cx(
    "whitespace-nowrap text-sm font-medium transition",
    compact ? "rounded-full px-3.5 py-1.5" : "rounded-t-xl px-4 py-3",
    selected ? (compact ? "bg-white text-[var(--brand)]" : "bg-background text-brand-ink") : "text-white/85 hover:bg-white/10 hover:text-white",
  );
  const tab = (t: LayoutTab) => (
    <button key={t.key} type="button" role="tab" aria-selected={t.key === active} onClick={() => { onSelect(t.key); setOpen(false); }}
      className={tabClass(t.key === active)}>
      {t.name}
    </button>
  );
  // The menu sits outside the scrolling strip: an overflowing parent would clip it.
  return (
    <div className="flex items-end gap-1">
      <div role="tablist" className="flex min-w-0 items-end gap-1 overflow-x-auto">
        {shown.map(tab)}
        {activeHidden && tab(activeHidden)}
      </div>
      {(rest.length > 0 || onCustomize) && (
        <div ref={more} className="relative flex-none">
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu"
            className={cx(tabClass(false), "flex items-center gap-1.5", open && "bg-white/10 text-white")}>
            More <FontAwesomeIcon icon={faCaretDown} className="text-[12px]" />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-lg">
              {rest.map((t) => (
                <button key={t.key} role="menuitem" type="button" onClick={() => { onSelect(t.key); setOpen(false); }}
                  className={cx("block w-full px-4 py-2.5 text-left text-sm hover:bg-subtle", t.key === active ? "font-semibold text-brand-ink" : "text-ink")}>
                  {t.name}
                </button>
              ))}
              {onCustomize && (
                <>
                  {rest.length > 0 && <div role="separator" className="my-1.5 border-t border-line" />}
                  <button role="menuitem" type="button" onClick={() => { setOpen(false); onCustomize(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-brand-ink hover:bg-subtle">
                    <FontAwesomeIcon icon={faWrench} className="text-[13px]" /> Customize tabs
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The record's header: a band in the company colour with the photo, name, actions and tabs.
 * When it scrolls out of view a slim bar with the name and tabs stays at the top.
 */
export function ProfileHeader({ e, tabs, active, onSelect, actions, canChangePhoto, onPhoto, onCustomizeTabs }: {
  e: Profile; tabs: LayoutTab[]; active: string; onSelect: (key: string) => void; actions?: ReactNode; onCustomizeTabs?: () => void;
  canChangePhoto: boolean; onPhoto: () => void;
}) {
  const band = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = band.current;
    if (!el) return;
    // The slim bar takes over only once the whole band, tabs included, has scrolled away:
    // above the top on wide screens, under the 56px phone header (top-14) on small ones.
    const wide = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const check = () => {
      frame = 0;
      setCompact(el.getBoundingClientRect().bottom <= (wide.matches ? 0 : 56));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  const line = [e.jobTitle?.name, e.department?.name, e.location?.name].filter(Boolean).join(" · ");

  return (
    <>
      <div ref={band} className="relative rounded-2xl bg-brand text-white shadow-sm">
        <div className="flex flex-col gap-5 px-5 pt-5 sm:flex-row sm:px-7 sm:pt-7">
          <div className="relative -mb-16 h-32 w-32 flex-none overflow-hidden rounded-[22px] bg-white/15 ring-4 ring-background sm:h-40 sm:w-40">
            {e.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.photoUrl} alt={e.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center font-display text-[44px] text-white/90">{initials(e.fullName)}</span>
            )}
            {canChangePhoto && <PhotoButton employeeId={e.id} onUploaded={onPhoto} />}
          </div>
          <div className="min-w-0 flex-1 pt-14 sm:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-[30px] font-medium leading-tight tracking-[-0.01em] sm:text-[36px]">{e.fullName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-white/80">
                  {line && <span>{line}</span>}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
                    <span className={cx("h-1.5 w-1.5 rounded-full", BAND_DOTS[statusTone[e.status] ?? "neutral"])} />
                    {statusLabel[e.status] ?? e.status}
                  </span>
                </div>
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </div>
        </div>
        <div className="mt-6 pl-0 sm:mt-8 sm:pl-[13.5rem]">
          <div className="px-3 sm:px-0"><Tabs tabs={tabs} active={active} onSelect={onSelect} onCustomize={onCustomizeTabs} /></div>
        </div>
      </div>

      {/* The slim bar, stuck below the phone header (h-14) or at the very top on wide screens. */}
      <div className="sticky top-14 z-20 h-0 lg:top-0" aria-hidden={!compact}>
        <div className={cx("absolute inset-x-0 top-2 flex items-center gap-4 rounded-2xl bg-brand px-4 py-2 text-white shadow-md transition-all duration-200",
          compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0")}>
          <Avatar name={e.fullName} src={e.photoUrl} />
          <span className="hidden truncate font-display text-[17px] sm:block">{e.fullName}</span>
          <div className="min-w-0 flex-1"><Tabs tabs={tabs} active={active} onSelect={(k) => { onSelect(k); window.scrollTo({ top: 0, behavior: "smooth" }); }} compact onCustomize={onCustomizeTabs} /></div>
        </div>
      </div>
    </>
  );
}

export function ManagerLink({ manager }: { manager: NonNullable<Profile["manager"]> }) {
  return (
    <Link href={`/employees/${manager.id}`} className="group flex items-center gap-3">
      <Avatar name={manager.fullName} src={manager.photoUrl} />
      <span className="min-w-0 text-sm">
        <span className="block truncate font-medium text-ink group-hover:underline">{manager.fullName}</span>
        {manager.jobTitle && <span className="block truncate text-xs text-muted">{manager.jobTitle.name}</span>}
      </span>
    </Link>
  );
}
