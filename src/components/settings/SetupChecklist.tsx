"use client";

import { faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "urql";

import { graphql } from "@/gql";
import { cx } from "@/components/ui";

type Step = { key: string; label: string; why: string; href: string; done: boolean; group: string };
export type Setup = { percent: number; steps: Step[] };

const SetupDocument = graphql(`
  query SetupProgress { setupProgress { percent steps { key label why href done group } } }
`);

const GROUPS: [string, string][] = [["essentials", "Essentials"], ["payroll", "Payroll"], ["attendance", "Attendance"]];

function Ring({ percent }: { percent: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <span className="relative grid h-14 w-14 flex-none place-items-center">
      <svg viewBox="0 0 50 50" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="5" className="stroke-subtle" />
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-brand"
          strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <span className="text-[13px] font-semibold text-ink">{percent}%</span>
    </span>
  );
}

/**
 * On Home: the company setup checklist, steps ticked from what has been done. Gone once complete;
 * "Hide for now" puts it away until the page is opened again, so setup is never forgotten.
 */
export function SetupCard({ setup, company }: { setup: Setup; company: string }) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  if (hidden || setup.percent >= 100) return null;
  const next = setup.steps.find((s) => !s.done);
  const done = setup.steps.filter((s) => s.done).length;
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-4">
        <Ring percent={setup.percent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Set up {company}</h2>
              <p className="mt-0.5 text-sm text-muted">{done} of {setup.steps.length} done. Each step ticks itself once it is done.</p>
            </div>
            <button type="button" className="flex-none text-sm text-muted hover:text-ink"
              onClick={() => setHidden(true)}>
              Hide for now
            </button>
          </div>
          {next && (
            <Link href={next.href} className="mt-3 flex items-center gap-3 rounded-xl bg-brand/10 px-3.5 py-2.5 hover:bg-brand/15">
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-brand-ink">Next</span>
                <span className="block font-medium text-ink">{next.label}</span>
                <span className="block text-xs text-muted">{next.why}</span>
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="text-sm text-brand-ink" />
            </Link>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-3 text-sm font-medium text-brand-ink hover:underline">
            {open ? "Hide all steps" : "See all steps"}
          </button>
          {open && <StepList steps={setup.steps} />}
        </div>
      </div>
    </section>
  );
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-3 grid gap-4">
      {GROUPS.map(([group, title]) => {
        const items = steps.filter((s) => s.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
            <ul className="grid gap-0.5">
              {items.map((s) => (
                <li key={s.key}>
                  <Link href={s.href} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-subtle">
                    <span className={cx("grid h-5 w-5 flex-none place-items-center rounded-full text-[10px]",
                      s.done ? "bg-brand text-white" : "border-2 border-line-strong text-transparent")}>
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                    <span className={cx("text-sm", s.done ? "text-muted line-through decoration-line-strong" : "font-medium text-ink group-hover:text-brand-ink")}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** At the top of Settings: progress and the next step, until setup is complete. */
export function SetupBar() {
  const [{ data }] = useQuery({ query: SetupDocument, requestPolicy: "cache-and-network" });
  const [open, setOpen] = useState(false);
  const setup = data?.setupProgress;
  if (!setup || setup.percent >= 100) return null;
  const next = setup.steps.find((s) => !s.done);
  const done = setup.steps.filter((s) => s.done).length;
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">Setup: {done} of {setup.steps.length} done</span>
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-brand-ink hover:underline">{open ? "Hide steps" : "All steps"}</button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${setup.percent}%` }} />
          </div>
        </div>
        {next && (
          <Link href={next.href} className="inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90">
            Next: {next.label} <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          </Link>
        )}
      </div>
      {open && <StepList steps={setup.steps} />}
    </div>
  );
}
