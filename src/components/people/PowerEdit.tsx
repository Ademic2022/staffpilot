"use client";

import { faArrowRight, faCircleCheck, faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useClient, useMutation, useQuery } from "urql";

import { Photo } from "@/components/home/Widgets";
import { Button, ButtonLink, ErrorNote, Field, Input, Loading, Notice, PageHeader, SearchInput, Select, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { PowerEditPeopleQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

import { PRESET_VIEWS, toEmployeeFilter, type PeopleFilter, type Showing } from "./shared";

const PeopleDocument = graphql(`
  query PowerEditPeople($filter: EmployeeFilter, $first: Int, $after: String) {
    employees(filter: $filter, first: $first, after: $after, sort: "name") {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        id employeeNumber firstName middleName lastName preferredName fullName photoUrl status employmentType
        workEmail personalEmail phone workPhone workPhoneExt dateOfBirth gender maritalStatus
        jobTitle { id name } department { id name } location { id name } legalEntity { id name } grade { id name } manager { id fullName }
        personal { nationality linkedinUrl homePhone addressLine1 addressLine2 city state postalCode country }
        customValues { field { key } value }
      }
    }
  }
`);

const LookupsDocument = graphql(`
  query PowerEditLookups {
    departments { id name isActive }
    locations { id name isActive }
    legalEntities { id name isActive }
    jobTitles { id name isActive }
    grades { id name isActive }
    customFields { key name fieldType choices }
    orgChart { id fullName }
  }
`);

const ApplyDocument = graphql(`
  mutation PowerEdit($input: PowerEditInput!) {
    powerEdit(input: $input) { employeeId fullName ok errors { field message } }
  }
`);

type Person = PowerEditPeopleQuery["employees"]["nodes"][number];
type Lookups = NonNullable<ReturnType<typeof useLookups>>;
type Option = { value: string; label: string };
type FieldDef = {
  key: string; label: string; group: "Personal" | "Contact" | "Job" | "Custom fields";
  kind: "text" | "date" | "select"; options?: (l: Lookups) => Option[]; get: (p: Person) => string; job?: boolean;
};

const named = (rows: { id: string; name: string; isActive?: boolean }[]) =>
  rows.filter((r) => r.isActive !== false).map((r) => ({ value: r.id, label: r.name })).sort((a, b) => a.label.localeCompare(b.label));
const text = (key: string, label: string, group: FieldDef["group"], get: (p: Person) => string): FieldDef => ({ key, label, group, kind: "text", get });

const FIELDS: FieldDef[] = [
  text("first_name", "First name", "Personal", (p) => p.firstName),
  text("middle_name", "Middle name", "Personal", (p) => p.middleName),
  text("last_name", "Last name", "Personal", (p) => p.lastName),
  text("preferred_name", "Preferred name", "Personal", (p) => p.preferredName),
  { key: "date_of_birth", label: "Date of birth", group: "Personal", kind: "date", get: (p) => p.dateOfBirth ?? "" },
  { key: "gender", label: "Gender", group: "Personal", kind: "select", get: (p) => p.gender ?? "",
    options: () => [["FEMALE", "Female"], ["MALE", "Male"], ["NON_BINARY", "Non-binary"], ["OTHER", "Other"], ["UNDISCLOSED", "Prefer not to say"]].map(([value, label]) => ({ value, label })) },
  { key: "marital_status", label: "Marital status", group: "Personal", kind: "select", get: (p) => p.maritalStatus ?? "",
    options: () => [["SINGLE", "Single"], ["MARRIED", "Married"], ["DIVORCED", "Divorced"], ["WIDOWED", "Widowed"], ["UNDISCLOSED", "Prefer not to say"]].map(([value, label]) => ({ value, label })) },
  text("nationality", "Nationality", "Personal", (p) => p.personal?.nationality ?? ""),
  text("work_email", "Work email", "Contact", (p) => p.workEmail),
  text("personal_email", "Personal email", "Contact", (p) => p.personalEmail),
  text("work_phone", "Work phone", "Contact", (p) => p.workPhone),
  text("work_phone_ext", "Work phone ext.", "Contact", (p) => p.workPhoneExt),
  text("phone", "Mobile phone", "Contact", (p) => p.phone),
  text("home_phone", "Home phone", "Contact", (p) => p.personal?.homePhone ?? ""),
  text("linkedin_url", "LinkedIn", "Contact", (p) => p.personal?.linkedinUrl ?? ""),
  text("address_line1", "Address line 1", "Contact", (p) => p.personal?.addressLine1 ?? ""),
  text("address_line2", "Address line 2", "Contact", (p) => p.personal?.addressLine2 ?? ""),
  text("city", "City", "Contact", (p) => p.personal?.city ?? ""),
  text("state", "State", "Contact", (p) => p.personal?.state ?? ""),
  text("postal_code", "Postal code", "Contact", (p) => p.personal?.postalCode ?? ""),
  text("country", "Country", "Contact", (p) => p.personal?.country ?? ""),
  { key: "job_title", label: "Job title", group: "Job", kind: "select", job: true, get: (p) => p.jobTitle?.id ?? "", options: (l) => named(l.jobTitles) },
  { key: "department", label: "Department", group: "Job", kind: "select", job: true, get: (p) => p.department?.id ?? "", options: (l) => named(l.departments) },
  { key: "location", label: "Location", group: "Job", kind: "select", job: true, get: (p) => p.location?.id ?? "", options: (l) => named(l.locations) },
  { key: "legal_entity", label: "Legal entity", group: "Job", kind: "select", job: true, get: (p) => p.legalEntity.id, options: (l) => named(l.legalEntities) },
  { key: "grade", label: "Grade", group: "Job", kind: "select", job: true, get: (p) => p.grade?.id ?? "", options: (l) => named(l.grades) },
  { key: "manager", label: "Reports to", group: "Job", kind: "select", job: true, get: (p) => p.manager?.id ?? "",
    options: (l) => l.orgChart.map((e) => ({ value: e.id, label: e.fullName })).sort((a, b) => a.label.localeCompare(b.label)) },
  { key: "employment_type", label: "Employment type", group: "Job", kind: "select", job: true, get: (p) => p.employmentType,
    options: () => [["FULL_TIME", "Full-time"], ["PART_TIME", "Part-time"], ["CONTRACT", "Contract"], ["INTERN", "Intern"]].map(([value, label]) => ({ value, label })) },
];
const REQUIRED = new Set(["first_name", "last_name", "legal_entity", "employment_type"]);

function customFieldDefs(l: Lookups): FieldDef[] {
  return l.customFields.map((f) => ({
    key: `custom:${f.key}`, label: f.name, group: "Custom fields",
    kind: f.fieldType === "DATE" ? "date" : f.fieldType === "CHOICE" || f.fieldType === "YES_NO" ? "select" : "text",
    options: f.fieldType === "YES_NO" ? () => [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]
      : f.fieldType === "CHOICE" ? () => f.choices.map((c) => ({ value: c, label: c })) : undefined,
    get: (p) => {
      const v = p.customValues.find((c) => c.field.key === f.key)?.value;
      return v === true ? "yes" : v === false ? "no" : v == null ? "" : String(v);
    },
  }));
}

function useLookups() {
  const [{ data }] = useQuery({ query: LookupsDocument });
  return data;
}

/** Everyone in a view, page by page (the API serves at most 100 at a time). */
function usePeople(filter: PeopleFilter, showing: Showing) {
  const client = useClient();
  const key = JSON.stringify([filter, showing]);
  const [state, setState] = useState<{ key: string; people: Person[]; error?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const people: Person[] = [];
      let after = null as string | null;
      for (let page = 0; page < 10; page++) {
        const result = await client.query(PeopleDocument, { filter: toEmployeeFilter(filter, showing), first: 100, after }, { requestPolicy: "network-only" }).toPromise();
        if (cancelled) return;
        if (result.error || !result.data) return setState({ key, people, error: errorMessage(result.error) ?? "Could not load people." });
        people.push(...result.data.employees.nodes);
        if (!result.data.employees.pageInfo.hasNextPage) break;
        after = result.data.employees.pageInfo.endCursor ?? null;
      }
      setState({ key, people });
    })();
    return () => { cancelled = true; };
  }, [client, key]); // eslint-disable-line react-hooks/exhaustive-deps -- key stands for filter and showing
  return state?.key === key ? state : null;
}

function Steps({ step }: { step: number }) {
  const names = ["Select employees and fields", "Make changes", "Preview and apply"];
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-2">
          <span className={cx("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
            i + 1 === step ? "bg-brand text-white" : i + 1 < step ? "bg-brand/15 text-brand-ink" : "bg-subtle text-muted")}>{i + 1}</span>
          <span className={i + 1 === step ? "font-medium text-ink" : "text-muted"}>{n}</span>
          {i < names.length - 1 && <FontAwesomeIcon icon={faArrowRight} className="mx-1 text-[11px] text-muted" />}
        </li>
      ))}
    </ol>
  );
}

function PersonLine({ p, action }: { p: Person; action: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Photo name={p.fullName} src={p.photoUrl} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{p.lastName}, {p.preferredName || p.firstName}</span>
        <span className="block truncate text-xs text-muted">{p.employeeNumber}</span>
      </span>
      {action}
    </li>
  );
}

function ValueInput({ def, value, lookups, onChange, label }: { def: FieldDef; value: string; lookups: Lookups; onChange: (v: string) => void; label: string }) {
  if (def.kind === "select") {
    return (
      <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {!REQUIRED.has(def.key) && <option value="">—</option>}
        {def.options!(lookups).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    );
  }
  return <Input aria-label={label} type={def.kind === "date" ? "date" : "text"} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function PowerEdit() {
  const lookups = useLookups();
  const [step, setStep] = useState(1);
  const [viewKey, setViewKey] = useState("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Map<string, Person>>(new Map());
  const [fieldKeys, setFieldKeys] = useState<string[]>([]);
  const [mode, setMode] = useState<"individual" | "group">("individual");
  // Values typed in step 2: per person ("<id>" → field → value) or, as a group, under "*".
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [results, setResults] = useState<{ employeeId: string; fullName: string; ok: boolean; errors: { field?: string | null; message: string }[] }[] | null>(null);
  const [applyState, apply] = useMutation(ApplyDocument);

  const preset = PRESET_VIEWS.find((v) => v.key === viewKey) ?? PRESET_VIEWS[0];
  const filter = useMemo(() => preset.filter(), [preset]);
  const loaded = usePeople(filter, preset.showing ?? "active");
  const defs = useMemo(() => (lookups ? [...FIELDS, ...customFieldDefs(lookups)] : FIELDS), [lookups]);
  const chosen = fieldKeys.map((k) => defs.find((d) => d.key === k)!).filter(Boolean);
  const people = [...picked.values()].sort((a, b) => a.lastName.localeCompare(b.lastName));
  const q = search.trim().toLowerCase();
  const available = (loaded?.people ?? []).filter((p) => !picked.has(p.id)
    && (!q || [p.fullName, p.employeeNumber, p.workEmail].some((v) => v.toLowerCase().includes(q))));

  const valueOf = (p: Person, def: FieldDef) => (mode === "group" ? values["*"]?.[def.key] : values[p.id]?.[def.key]) ?? def.get(p);
  const setValue = (who: string, key: string, v: string) => setValues((all) => ({ ...all, [who]: { ...all[who], [key]: v } }));
  const changes = people.map((p) => ({
    p, diff: chosen.filter((d) => valueOf(p, d) !== d.get(p)).map((d) => ({ def: d, from: d.get(p), to: valueOf(p, d) })),
  })).filter((c) => c.diff.length);
  const display = (def: FieldDef, v: string) => {
    if (!v) return <span className="text-muted">Empty</span>;
    if (def.kind === "date") return formatDate(v);
    return def.options && lookups ? def.options(lookups).find((o) => o.value === v)?.label ?? v : v;
  };
  const touchesJob = changes.some((c) => c.diff.some((d) => d.def.job));

  const run = async () => {
    const rows = changes.map(({ p, diff }) => ({
      employeeId: p.id,
      values: Object.fromEntries(diff.map((d) => [d.def.key, d.to === "" && (d.def.kind === "date" || d.def.kind === "select") ? null : d.to])),
    }));
    const result = await apply({ input: { rows, effectiveDate: touchesJob ? effectiveDate : null, reason: reason.trim() || null } });
    if (result.data) setResults(result.data.powerEdit);
  };

  if (!lookups) return <Loading shape="table" />;
  const groups = [...new Set(defs.map((d) => d.group))];

  return (
    <>
      <PageHeader title="Power edit employees" back={{ href: "/employees?view=list", label: "People" }}
        subtitle="Change the same fields for many people in one go." />
      <Steps step={step} />

      {step === 1 && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Employees</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex min-w-0 flex-col rounded-xl border border-line">
                <div className="flex flex-wrap gap-2 border-b border-line p-3">
                  <Select aria-label="View" value={viewKey} onChange={(e) => setViewKey(e.target.value)} className="w-48">
                    {PRESET_VIEWS.map((v) => <option key={v.key} value={v.key}>{v.name}</option>)}
                  </Select>
                  <div className="min-w-40 flex-1"><SearchInput aria-label="Search employees" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-muted">
                  <span>{loaded ? `${available.length} available` : "Loading…"}</span>
                  <button type="button" disabled={!available.length} className="font-medium text-brand-ink hover:underline disabled:opacity-40"
                    onClick={() => setPicked(new Map([...picked, ...available.map((p) => [p.id, p] as const)]))}>Add all</button>
                </div>
                {loaded?.error && <div className="px-3"><ErrorNote error={loaded.error} /></div>}
                <ul className="h-80 divide-y divide-line overflow-y-auto">
                  {available.map((p) => (
                    <PersonLine key={p.id} p={p} action={<Button size="sm" variant="ghost" onClick={() => setPicked(new Map(picked).set(p.id, p))}>Add</Button>} />
                  ))}
                </ul>
              </div>
              <div className="flex min-w-0 flex-col rounded-xl border border-line">
                <div className="flex items-center justify-between border-b border-line p-3 text-sm">
                  <span className="font-medium text-ink">{people.length} selected</span>
                  {people.length > 0 && <button type="button" className="text-xs font-medium text-brand-ink hover:underline" onClick={() => setPicked(new Map())}>Remove all</button>}
                </div>
                <ul className="h-[23.5rem] divide-y divide-line overflow-y-auto">
                  {people.length ? people.map((p) => (
                    <PersonLine key={p.id} p={p} action={
                      <button type="button" aria-label={`Remove ${p.fullName}`} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink"
                        onClick={() => { const next = new Map(picked); next.delete(p.id); setPicked(next); }}><FontAwesomeIcon icon={faXmark} className="text-xs" /></button>
                    } />
                  )) : <li className="p-4 text-sm text-muted">Add people from the list on the left.</li>}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Fields to edit</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {groups.map((g) => (
                <fieldset key={g}>
                  <legend className="mb-2 text-sm font-semibold text-brand-ink">{g}</legend>
                  <ul className="space-y-0.5">
                    {defs.filter((d) => d.group === g).map((d) => (
                      <li key={d.key}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm text-ink hover:bg-subtle">
                          <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={fieldKeys.includes(d.key)}
                            onChange={() => setFieldKeys(fieldKeys.includes(d.key) ? fieldKeys.filter((k) => k !== d.key) : [...fieldKeys, d.key])} />
                          {d.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}
            </div>
            {defs.some((d) => d.job && fieldKeys.includes(d.key)) && (
              <p className="mt-4 text-sm text-muted">Job fields are saved as a job change in each person’s history, from the date you choose next.</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Editing options</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {([["individual", "Individually", "A row per person, so each can get a different value."], ["group", "As a group", "One value for each field, given to everyone selected."]] as const).map(([key, label, hint]) => (
                <label key={key} className={cx("flex cursor-pointer gap-3 rounded-xl border p-4", mode === key ? "border-brand-ink ring-2 ring-brand/20" : "border-line hover:border-line-strong")}>
                  <input type="radio" name="mode" className="mt-1 accent-[var(--brand)]" checked={mode === key} onChange={() => setMode(key)} />
                  <span><span className="block font-medium text-ink">{label}</span><span className="block text-sm text-muted">{hint}</span></span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <ButtonLink href="/employees?view=list" variant="secondary">Cancel</ButtonLink>
            <Button disabled={!people.length || !chosen.length} onClick={() => { setValues({}); setStep(2); }}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {chosen.some((d) => d.job) && (
            <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:grid-cols-[200px_1fr]">
              <Field label="Effective date" hint="Job changes take effect on this date."><Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></Field>
              <Field label="Reason" optional><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Power edit" /></Field>
            </section>
          )}
          {mode === "group" ? (
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <p className="mb-4 text-sm text-muted">These values go to all {people.length} selected people. Leave a field as it is to keep each person’s own value.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chosen.map((d) => {
                  const shared = new Set(people.map((p) => d.get(p))).size === 1 ? d.get(people[0]) : "";
                  const value = values["*"]?.[d.key];
                  return (
                    <Field key={d.key} label={d.label} hint={value === undefined && new Set(people.map((p) => d.get(p))).size > 1 ? "Values differ: unchanged unless you pick one." : undefined}>
                      <ValueInput def={d} label={d.label} lookups={lookups} value={value ?? shared} onChange={(v) => setValue("*", d.key, v)} />
                    </Field>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="max-h-[calc(100vh-320px)] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-subtle">
                    <tr>
                      <th className="sticky left-0 z-10 bg-subtle px-4 py-3 font-semibold text-ink">Employee</th>
                      {chosen.map((d) => <th key={d.key} className="min-w-48 px-3 py-3 font-semibold text-ink">{d.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {people.map((p) => (
                      <tr key={p.id}>
                        <td className="sticky left-0 bg-surface px-4 py-2 whitespace-nowrap text-ink">{p.lastName}, {p.preferredName || p.firstName}</td>
                        {chosen.map((d) => {
                          const v = valueOf(p, d);
                          return (
                            <td key={d.key} className={cx("px-3 py-2", v !== d.get(p) && "bg-brand/5")}>
                              <ValueInput def={d} label={`${d.label} for ${p.fullName}`} lookups={lookups} value={v} onChange={(next) => setValue(p.id, d.key, next)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!changes.length} onClick={() => { setResults(null); setStep(3); }}>
              Preview {changes.length ? `${changes.length} ${changes.length === 1 ? "person" : "people"}` : "changes"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          {results ? (
            <Notice tone={results.every((r) => r.ok) ? "success" : "warning"} title={`${results.filter((r) => r.ok).length} of ${results.length} people updated`}>
              {results.some((r) => !r.ok) ? "The people below were left as they were. Fix the values and try them again." : "Every change was saved."}
            </Notice>
          ) : (
            <Notice title={`Review ${changes.length} ${changes.length === 1 ? "person" : "people"}`}>
              {touchesJob ? `Job changes take effect on ${formatDate(effectiveDate)}. ` : ""}Nothing is saved until you apply.
            </Notice>
          )}
          {applyState.error && <ErrorNote error={errorMessage(applyState.error)} />}
          <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <ul className="divide-y divide-line">
              {changes.map(({ p, diff }) => {
                const outcome = results?.find((r) => r.employeeId === p.id);
                return (
                  <li key={p.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[240px_1fr]">
                    <div className="flex items-center gap-3">
                      <Photo name={p.fullName} src={p.photoUrl} size={40} />
                      <div className="min-w-0">
                        <Link href={`/employees/${p.id}`} className="block truncate font-medium text-ink hover:underline">{p.fullName}</Link>
                        {outcome && (
                          <span className={cx("flex items-center gap-1.5 text-xs font-medium", outcome.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                            <FontAwesomeIcon icon={outcome.ok ? faCircleCheck : faCircleExclamation} />{outcome.ok ? "Updated" : "Not changed"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {diff.map((d) => (
                        <p key={d.def.key} className="flex flex-wrap items-center gap-2">
                          <span className="w-36 text-muted">{d.def.label}</span>
                          <span className="text-muted line-through decoration-muted/60">{display(d.def, d.from)}</span>
                          <FontAwesomeIcon icon={faArrowRight} className="text-[11px] text-muted" />
                          <span className="font-medium text-ink">{display(d.def, d.to)}</span>
                        </p>
                      ))}
                      {outcome?.errors.map((e, i) => <p key={i} className="text-sm text-red-700 dark:text-red-300">{e.message}</p>)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="flex justify-between gap-2">
            {results ? (
              <>
                {results.some((r) => !r.ok) ? (
                <Button variant="secondary" onClick={() => {
                  // Saved people are done; keep only the ones that still need fixing.
                  const next = new Map(picked);
                  results.filter((r) => r.ok).forEach((r) => next.delete(r.employeeId));
                  setPicked(next); setStep(next.size ? 2 : 1); setResults(null);
                }}>Fix the rest</Button>
                ) : <span />}
                <ButtonLink href="/employees?view=list">Done</ButtonLink>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setStep(2)} disabled={applyState.fetching}>Back</Button>
                <Button busy={applyState.fetching} onClick={run}>Apply changes</Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
