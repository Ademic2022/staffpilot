"use client";

import Link from "next/link";
import { useState } from "react";

import { IconAlert } from "@/components/icons";
import { Photo } from "@/components/home/Widgets";
import { cx } from "@/components/ui";

type Gap = { key: string; label: string; tab: string; critical: boolean; why: string };
export type Completeness = { percent: number; missing: Gap[] };
type DataGap = { key: string; label: string; why: string; count: number; people: { id: string; fullName: string; jobTitle?: string | null; photoUrl?: string | null }[] };

/** A ring showing how complete a record is. */
function Ring({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <span className="relative grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 50 50" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="5" className="stroke-subtle" />
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-brand transition-[stroke-dashoffset]"
          strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <span className="text-[13px] font-semibold text-ink">{percent}%</span>
    </span>
  );
}

/**
 * What a record still needs, each item linking to the tab where it is filled in. Critical gaps
 * (payroll, emergencies) are marked and listed first. `self` words it for the person themself.
 */
export function CompletenessCard({ data, employeeId, self, name, compact }: {
  data: Completeness; employeeId: string; self: boolean; name?: string; compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  if (data.percent >= 100 || !data.missing.length) return null;
  const critical = data.missing.filter((m) => m.critical).length;
  const shown = open ? data.missing : data.missing.slice(0, 3);
  return (
    <section className={cx("rounded-2xl border bg-surface p-4 shadow-sm sm:p-5", critical ? "border-amber-300/70 dark:border-amber-500/40" : "border-line")}>
      <div className="flex items-start gap-4">
        <Ring percent={data.percent} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-ink">
            {self ? `Your profile is ${data.percent}% complete` : `${name ?? "This"} record is ${data.percent}% complete`}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {critical
              ? `${critical} ${critical === 1 ? "detail is" : "details are"} needed before ${self ? "you can be paid and reached" : "payroll and HR can rely on it"}.`
              : self ? "A few details left to make your profile complete." : "A few details left."}
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {shown.map((m) => (
              <li key={m.key}>
                <Link href={`/employees/${employeeId}?tab=${m.tab}`} title={m.why}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle">
                  {m.critical
                    ? <IconAlert size={16} className="flex-none text-amber-600 dark:text-amber-400" />
                    : <span className="h-4 w-4 flex-none rounded-full border-2 border-line-strong" aria-hidden />}
                  <span className="min-w-0">
                    <span className="font-medium text-ink group-hover:text-brand-ink group-hover:underline">{self ? "Add your " : "Add "}{m.label.charAt(0).toLowerCase() + m.label.slice(1)}</span>
                    {m.critical && <span className="block text-xs text-muted">{m.why}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {data.missing.length > 3 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-sm font-medium text-brand-ink hover:underline">
              {open ? "Show less" : `Show all ${data.missing.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** For HR: critical gaps across the company, with the first few people for each. */
export function DataGapsCard({ gaps }: { gaps: DataGap[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (!gaps.length) return null;
  return (
    <section className="rounded-2xl border border-amber-300/70 bg-surface p-4 shadow-sm dark:border-amber-500/40 sm:p-5">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        <IconAlert size={18} className="text-amber-600 dark:text-amber-400" /> Records to complete
      </h2>
      <p className="mt-0.5 text-sm text-muted">These gaps stop payroll or emergency contact from working for some people.</p>
      <ul className="mt-3 divide-y divide-line">
        {gaps.map((g) => (
          <li key={g.key} className="py-2.5">
            <button type="button" onClick={() => setOpenKey(openKey === g.key ? null : g.key)} aria-expanded={openKey === g.key}
              className="flex w-full items-center justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  {g.count} {g.count === 1 ? "person has" : "people have"} no {g.label.charAt(0).toLowerCase() + g.label.slice(1)}
                </span>
                <span className="block text-xs text-muted">{g.why}</span>
              </span>
              <span className="flex flex-none -space-x-2">
                {g.people.slice(0, 4).map((p) => <Photo key={p.id} name={p.fullName} src={p.photoUrl} size={28} className="rounded-full ring-2 ring-surface" />)}
              </span>
            </button>
            {openKey === g.key && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {g.people.map((p) => (
                  <li key={p.id}>
                    <Link href={`/employees/${p.id}`} className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink hover:border-brand hover:text-brand-ink">
                      {p.fullName}
                    </Link>
                  </li>
                ))}
                {g.count > g.people.length && <li className="px-1 py-1 text-xs text-muted">and {g.count - g.people.length} more</li>}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
