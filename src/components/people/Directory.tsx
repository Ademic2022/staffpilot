"use client";

import { faBuilding, faEnvelope, faLocationDot, faMobileScreen, faSitemap, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { TenureFrame, TenureLabel } from "@/components/TenureMark";
import { Photo } from "@/components/home/Widgets";
import { useSnapshot } from "@/components/snapshot/Snapshot";
import { Badge, ErrorNote, Loading, SearchInput, Select, cx } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

import { localTime, outLabel, useOrgPeople, type OrgPerson } from "./org";

type GroupBy = "name" | "department" | "location" | "legalEntity";

const GROUPS: { key: GroupBy; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "legalEntity", label: "Legal entity" },
];

function groupOf(p: OrgPerson, by: GroupBy) {
  if (by === "department") return p.department ?? "No department";
  if (by === "location") return p.location ?? "No location";
  if (by === "legalEntity") return p.legalEntity ?? "No legal entity";
  const letter = p.fullName.trim()[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(letter) ? letter : "#";
}

function Entry({ p, byId, onChart }: { p: OrgPerson; byId: Map<string, OrgPerson>; onChart: (id: string) => void }) {
  const { can } = useSession();
  const snapshot = useSnapshot();
  const full = can(PERMS.employeesView);
  const time = localTime(p.timezone);
  const role = [p.jobTitle, p.department].filter(Boolean).join(" in ");
  return (
    <li className="grid gap-4 border-b border-line px-5 py-5 last:border-b-0 sm:grid-cols-[96px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
      {full ? (
        <button type="button" onClick={() => snapshot.open(p.id)} aria-label={`Snapshot of ${p.fullName}`} className="self-start">
          <TenureFrame hireDate={p.hireDate} founding={p.foundingMember} radius="rounded-2xl"><Photo name={p.fullName} src={p.photoUrl} size={96} /></TenureFrame>
        </button>
      ) : <span className="self-start"><TenureFrame hireDate={p.hireDate} founding={p.foundingMember} radius="rounded-2xl"><Photo name={p.fullName} src={p.photoUrl} size={96} /></TenureFrame></span>}
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2">
          {full
            ? <Link href={`/employees/${p.id}`} className="font-display text-xl leading-tight text-brand-ink hover:underline">{p.fullName}</Link>
            : <span className="font-display text-xl leading-tight text-brand-ink">{p.fullName}</span>}
          <TenureLabel hireDate={p.hireDate} founding={p.foundingMember} />
          {p.outUntil && <Badge tone="warn" dot>{outLabel(p.outUntil)}</Badge>}
        </p>
        {role && <p className="text-sm text-ink">{role}</p>}
        {(p.place || time) && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <FontAwesomeIcon icon={faLocationDot} fixedWidth className="text-xs" />
            {[p.place, time && `${time} local time`].filter(Boolean).join(" | ")}
          </p>
        )}
        {p.legalEntity && <p className="flex items-center gap-2 text-sm text-muted"><FontAwesomeIcon icon={faBuilding} fixedWidth className="text-xs" />{p.legalEntity}</p>}
      </div>
      <ul className="min-w-0 space-y-1.5 text-sm">
        {p.workEmail && (
          <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faEnvelope} fixedWidth className="text-xs text-muted" />
            <a href={`mailto:${p.workEmail}`} className="truncate text-brand-ink hover:underline">{p.workEmail}</a></li>
        )}
        {p.mobile && (
          <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faMobileScreen} fixedWidth className="text-xs text-muted" />
            <a href={`tel:${p.mobile}`} className="hover:underline">{p.mobile}</a><span className="text-muted">mobile</span></li>
        )}
        {(p.linkedinUrl || p.twitter || p.facebook) && (
          <li className="flex flex-wrap items-center gap-x-3 text-muted">
            {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">LinkedIn</a>}
            {p.twitter && <span>X: {p.twitter}</span>}
            {p.facebook && <span>Facebook</span>}
          </li>
        )}
        {p.workPhone && (
          <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faMobileScreen} fixedWidth className="text-xs text-muted" />
            <a href={`tel:${p.workPhone}`} className="hover:underline">{p.workPhone}</a>{p.workPhoneExt && <span className="text-muted">ext. {p.workPhoneExt}</span>}</li>
        )}
      </ul>
      <ul className="min-w-0 space-y-1.5 text-sm">
        {p.managerId && byId.has(p.managerId) && (
          <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faUser} fixedWidth className="text-xs text-muted" />
            <span className="text-muted">Reports to</span>
            {full ? <Link href={`/employees/${p.managerId}`} className="truncate hover:underline">{p.managerName}</Link> : <span className="truncate">{p.managerName}</span>}</li>
        )}
        {p.directReportCount > 0 && (
          <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faUsers} fixedWidth className="text-xs text-muted" />
            {p.directReportCount} direct {p.directReportCount === 1 ? "report" : "reports"}</li>
        )}
        <li>
          <button type="button" onClick={() => onChart(p.id)} className="flex items-center gap-2.5 font-medium text-brand-ink hover:underline">
            <FontAwesomeIcon icon={faSitemap} fixedWidth className="text-xs" />View in org chart
          </button>
        </li>
      </ul>
    </li>
  );
}

export function Directory({ onChart }: { onChart: (id: string) => void }) {
  const { people, byId, loaded, error } = useOrgPeople();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("name");
  // "department:<id>", "location:<id>" or "" for everyone.
  const [only, setOnly] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());

  const choices = useMemo(() => {
    const unique = (pairs: [string | null | undefined, string | null | undefined][]) =>
      [...new Map(pairs.filter((x): x is [string, string] => Boolean(x[0] && x[1]))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
    return {
      departments: unique(people.map((p) => [p.departmentId, p.department])),
      locations: unique(people.map((p) => [p.locationId, p.location])),
    };
  }, [people]);

  const groups = useMemo(() => {
    const [kind, id] = only.split(":");
    const shown = people.filter((p) =>
      (!only || (kind === "department" ? p.departmentId === id : p.locationId === id))
      && (!query || [p.fullName, p.jobTitle, p.department, p.location, p.workEmail].some((v) => v?.toLowerCase().includes(query))));
    const out = new Map<string, OrgPerson[]>();
    for (const p of [...shown].sort((a, b) => a.fullName.localeCompare(b.fullName))) {
      const g = groupOf(p, groupBy);
      out.set(g, [...(out.get(g) ?? []), p]);
    }
    return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [people, only, query, groupBy]);
  const count = groups.reduce((n, [, rows]) => n + rows.length, 0);

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!loaded) return <Loading />;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl text-ink">Directory <span className="text-muted">({count})</span></h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="w-64"><SearchInput placeholder="Search the directory" aria-label="Search the directory" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm text-muted">Group by
            <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="h-11 w-40 rounded-full">
              {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">Filter by
            <Select value={only} onChange={(e) => setOnly(e.target.value)} className="h-11 w-48 rounded-full">
              <option value="">Everyone</option>
              <optgroup label="Departments">{choices.departments.map(([id, name]) => <option key={id} value={`department:${id}`}>{name}</option>)}</optgroup>
              <optgroup label="Locations">{choices.locations.map(([id, name]) => <option key={id} value={`location:${id}`}>{name}</option>)}</optgroup>
            </Select>
          </label>
        </div>
      </div>
      {groups.length ? (
        <div className="space-y-5">
          {groups.map(([name, rows]) => (
            <section key={name} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <h3 className={cx("border-b border-line bg-subtle/70 px-5 py-2.5 font-semibold text-brand-ink", groupBy === "name" ? "text-lg" : "text-[15px]")}>
                {name}{groupBy !== "name" && <span className="ml-2 font-normal text-muted">({rows.length})</span>}
              </h3>
              <ul>{rows.map((p) => <Entry key={p.id} p={p} byId={byId} onChart={onChart} />)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-sm">
          <p className="font-display text-xl text-ink">No one matches</p>
          <p className="mt-1 text-sm text-muted">Try a different name or clear the filter.</p>
        </div>
      )}
    </>
  );
}
