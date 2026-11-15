"use client";

import {
  faChevronDown, faChevronUp, faCompress, faDownload, faEnvelope, faFileCsv, faFileExport, faIdBadge, faMagnifyingGlassMinus,
  faMagnifyingGlassPlus, faUpRightFromSquare, faUserCircle, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

import { TenureFrame } from "@/components/TenureMark";
import { Photo } from "@/components/home/Widgets";
import { useSnapshot } from "@/components/snapshot/Snapshot";
import { Badge, Button, Dialog, ErrorNote, IconButton, Loading, Select, cx } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

import { outLabel, useOrgPeople, type OrgPerson } from "./org";
import { DEFAULT_INCLUDE, canvasToPdf, drawChart, orgCsv, save, screenTree, subTree, type CsvKind, type Include } from "./orgExport";
import { Menu } from "./PeopleList";

const ZOOMS = [0.5, 0.65, 0.8, 1, 1.15, 1.3];
const DEPTHS = [1, 2, 3, 4, 5];

type Ctx = {
  children: Map<string, OrgPerson[]>;
  expanded: Set<string>;
  toggle: (id: string) => void;
  focused: string | null;
  /** The focused person and everyone above them: their cards and the lines between them stand out. */
  path: Set<string>;
  full: boolean;
  openSnapshot: (id: string) => void;
};

function HoverCard({ p, full, openSnapshot }: { p: OrgPerson; full: boolean; openSnapshot: () => void }) {
  return (
    <div role="tooltip" className="ui-fade-in absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-line bg-surface p-4 text-left shadow-lg">
      <div className="flex items-center gap-3">
        <TenureFrame hireDate={p.hireDate} founding={p.foundingMember} radius="rounded-xl" markSize={18}><Photo name={p.fullName} src={p.photoUrl} size={52} /></TenureFrame>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.fullName}</p>
          <p className="truncate text-sm text-muted">{p.jobTitle ?? "No job title"}</p>
        </div>
      </div>
      {p.outUntil && <div className="mt-3"><Badge tone="warn" dot>{outLabel(p.outUntil)}</Badge></div>}
      <ul className="mt-3 space-y-1 text-sm text-ink">
        {p.department && <li>{p.department}</li>}
        {p.place && <li className="text-muted">{p.place}</li>}
        {p.workEmail && <li className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="text-xs text-muted" /><a href={`mailto:${p.workEmail}`} className="truncate hover:underline">{p.workEmail}</a></li>}
      </ul>
      {full && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <Button size="sm" variant="secondary" onClick={openSnapshot}><FontAwesomeIcon icon={faIdBadge} className="mr-1.5" />Snapshot</Button>
          <Link href={`/employees/${p.id}`} className="inline-flex items-center gap-1.5 px-2 text-sm font-medium text-brand-ink hover:underline">
            <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs" />Profile
          </Link>
        </div>
      )}
    </div>
  );
}

function Node({ p, ctx }: { p: OrgPerson; ctx: Ctx }) {
  const reports = ctx.children.get(p.id) ?? [];
  const open = ctx.expanded.has(p.id);
  const [hover, setHover] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setHover(true), 350); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setHover(false), 150); };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div id={`org-${p.id}`} data-person={p.id}
          className={cx("relative w-56 rounded-xl border bg-surface px-4 pb-4 pt-9 text-center shadow-sm transition",
            ctx.focused === p.id ? "border-brand-ink shadow-md ring-4 ring-brand/30"
              : ctx.path.has(p.id) ? "border-brand-ink" : "border-line hover:border-line-strong")}>
          <button type="button" onClick={() => ctx.full && ctx.openSnapshot(p.id)} aria-label={ctx.full ? `Snapshot of ${p.fullName}` : p.fullName}
            className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-xl ring-4 ring-surface">
            <TenureFrame hireDate={p.hireDate} founding={p.foundingMember} radius="rounded-xl" markSize={18}><Photo name={p.fullName} src={p.photoUrl} size={56} faded={Boolean(p.outUntil)} /></TenureFrame>
          </button>
          {/* Only the name opens the hover card; the card stays open while the pointer is on it. */}
          <div className="relative inline-block max-w-full align-top" onMouseEnter={enter} onMouseLeave={leave}>
            <p className={cx("cursor-default truncate font-semibold text-ink decoration-brand-ink decoration-2 underline-offset-4 hover:text-brand-ink hover:underline", hover && "text-brand-ink underline")}>{p.fullName}</p>
            {hover && <HoverCard p={p} full={ctx.full} openSnapshot={() => ctx.openSnapshot(p.id)} />}
          </div>
          <p className="truncate text-sm text-muted">{p.jobTitle ?? "No job title"}</p>
          <p className="truncate text-xs text-muted">{p.department ?? " "}</p>
          {p.outUntil && <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">{outLabel(p.outUntil)}</p>}
          {reports.length > 0 && (
            <button type="button" onClick={() => ctx.toggle(p.id)} aria-expanded={open}
              aria-label={`${open ? "Hide" : "Show"} ${p.fullName}'s ${reports.length} direct ${reports.length === 1 ? "report" : "reports"}`}
              className={cx("absolute -bottom-3.5 left-1/2 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold tabular-nums shadow-sm",
                open ? "border-brand-ink bg-brand text-white" : "border-line-strong bg-surface text-ink hover:bg-subtle")}>
              {reports.length}<FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-[10px]" />
            </button>
          )}
        </div>
      </div>
      {open && reports.length > 0 && (
        <>
          <span className="h-8 w-px bg-line-strong" aria-hidden />
          <div className="flex">
            {reports.map((r, i) => (
              <div key={r.id} className="relative flex flex-col items-center px-3 pt-11">
                <span className="absolute left-1/2 top-0 h-11 w-px bg-line-strong" aria-hidden />
                {reports.length > 1 && (
                  <span className="absolute top-0 h-px bg-line-strong" aria-hidden
                    style={{ left: i === 0 ? "50%" : 0, right: i === reports.length - 1 ? "50%" : 0 }} />
                )}
                <Node p={r} ctx={ctx} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The line from the top of the chart down to the person jumped to, drawn thick over the
 * ordinary connectors. Measured from the cards on screen, so it follows any layout.
 */
function Trace({ ids, content, zoom, version }: { ids: string[]; content: RefObject<HTMLDivElement | null>; zoom: number; version: unknown }) {
  const [d, setD] = useState("");
  useLayoutEffect(() => {
    const measure = () => {
      const box = content.current?.getBoundingClientRect();
      if (!box || ids.length < 2) return setD("");
      // Rects are on screen (zoomed); the drawing lives inside the zoomed layer.
      const at = (id: string) => {
        const r = document.getElementById(`org-${id}`)?.getBoundingClientRect();
        return r && { x: (r.left + r.width / 2 - box.left) / zoom, top: (r.top - box.top) / zoom, bottom: (r.bottom - box.top) / zoom };
      };
      const parts: string[] = [];
      for (let i = 1; i < ids.length; i++) {
        const a = at(ids[i - 1]);
        const b = at(ids[i]);
        if (!a || !b) continue;
        const bar = b.top - 44; // children hang 44px (pt-11) below the bar that joins them
        parts.push(`M${a.x} ${a.bottom}V${bar}H${b.x}V${b.top}`);
      }
      setD(parts.join(""));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ids, content, zoom, version]);
  if (!d) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="var(--brand-ink)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function JumpTo({ people, chosen, onPick, onClear }: { people: OrgPerson[]; chosen: OrgPerson | null; onPick: (id: string) => void; onClear: () => void }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = text.trim().toLowerCase();
  const matches = q ? people.filter((p) => p.fullName.toLowerCase().includes(q) || p.jobTitle?.toLowerCase().includes(q)).slice(0, 8) : [];
  const pick = (p: OrgPerson) => { onPick(p.id); setText(""); setOpen(false); };

  return (
    <div className="relative w-72">
      <FontAwesomeIcon icon={faUserCircle} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted" />
      <input role="combobox" aria-expanded={open && matches.length > 0} aria-controls="org-jump-list" aria-label="Jump to an employee"
        placeholder={chosen ? chosen.fullName : "Jump to an employee…"} value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && matches[active]) { e.preventDefault(); pick(matches[active]); }
          else if (e.key === "Escape") { setText(""); setOpen(false); }
        }}
        className={cx("h-11 w-full rounded-full border bg-surface pl-11 pr-10 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-ink focus:ring-2 focus:ring-brand/20",
          chosen ? "border-brand-ink placeholder:text-ink" : "border-line-strong")} />
      {chosen && !text && (
        <button type="button" onClick={onClear} aria-label="Clear the highlighted person"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink">
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      )}
      {open && matches.length > 0 && (
        <ul id="org-jump-list" role="listbox" className="absolute left-0 top-full z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {matches.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(p); }} onMouseEnter={() => setActive(i)}
                className={cx("flex w-full items-center gap-3 px-3 py-2 text-left", i === active && "bg-subtle")}>
                <TenureFrame hireDate={p.hireDate} founding={p.foundingMember} radius="rounded-lg" small><Photo name={p.fullName} src={p.photoUrl} size={32} /></TenureFrame>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{p.fullName}</span>
                  <span className="block truncate text-xs text-muted">{p.jobTitle ?? "No job title"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const INCLUDE_LABELS: [keyof Include, string][] = [
  ["name", "Name"], ["photo", "Photo"], ["legalEntity", "Legal entity"],
  ["department", "Department"], ["location", "Location"], ["hireDate", "Hire date"],
];

function ExportDialog({ people, reports, roots, shown, onClose }: {
  people: OrgPerson[]; reports: Map<string, OrgPerson[]>; roots: OrgPerson[]; shown: Set<string>; onClose: () => void;
}) {
  const [mode, setMode] = useState<"screen" | "custom">("screen");
  const [start, setStart] = useState(roots[0]?.id ?? "");
  const [levels, setLevels] = useState(2);
  const [include, setInclude] = useState<Include>(DEFAULT_INCLUDE);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string>();
  const sorted = useMemo(() => [...people].sort((a, b) => a.fullName.localeCompare(b.fullName)), [people]);

  const run = async (format: "pdf" | "png") => {
    setBusy(format);
    setError(undefined);
    try {
      const startPerson = people.find((p) => p.id === start);
      const tree = mode === "screen" || !startPerson ? screenTree(roots, reports, shown) : subTree(startPerson, reports, levels);
      const canvas = await drawChart(tree, mode === "screen" ? DEFAULT_INCLUDE : include, `Org chart · ${formatDate(new Date().toISOString().slice(0, 10))}`);
      if (format === "pdf") save(canvasToPdf(canvas), "org-chart.pdf");
      else await new Promise<void>((done) => canvas.toBlob((b) => { if (b) save(b, "org-chart.png"); done(); }, "image/png"));
      onClose();
    } catch {
      setError("The chart is too large to draw. Start with someone lower down or export fewer levels.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Download org chart" description="A picture of the chart as a PDF or PNG."
      footer={<Button variant="secondary" onClick={onClose} disabled={busy !== null}>Cancel</Button>}>
      <div className="space-y-4">
        <div className="space-y-2">
          {([["screen", "Match export to what is on screen"], ["custom", "Customize export"]] as const).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input type="radio" name="org-export" className="accent-[var(--brand)]" checked={mode === key} onChange={() => setMode(key)} />
              <span className={mode === key ? "font-medium" : undefined}>{label}</span>
            </label>
          ))}
        </div>
        {mode === "custom" && (
          <div className="space-y-4 border-t border-line pt-4">
            <label className="block text-sm font-medium text-ink">Start with
              <Select value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5">
                {sorted.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </Select>
            </label>
            <label className="block text-sm font-medium text-ink">Levels to export
              <Select value={String(levels)} onChange={(e) => setLevels(Number(e.target.value))} className="mt-1.5 w-32">
                {DEPTHS.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="99">All</option>
              </Select>
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-ink">Include</legend>
              <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-2">
                {INCLUDE_LABELS.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={include[key]} onChange={() => setInclude({ ...include, [key]: !include[key] })} />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Job title is always included.</p>
            </fieldset>
          </div>
        )}
        {error && <ErrorNote error={error} />}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="secondary" busy={busy === "pdf"} disabled={busy !== null} onClick={() => run("pdf")}><FontAwesomeIcon icon={faDownload} className="mr-2" />Download PDF</Button>
          <span className="text-sm text-muted">or</span>
          <Button variant="secondary" busy={busy === "png"} disabled={busy !== null} onClick={() => run("png")}><FontAwesomeIcon icon={faDownload} className="mr-2" />Download PNG</Button>
        </div>
      </div>
    </Dialog>
  );
}

export function OrgChart({ focus }: { focus: string | null }) {
  const { can } = useSession();
  const snapshot = useSnapshot();
  const { people, byId, children, roots, loaded, error } = useOrgPeople();
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
  const [depth, setDepth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const content = useRef<HTMLDivElement>(null);

  const levels = useMemo(() => {
    const out = new Map<string, number>();
    const walk = (p: OrgPerson, level: number) => { out.set(p.id, level); for (const c of children.get(p.id) ?? []) walk(c, level + 1); };
    roots.forEach((r) => walk(r, 0));
    return out;
  }, [roots, children]);
  const toDepth = (n: number) => new Set([...levels].filter(([, level]) => level < n - 1).map(([id]) => id));
  const shown = expanded ?? toDepth(depth);
  // From the top of the chart down to the focused person.
  const trail = useMemo(() => {
    const out: string[] = [];
    for (let p = focused ? byId.get(focused) : undefined; p; p = p.managerId ? byId.get(p.managerId) : undefined) out.unshift(p.id);
    return out;
  }, [focused, byId]);

  const jump = (id: string) => {
    const next = new Set(shown);
    for (let p = byId.get(id); p?.managerId && byId.has(p.managerId); p = byId.get(p.managerId)) next.add(p.managerId);
    setExpanded(next);
    setFocused(id);
  };
  // Arriving from "View in org chart" elsewhere: open the way down to them.
  const arrived = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || !focus || arrived.current === focus || !byId.has(focus)) return;
    arrived.current = focus;
    jump(focus);
  });
  useEffect(() => {
    if (focused) document.getElementById(`org-${focused}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [focused]);

  const exportCsv = (kind: CsvKind) => {
    const names: Record<CsvKind, string> = { visio: "org-chart-visio.csv", lucidchart: "org-chart-lucidchart.csv", plain: "org-chart.csv" };
    save(orgCsv(kind, people, byId, levels), names[kind]);
  };

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!loaded) return <Loading shape="cards" />;

  const ctx: Ctx = {
    children, expanded: shown, focused, path: new Set(trail), full: can(PERMS.employeesView), openSnapshot: snapshot.open,
    toggle: (id) => { const next = new Set(shown); if (next.has(id)) next.delete(id); else next.add(id); setExpanded(next); },
  };
  const zoomAt = ZOOMS.indexOf(zoom);
  const menuItem = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-subtle";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <JumpTo people={people} chosen={focused ? byId.get(focused) ?? null : null} onPick={jump} onClear={() => setFocused(null)} />
        <label className="flex items-center gap-2 text-sm text-muted">Depth
          <Select value={expanded ? "" : String(depth)} onChange={(e) => { setDepth(Number(e.target.value)); setExpanded(null); }} className="h-11 w-28 rounded-full">
            {expanded && <option value="">Custom</option>}
            {DEPTHS.map((d) => <option key={d} value={d}>{d} {d === 1 ? "level" : "levels"}</option>)}
            <option value="99">All</option>
          </Select>
        </label>
        <Button variant="secondary" onClick={() => { setExpanded(new Set()); setFocused(null); }}><FontAwesomeIcon icon={faCompress} className="mr-2" />Collapse all</Button>
        <div className="ml-auto flex items-center gap-2">
          <Menu width="w-80" trigger={(open, toggle) => (
            <Button variant="secondary" onClick={toggle} aria-expanded={open}>
              <FontAwesomeIcon icon={faFileExport} className="mr-2" />Export<FontAwesomeIcon icon={faChevronDown} className="ml-2 text-[10px]" />
            </Button>
          )}>
            {(close) => (
              <>
                <button type="button" role="menuitem" className={cx(menuItem, "items-start")} onClick={() => { close(); setExporting(true); }}>
                  <FontAwesomeIcon icon={faDownload} fixedWidth className="mt-0.5 text-muted" />
                  <span><span className="block font-medium">Download org chart</span>
                    <span className="block text-xs text-muted">A picture of the org chart as a PDF or PNG.</span></span>
                </button>
                <div className="my-1.5 border-t border-line" />
                <p className="px-4 pb-1 pt-1.5 text-xs font-medium text-muted">Download a .csv to import to:</p>
                <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); exportCsv("visio"); }}>
                  <FontAwesomeIcon icon={faFileCsv} fixedWidth className="text-muted" />Visio</button>
                <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); exportCsv("lucidchart"); }}>
                  <FontAwesomeIcon icon={faFileCsv} fixedWidth className="text-muted" />Lucidchart</button>
                <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); exportCsv("plain"); }}>
                  <FontAwesomeIcon icon={faFileCsv} fixedWidth className="text-muted" />Unformatted .csv</button>
              </>
            )}
          </Menu>
          <div className="flex items-center rounded-full border border-line-strong bg-surface">
            <IconButton label="Zoom out" disabled={zoomAt <= 0} onClick={() => setZoom(ZOOMS[zoomAt - 1])}><FontAwesomeIcon icon={faMagnifyingGlassMinus} /></IconButton>
            <button type="button" onClick={() => setZoom(1)} className="w-12 text-center text-xs tabular-nums text-muted hover:text-ink" title="Reset zoom">{Math.round(zoom * 100)}%</button>
            <IconButton label="Zoom in" disabled={zoomAt >= ZOOMS.length - 1} onClick={() => setZoom(ZOOMS[zoomAt + 1])}><FontAwesomeIcon icon={faMagnifyingGlassPlus} /></IconButton>
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-260px)] min-h-[420px] overflow-auto rounded-2xl border border-line bg-subtle/40">
        {roots.length ? (
          <div ref={content} className="relative inline-flex min-w-full justify-center gap-10 px-10 pb-24 pt-14" style={{ zoom }}>
            <Trace ids={trail} content={content} zoom={zoom} version={shown} />
            {roots.map((r) => <Node key={r.id} p={r} ctx={ctx} />)}
          </div>
        ) : <p className="p-6 text-sm text-muted">No one is working here yet.</p>}
      </div>
      {exporting && <ExportDialog people={people} reports={children} roots={roots} shown={shown} onClose={() => setExporting(false)} />}
    </>
  );
}
