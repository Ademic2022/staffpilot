"use client";

import {
  faBriefcase, faBuilding, faCakeCandles, faCalendarDay, faChevronDown, faClockRotateLeft, faEnvelope, faHashtag, faIdBadge,
  faIdCard, faLocationDot, faMobileScreen, faSitemap, faUpRightFromSquare, faUser, faUserCheck, faUsers, faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "urql";

import { tenure } from "@/components/profile/Vitals";
import { cx, Loading } from "@/components/ui";
import { graphql } from "@/gql";
import type { EmployeeSnapshotQuery } from "@/gql/graphql";
import { formatDate, formatFrequency, formatMoney, humanize } from "@/lib/format";

/*
 * Snapshot (as BambooHR calls it): a quick look at someone's record in a panel docked to the
 * right of the page, without leaving it. Open it from anywhere with useSnapshot().open(id).
 */

const SnapshotContext = createContext<{ personId: string | null; open: (id: string) => void; close: () => void }>({
  personId: null, open: () => {}, close: () => {},
});

export const useSnapshot = () => useContext(SnapshotContext);

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ id: string; path: string } | null>(null);
  const pathname = usePathname();
  // Leaving the page closes it: the snapshot belongs to the page it was opened from.
  const personId = state && state.path === pathname ? state.id : null;
  return (
    <SnapshotContext.Provider value={{ personId, open: (id) => setState({ id, path: pathname }), close: () => setState(null) }}>
      {children}
      {personId && <SnapshotPanel key={personId} id={personId} onClose={() => setState(null)} />}
    </SnapshotContext.Provider>
  );
}

const SnapshotDocument = graphql(`
  query EmployeeSnapshot($id: ID!) {
    employee(id: $id) {
      id fullName photoUrl employeeNumber workEmail phone workPhone workPhoneExt dateOfBirth
      hireDate status employmentType
      jobTitle { name } department { name } grade { name } legalEntity { name }
      location { name city country }
      manager { id fullName }
      directReports { id }
      employmentHistory { id effectiveDate changeType jobTitle { name } }
      compensationHistory { id effectiveDate amount currency frequency }
    }
  }
`);

type Person = NonNullable<EmployeeSnapshotQuery["employee"]>;

function Section({ title, icon, children }: { title: string; icon: IconDefinition; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-line bg-surface shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold text-brand-ink">
          <FontAwesomeIcon icon={icon} fixedWidth className="text-[13px]" />{title}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={cx("text-xs text-brand-ink transition", !open && "-rotate-90")} />
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </section>
  );
}

function Fact({ icon, label, children }: { icon: IconDefinition; label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="flex gap-3">
      <FontAwesomeIcon icon={icon} fixedWidth className="mt-1 text-[14px] text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="break-words text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function age(iso: string) {
  const born = new Date(`${iso}T00:00:00`);
  const now = new Date();
  return now.getFullYear() - born.getFullYear() - (now < new Date(now.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
}

/** Job titles held, newest first, each with its dates and the pay at the end of it (when pay is visible). */
function jobHistory(p: Person) {
  const changes = [...p.employmentHistory].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const spells: { title: string; from: string; to: string | null }[] = [];
  for (const c of changes) {
    const title = c.jobTitle?.name ?? "No job title";
    const last = spells[spells.length - 1];
    if (last && last.title === title) continue;
    if (last) last.to = c.effectiveDate;
    spells.push({ title, from: c.effectiveDate, to: null });
  }
  const today = new Date().toISOString().slice(0, 10);
  const pay = [...p.compensationHistory].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  return spells.reverse().map((s) => {
    const end = s.to ?? today;
    const current = [...pay].reverse().find((c) => c.effectiveDate <= end && c.effectiveDate >= s.from)
      ?? [...pay].reverse().find((c) => c.effectiveDate <= end);
    return { ...s, pay: current };
  });
}

function SnapshotPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [{ data, error }] = useQuery({ query: SnapshotDocument, variables: { id } });
  useEffect(() => {
    const escape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose]);
  const p = data?.employee;
  const place = p?.location ? [p.location.city, p.location.country].filter(Boolean).join(", ") || p.location.name : null;
  const role = p ? [p.jobTitle?.name, p.department?.name].filter(Boolean).join(" | ") : "";

  return (
    <>
      {/* Below xl the panel floats over the page with a backdrop; from xl it docks and the page makes room. */}
      <div className="ui-fade-in fixed inset-0 z-40 bg-black/30 xl:hidden" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-label={p ? `Snapshot of ${p.fullName}` : "Snapshot"}
        className="ui-slide-in-right fixed inset-y-0 right-0 z-50 flex w-[min(380px,100vw)] flex-col border-l border-line bg-subtle shadow-xl xl:inset-y-3 xl:right-3 xl:rounded-2xl xl:border xl:shadow-lg">
        <header className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-line bg-surface px-4 py-3">
          <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink"><FontAwesomeIcon icon={faIdBadge} className="text-muted" />Snapshot</h2>
          <button type="button" onClick={onClose} aria-label="Close snapshot"
            className="grid h-8 w-8 place-items-center rounded-full border border-brand-ink text-ink hover:bg-subtle">
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </header>
        {error ? <p className="p-4 text-sm text-muted">This record could not be loaded.</p> : !p ? <div className="p-4"><Loading shape="inline" label="Loading" /></div> : (
          <>
            <div className="flex items-center gap-3.5 border-b border-line bg-surface px-4 py-4">
              <span className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-subtle ring-1 ring-line">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : <span className="grid h-full w-full place-items-center font-display text-lg text-muted">{p.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[22px] leading-tight text-brand-ink">{p.fullName}</p>
                {role && <p className="truncate text-sm text-muted">{role}</p>}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <Section title="Basic information" icon={faIdCard}>
                <Fact icon={faLocationDot} label="Location">{place}</Fact>
                <Fact icon={faEnvelope} label="Email">{p.workEmail ? <a href={`mailto:${p.workEmail}`} className="hover:underline">{p.workEmail}</a> : null}</Fact>
                <Fact icon={faMobileScreen} label="Mobile phone">{p.phone || null}</Fact>
                <Fact icon={faBuilding} label="Work phone">{p.workPhone ? `${p.workPhone}${p.workPhoneExt ? ` Ext. ${p.workPhoneExt}` : ""}` : null}</Fact>
                <Fact icon={faCakeCandles} label="Birth date">{p.dateOfBirth ? `${formatDate(p.dateOfBirth)} (${age(p.dateOfBirth)})` : null}</Fact>
                <Fact icon={faHashtag} label="Employee number">{p.employeeNumber}</Fact>
              </Section>
              <Section title="Job information" icon={faBriefcase}>
                <Fact icon={faCalendarDay} label="Hire date">{`${formatDate(p.hireDate)} (${tenure(p.hireDate)})`}</Fact>
                <Fact icon={faUserCheck} label="Status">{humanize(p.status)} · {humanize(p.employmentType)}</Fact>
                <Fact icon={faBriefcase} label="Job title">{p.jobTitle?.name ?? null}</Fact>
                <Fact icon={faSitemap} label="Department">{p.department?.name ?? null}</Fact>
                <Fact icon={faBuilding} label="Legal entity">{p.legalEntity.name}</Fact>
                <Fact icon={faHashtag} label="Grade">{p.grade?.name ?? null}</Fact>
              </Section>
              <Section title="Job history" icon={faClockRotateLeft}>
                <ol className="relative space-y-4">
                  {jobHistory(p).map((s, i, all) => (
                    <li key={s.from + s.title} className="relative pl-7">
                      {i < all.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%+4px)] w-px bg-brand-ink/50" aria-hidden />}
                      <span className={cx("absolute left-0 top-1 grid h-[15px] w-[15px] place-items-center rounded-full border-2",
                        i === 0 ? "border-brand-ink" : "border-line-strong")} aria-hidden>
                        {i === 0 && <span className="h-1.5 w-1.5 rounded-full bg-brand-ink" />}
                      </span>
                      <p className={cx("text-[15px]", i === 0 ? "font-semibold text-brand-ink" : "text-ink")}>{s.title}</p>
                      <p className="text-[13px] text-muted">
                        {formatDate(s.from)} – {s.to ? formatDate(s.to) : "Present"} ({tenure(s.from, s.to ? new Date(`${s.to}T00:00:00`) : new Date())})
                      </p>
                      {s.pay && <p className="text-[13px] text-muted">{formatMoney(s.pay.amount, s.pay.currency)} {formatFrequency(s.pay.frequency)}</p>}
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Reporting structure" icon={faSitemap}>
                <Fact icon={faUser} label="Reports to">
                  {p.manager ? <Link href={`/employees/${p.manager.id}`} className="hover:underline">{p.manager.fullName}</Link> : "No one"}
                </Fact>
                <Fact icon={faUsers} label="Direct reports">
                  {p.directReports.length
                    ? <Link href={`/employees/${p.id}`} className="font-medium text-brand-ink hover:underline">{p.directReports.length} {p.directReports.length === 1 ? "employee" : "employees"}</Link>
                    : "None"}
                </Fact>
                <Link href={`/employees?view=chart&focus=${p.id}`} className="flex items-center gap-2 text-sm font-medium text-brand-ink hover:underline">
                  <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs" /> View in org chart
                </Link>
              </Section>
            </div>
            <footer className="rounded-b-2xl border-t border-line bg-surface px-4 py-3">
              <Link href={`/employees/${p.id}`} className="flex items-center justify-center gap-2 rounded-full border border-line-strong py-2 text-sm font-medium text-ink hover:bg-subtle">
                Open full profile
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
