"use client";

import {
  faCalendarDays, faChevronRight, faDownLeftAndUpRightToCenter, faFaceFrown, faLocationDot, faSliders, faStopwatch, faTriangleExclamation,
  faUpRightAndDownLeftFromCenter, faUsers, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "urql";

import { BarList, ChartTable, Legend, MonthColumns, MonthLine, SERIES, TipRow, type Column, type Series } from "@/components/home/Charts";
import { BigFigure, Empty, Widget, ago, longDate, monthName, plural } from "@/components/home/Widgets";
import { tenure } from "@/components/profile/Vitals";
import { Select, Table, TD, TH, cx, Loading } from "@/components/ui";
import { graphql } from "@/gql";
import type { WidgetFilter } from "@/gql/graphql";
import { formatDate, formatDays, formatMoney, formatRange } from "@/lib/format";

/* ---------------------------------------------------------------- Filters */

const FiltersDocument = graphql(`
  query WidgetFilters {
    widgetFilters { key label options { value label } }
  }
`);

type Dimension = "department" | "location" | "legalEntity" | "employmentType" | "age" | "service";
export type Filter = Partial<Record<Dimension, string[]>>;

const FIELD: Record<Dimension, keyof WidgetFilter> = {
  department: "departmentIds", location: "locationIds", legalEntity: "legalEntityIds",
  employmentType: "employmentTypes", age: "ageBands", service: "serviceBands",
};

/** The API's WidgetFilter for a filter. */
export function toInput(filter: Filter): WidgetFilter {
  const input: WidgetFilter = {};
  for (const [key, values] of Object.entries(filter) as [Dimension, string[]][]) {
    if (values?.length) (input as Record<string, string[]>)[FIELD[key]] = values;
  }
  return input;
}

const count = (filter: Filter) => Object.values(filter).reduce((n, v) => n + (v?.length ?? 0), 0);

/** A widget's filter, remembered in this browser (a per-viewer convenience; nothing breaks without it). */
export function useWidgetFilter(key: string) {
  const storage = `home-filter:${key}`;
  const [filter, setFilter] = useState<Filter>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storage) ?? "{}") as Filter;
    } catch {
      return {};
    }
  });
  const update = (next: Filter) => {
    setFilter(next);
    try {
      window.localStorage.setItem(storage, JSON.stringify(next));
    } catch {
      // Private windows and blocked storage: the filter still works for this visit.
    }
  };
  return [filter, update] as const;
}

function FilterMenu({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  const [open, setOpen] = useState(false);
  const [dimension, setDimension] = useState<Dimension | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [{ data }] = useQuery({ query: FiltersDocument, pause: !open });
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const active = count(filter);
  const dims = data?.widgetFilters ?? [];
  const current = dims.find((d) => d.key === dimension);
  const toggle = (key: Dimension, value: string) => {
    const values = filter[key] ?? [];
    onChange({ ...filter, [key]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] });
  };
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => { setOpen(!open); setDimension(null); }} aria-expanded={open} aria-haspopup="menu"
        aria-label={active ? `Filter (${active} on)` : "Filter"} title="Filter"
        className={cx("relative grid h-9 w-9 place-items-center rounded-full border bg-surface text-ink transition hover:bg-subtle",
          open || active ? "border-brand-ink ring-2 ring-brand/20" : "border-line-strong")}>
        <FontAwesomeIcon icon={faSliders} className="text-[13px]" />
        {active > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">{active}</span>}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 flex items-start text-left">
          {current && (
            <div className="mr-1 max-h-72 w-60 overflow-y-auto rounded-xl border border-line bg-surface py-1.5 shadow-lg">
              {current.options.length ? current.options.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-subtle">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={(filter[current.key as Dimension] ?? []).includes(o.value)}
                    onChange={() => toggle(current.key as Dimension, o.value)} />
                  {o.label}
                </label>
              )) : <p className="px-3.5 py-2 text-sm text-muted">Nothing to choose yet.</p>}
            </div>
          )}
          <div className="w-56 rounded-xl border border-line bg-surface py-1.5 shadow-lg">
            {!data && <div className="px-4 py-2"><Loading shape="inline" rows={2} /></div>}
            {dims.map((d) => {
              const on = filter[d.key as Dimension]?.length ?? 0;
              return (
                <button key={d.key} type="button" role="menuitem" onMouseEnter={() => setDimension(d.key as Dimension)} onClick={() => setDimension(d.key as Dimension)}
                  className={cx("flex w-full items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-subtle", dimension === d.key && "bg-subtle")}>
                  <span>{d.label}{on > 0 && <span className="ml-1.5 text-xs text-brand-ink">({on})</span>}</span>
                  <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-muted" />
                </button>
              );
            })}
            {active > 0 && (
              <button type="button" onClick={() => onChange({})} className="mt-1 flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-sm font-medium text-brand-ink hover:bg-subtle">
                <FontAwesomeIcon icon={faXmark} className="text-xs" /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Filter and expand buttons for a widget header: on hover, and kept up while a filter is on or the widget is expanded. */
export function WidgetTools({ filter, onFilter, expanded, onExpand }: { filter: Filter; onFilter: (f: Filter) => void; expanded: boolean; onExpand: () => void }) {
  const sticky = expanded || count(filter) > 0;
  return (
    <div className={cx("flex items-center gap-2 transition", sticky ? "opacity-100" : "opacity-0 group-hover/widget:opacity-100 has-[:focus-visible]:opacity-100 has-[[aria-expanded=true]]:opacity-100 max-lg:opacity-100")}>
      <FilterMenu filter={filter} onChange={onFilter} />
      <button type="button" onClick={onExpand} aria-label={expanded ? "Collapse" : "Expand"} title={expanded ? "Collapse" : "Expand"}
        className={cx("grid h-9 w-9 place-items-center rounded-full border bg-surface text-ink transition hover:bg-subtle",
          expanded ? "border-brand-ink ring-2 ring-brand/20" : "border-line-strong")}>
        <FontAwesomeIcon icon={expanded ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter} className="text-[13px]" />
      </button>
    </div>
  );
}

function FilterNote({ filter, onClear }: { filter: Filter; onClear: () => void }) {
  const n = count(filter);
  if (!n) return null;
  return (
    <p className="mb-3 flex items-center gap-2 text-xs text-muted">
      <FontAwesomeIcon icon={faSliders} className="text-[10px]" /> Filtered by {plural(n, "choice")}
      <button type="button" onClick={onClear} className="font-medium text-brand-ink hover:underline">Clear</button>
    </p>
  );
}

type ExpandProps = { expanded: boolean; onExpand: () => void };

const ReportLinks = ({ links }: { links: [string, string][] }) => (
  <div className="mt-auto space-y-1 border-t border-line pt-3">
    {links.map(([href, label]) => <Link key={href + label} href={href} className="block text-sm font-medium text-brand-ink hover:underline">{label}</Link>)}
  </div>
);

/* ------------------------------------------------------------ Time off requests */

const PendingDocument = graphql(`
  query PendingTimeOff($filter: WidgetFilter) {
    pendingTimeOff(filter: $filter) {
      id approverName startDate endDate days leaveType submittedAt urgent
      person { id fullName photoUrl }
    }
  }
`);

export function TimeOffRequestsWidget({ expanded, onExpand }: ExpandProps) {
  const [filter, setFilter] = useWidgetFilter("time_off_requests");
  const [{ data }] = useQuery({ query: PendingDocument, variables: { filter: toInput(filter) } });
  const [only, setOnly] = useState<"urgent" | "other" | null>(null);
  const rows = data?.pendingTimeOff ?? [];
  const urgent = rows.filter((r) => r.urgent);
  const other = rows.filter((r) => !r.urgent);
  const shown = only === "urgent" ? urgent : only === "other" ? other : rows;
  return (
    <Widget title="Time off requests" icon={faCalendarDays} bodyClassName={expanded ? undefined : "justify-center"}
      tools={<WidgetTools filter={filter} onFilter={setFilter} expanded={expanded} onExpand={onExpand} />}>
      <FilterNote filter={filter} onClear={() => setFilter({})} />
      {!expanded ? (
        <div className="divide-y divide-line">
          <BigFigure icon={faStopwatch} value={urgent.length} label="Urgent requests" sub="Starting within 7 days" href="/leave/approvals" />
          <BigFigure icon={faCalendarDays} value={other.length} label="Other requests" href="/leave/approvals" />
        </div>
      ) : (
        <>
          <div role="tablist" className="mb-3 flex items-center gap-4 text-[15px] font-semibold">
            {([["urgent", faStopwatch, `${urgent.length} Urgent`], ["other", faCalendarDays, `${other.length} Other requests`]] as const).map(([key, icon, label], i) => (
              <span key={key} className="flex items-center gap-4">
                {i > 0 && <span className="h-5 w-px bg-line" aria-hidden />}
                <button type="button" role="tab" aria-selected={only === key} onClick={() => setOnly(only === key ? null : key)}
                  className={cx("flex items-center gap-2 rounded-md px-1 hover:underline", only === key ? "text-ink underline" : "text-brand-ink")}>
                  <FontAwesomeIcon icon={icon} className="text-[13px]" />{label}
                </button>
              </span>
            ))}
          </div>
          {shown.length ? (
            <div className="-mx-4 overflow-x-auto">
              <Table>
                <thead><tr><TH>Name</TH><TH>Approver</TH><TH>Request</TH><TH>Submitted</TH></tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <TD>
                        <Link href={`/employees/${r.person.id}`} className="flex items-center gap-2 font-medium text-brand-ink hover:underline">
                          {r.urgent && <FontAwesomeIcon icon={faTriangleExclamation} className="text-[12px] text-amber-600 dark:text-amber-400" aria-label="Urgent" />}
                          {r.person.fullName}
                        </Link>
                      </TD>
                      <TD className="text-muted">{r.approverName ?? "HR"}</TD>
                      <TD>{formatRange(r.startDate, r.endDate)} <span className="text-muted">({formatDays(r.days)} {r.leaveType})</span></TD>
                      <TD className="whitespace-nowrap text-muted">{ago(r.submittedAt)}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : <Empty>No requests waiting.</Empty>}
          <div className="mt-4"><ReportLinks links={[["/leave/approvals", "Leave approvals »"], ["/leave/calendar", "Leave calendar »"], ["/reports/leave", "Leave taken report »"]]} /></div>
        </>
      )}
    </Widget>
  );
}

/* ---------------------------------------------------------------- Time off used */

const UsedDocument = graphql(`
  query TimeOffUsedWidget($leaveTypeId: ID!, $filter: WidgetFilter) {
    timeOffUsed(leaveTypeId: $leaveTypeId, filter: $filter) {
      total people
      months { month value }
      previousYear { month value }
    }
  }
`);

const UsedTypesDocument = graphql(`
  query TimeOffUsedTypes {
    leaveTypes { id name }
  }
`);

export function TimeOffUsedWidget({ expanded, onExpand }: ExpandProps) {
  const [filter, setFilter] = useWidgetFilter("time_off_used");
  const [{ data: types }] = useQuery({ query: UsedTypesDocument });
  const [chosen, setChosen] = useState<string>();
  const [table, setTable] = useState(false);
  const [lastYear, setLastYear] = useState(false);
  const typeId = chosen ?? types?.leaveTypes[0]?.id;
  const [{ data }] = useQuery({ query: UsedDocument, variables: { leaveTypeId: typeId ?? "", filter: toInput(filter) }, pause: !typeId });
  const used = data?.timeOffUsed;
  const now: Series = { key: "days", label: "This year", color: SERIES[0] };
  const before: Series = { key: "previous", label: "Previous year", color: SERIES[1] };
  const columns: Column[] = (used?.months ?? []).map((m, i) => ({
    month: m.month, label: monthName(m.month), year: Number(m.month.slice(0, 4)),
    values: { days: Number(m.value), previous: Number(used?.previousYear[i]?.value ?? 0) },
  }));
  return (
    <Widget title="Time off used" icon={faCalendarDays}
      tools={<WidgetTools filter={filter} onFilter={setFilter} expanded={expanded} onExpand={onExpand} />}>
      <FilterNote filter={filter} onClear={() => setFilter({})} />
      {types && types.leaveTypes.length > 0 && (
        <Select aria-label="Leave type" value={typeId} onChange={(e) => setChosen(e.target.value)}>
          {types.leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      )}
      {expanded && used && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-semibold text-ink">
            Total time off used <span className="font-normal text-muted">{Number(used.total)} days</span>
            <span className="flex items-center gap-1 font-normal text-muted" title="People who took it"><FontAwesomeIcon icon={faUsers} className="text-xs" />{used.people}</span>
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <button type="button" role="switch" aria-checked={lastYear} onClick={() => setLastYear(!lastYear)}
              className={cx("relative h-5 w-9 rounded-full transition", lastYear ? "bg-brand" : "bg-line-strong")}>
              <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", lastYear ? "left-[18px]" : "left-0.5")} />
            </button>
            Show previous year
          </label>
        </div>
      )}
      <div className="mt-4 flex-1">
        {!data ? <div className="h-[150px]" /> : table
          ? <ChartTable columns={columns} series={lastYear ? [now, before] : [now]} />
          : <MonthLine columns={columns} series={now} unit="days taken" compare={expanded && lastYear ? before : undefined}
              axis={expanded} tickSuffix=" d" height={expanded ? 260 : 150} />}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>Approved days by start month, last 12 months</span>
        <button type="button" onClick={() => setTable(!table)} className="hover:text-ink">{table ? "Show chart" : "Show table"}</button>
      </div>
      {expanded && <div className="mt-3"><ReportLinks links={[["/reports/leave", "Leave taken report »"], ["/leave/calendar", "Leave calendar »"]]} /></div>}
    </Widget>
  );
}

/* --------------------------------------------------------------------- Location */

const LocationDocument = graphql(`
  query LocationWidget($filter: WidgetFilter) {
    locationBreakdown(filter: $filter) {
      total
      current { label value }
      history { month values { label value } }
    }
  }
`);

export function LocationWidget({ expanded, onExpand }: ExpandProps) {
  const [filter, setFilter] = useWidgetFilter("location");
  const [{ data }] = useQuery({ query: LocationDocument, variables: { filter: toInput(filter) } });
  const [table, setTable] = useState(false);
  const loc = data?.locationBreakdown;
  // Fixed slot order for the three largest locations; the rest fold into "Other" (data-viz: never generate hues).
  const named = (loc?.current ?? []).slice(0, 3).map((c) => c.label);
  const series: Series[] = [
    ...named.map((label, i) => ({ key: label, label, color: SERIES[i] })),
    ...((loc?.current.length ?? 0) > 3 ? [{ key: "Other", label: "Other", color: "var(--muted)" }] : []),
  ];
  const columns: Column[] = (loc?.history ?? []).map((h) => {
    const values: Record<string, number> = {};
    for (const v of h.values) values[named.includes(v.label) ? v.label : "Other"] = (values[named.includes(v.label) ? v.label : "Other"] ?? 0) + v.value;
    values.total = h.values.reduce((n, v) => n + v.value, 0);
    return { month: h.month, label: monthName(h.month), year: Number(h.month.slice(0, 4)), values };
  });
  return (
    <Widget title="Location" icon={faLocationDot}
      tools={<WidgetTools filter={filter} onFilter={setFilter} expanded={expanded} onExpand={onExpand} />}>
      <FilterNote filter={filter} onClear={() => setFilter({})} />
      {!loc ? <div className="h-24" /> : !loc.current.length ? <Empty>No one matches.</Empty> : !expanded ? (
        <BarList items={loc.current} />
      ) : (
        <>
          <h3 className="font-display text-[20px] text-ink">{longDate(new Date().toISOString().slice(0, 10), { month: "short", year: "numeric" })}</h3>
          <ul className="mt-3 divide-y divide-line text-sm">
            {loc.current.map((c) => {
              const slot = series.find((s) => s.key === c.label) ?? series.find((s) => s.key === "Other");
              return (
                <li key={c.label} className="flex items-center gap-3 py-2">
                  <span className="h-3 w-3 flex-none rounded-[3px]" style={{ background: slot?.color }} aria-hidden />
                  <span className="flex-1 text-ink">{c.label} <span className="text-muted">{Math.round((c.value / loc.total) * 100)}%</span></span>
                  <span className="tabular-nums text-ink">{c.value}</span>
                </li>
              );
            })}
            <li className="flex justify-between py-2 font-semibold text-ink"><span>Total</span><span className="tabular-nums">{loc.total}</span></li>
          </ul>
          <div className="mt-5">
            {table ? <ChartTable columns={columns} series={[...series, { key: "total", label: "Total", color: "" }]} /> : (
              <>
                <MonthColumns columns={columns} series={series} stacked labelOf={(c) => String(c.values.total)} tip={(c) => (
                  <>
                    <TipRow value={c.values.total} label="people" />
                    {series.map((s) => <TipRow key={s.key} color={s.color} value={c.values[s.key] ?? 0} label={s.label} />)}
                  </>
                )} />
                <div className="mt-2"><Legend series={series} /></div>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <ReportLinks links={[["/reports/headcount", "Headcount report »"]]} />
            <button type="button" onClick={() => setTable(!table)} className="self-end text-xs text-muted hover:text-ink">{table ? "Show chart" : "Show table"}</button>
          </div>
        </>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------- People without a pay raise */

const PayRaiseDocument = graphql(`
  query PayRaiseWidget($filter: WidgetFilter) {
    withoutPayRaise(filter: $filter) {
      count
      people { hireDate lastRaise amount currency person { id fullName jobTitle } }
    }
  }
`);

export function PayRaiseWidget({ expanded, onExpand }: ExpandProps) {
  const [filter, setFilter] = useWidgetFilter("pay_raise");
  const [{ data }] = useQuery({ query: PayRaiseDocument, variables: { filter: toInput(filter) } });
  const [newestFirst, setNewestFirst] = useState(false);
  const result = data?.withoutPayRaise;
  const since = (p: NonNullable<typeof result>["people"][number]) => p.lastRaise ?? p.hireDate;
  const people = [...(result?.people ?? [])].sort((a, b) => (newestFirst ? -1 : 1) * since(a).localeCompare(since(b)));
  return (
    <Widget title="People without a pay raise" icon={faFaceFrown} bodyClassName={expanded ? undefined : "justify-center"}
      tools={<WidgetTools filter={filter} onFilter={setFilter} expanded={expanded} onExpand={onExpand} />}>
      <FilterNote filter={filter} onClear={() => setFilter({})} />
      {!result ? <div className="h-24" /> : !expanded ? (
        <BigFigure icon={faFaceFrown} value={result.count} label="Without pay raise" sub="for 12+ months" href="/reports/pay" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <FontAwesomeIcon icon={faFaceFrown} className="text-[34px] text-muted" />
            <div>
              <p className="font-display text-[26px] leading-tight text-ink">{plural(result.count, "person", "people")}</p>
              <p className="text-sm text-muted">Without a pay raise for 12+ months</p>
            </div>
          </div>
          {people.length ? (
            <div className="-mx-4 mt-4 max-h-[340px] overflow-y-auto">
              <Table>
                <thead>
                  <tr>
                    <TH>Name</TH><TH>Job title</TH>
                    <TH>
                      <button type="button" onClick={() => setNewestFirst(!newestFirst)} className="flex items-center gap-1 hover:text-ink">
                        Last pay raise <span aria-hidden>{newestFirst ? "↓" : "↑"}</span>
                      </button>
                    </TH>
                    <TH align="right">Amount</TH>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.person.id}>
                      <TD><Link href={`/employees/${p.person.id}?tab=job`} className="font-medium text-brand-ink hover:underline">{p.person.fullName}</Link></TD>
                      <TD className="text-muted">{p.person.jobTitle ?? "—"}</TD>
                      <TD className="text-muted">{p.lastRaise ? formatDate(p.lastRaise) : `Started ${tenure(p.hireDate)} ago`}</TD>
                      <TD align="right" className="tabular-nums">{p.amount && p.currency ? formatMoney(p.amount, p.currency) : "—"}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : <p className="mt-4 text-sm text-muted">Everyone has had a pay change in the last 12 months.</p>}
          <div className="mt-4"><ReportLinks links={[["/reports/pay", "Pay summary report »"]]} /></div>
        </>
      )}
    </Widget>
  );
}

