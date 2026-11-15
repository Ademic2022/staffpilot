"use client";

import { faArrowDown, faArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";

import { FilterPanel } from "@/components/people/PeopleList";
import type { PeopleFilter, Showing } from "@/components/people/shared";
import { ResultView } from "@/components/reports/ResultView";
import { Button, ButtonLink, Checkbox, ErrorNote, Field, IconButton, Input, Loading, PageHeader, SearchInput, Select, cx } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const BuilderOptionsDocument = graphql(`
  query CustomReportOptions {
    customReportFields { key label category }
    departments { id name isActive }
    locations { id name isActive }
    legalEntities { id name isActive }
    jobTitles { id name isActive }
    grades { id name isActive }
  }
`);

const PreviewDocument = graphql(`
  query CustomReportPreview($fields: [String!], $filter: JSON, $showing: String!) {
    runCustomReport(fields: $fields, filter: $filter, showing: $showing) { chart note rows columns { key label kind } summary { label value } }
  }
`);

const SaveDocument = graphql(`
  mutation SaveCustomReport($input: CustomReportInput!) {
    saveCustomReport(input: $input) { report { id } errors { field message } }
  }
`);

export type Draft = { id?: string; name: string; description: string; fields: string[]; filter: PeopleFilter; showing: Showing; shared: boolean };

const STARTER: Draft = { name: "", description: "", fields: ["employee_number", "last_first", "job_title", "department"], filter: {}, showing: "active", shared: false };

/** Build or change a custom report: pick fields, filter people as the People list does, preview, save. */
export function CustomBuilder({ initial }: { initial?: Draft }) {
  const { can } = useSession();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial ?? STARTER);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ data: options, error }] = useQuery({ query: BuilderOptionsDocument });
  const [saving, save] = useMutation(SaveDocument);
  // The preview follows the choices a moment behind, so typing and ticking stay quick.
  const previewVars = useDeferredValue({ fields: draft.fields, filter: draft.filter, showing: draft.showing });
  const [{ data: preview, fetching }] = useQuery({ query: PreviewDocument, variables: previewVars, pause: !draft.fields.length });
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const fields = useMemo(() => options?.customReportFields ?? [], [options]);
  const categories = [...new Set(fields.map((f) => f.category))];
  const label = (key: string) => fields.find((f) => f.key === key)?.label ?? key;
  const q = search.trim().toLowerCase();
  const move = (key: string, by: number) => {
    const i = draft.fields.indexOf(key);
    const next = [...draft.fields];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    set({ fields: next });
  };

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!options) return <Loading shape="form" />;

  const submit = async () => {
    const result = await save({ input: { id: draft.id ?? null, name: draft.name, description: draft.description, fields: draft.fields,
      filter: draft.filter, showing: draft.showing, shared: draft.shared } });
    const problems = result.data?.saveCustomReport.errors ?? [];
    if (problems.length) return setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
    const id = result.data?.saveCustomReport.report?.id;
    if (id) router.push(`/reports/custom/${id}`);
  };

  return (
    <>
      <PageHeader back={{ href: draft.id ? `/reports/custom/${draft.id}` : "/reports?tab=custom", label: draft.id ? draft.name || "Report" : "Custom reports" }}
        title={draft.id ? "Edit report" : "New report"}
        actions={<>
          <ButtonLink href={draft.id ? `/reports/custom/${draft.id}` : "/reports?tab=custom"} variant="secondary">Cancel</ButtonLink>
          <Button busy={saving.fetching} onClick={submit}>Save report</Button>
        </>} />
      {saving.error && <ErrorNote error={errorMessage(saving.error)} />}

      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:grid-cols-2">
        <Field label="Report name" error={errors.name}><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Emergency contacts by department" /></Field>
        <Field label="Description" optional><Input value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        {can(PERMS.employeesManage) && (
          <div className="sm:col-span-2">
            <Checkbox label="Share with the company" description="Everyone who can see employee records can run it. Only you can change it."
              checked={draft.shared} onChange={(c) => set({ shared: c })} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Fields</h2>
          <div className="w-64"><SearchInput aria-label="Search fields" placeholder="Search fields" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        {errors.fields && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{errors.fields}</p>}
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => {
              const inCategory = fields.filter((f) => f.category === c && (!q || f.label.toLowerCase().includes(q)));
              return inCategory.length ? (
                <fieldset key={c}>
                  <legend className="mb-2 text-sm font-semibold text-brand-ink">{c}</legend>
                  <ul className="space-y-0.5">
                    {inCategory.map((f) => (
                      <li key={f.key}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm text-ink hover:bg-subtle">
                          <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={draft.fields.includes(f.key)}
                            onChange={() => set({ fields: draft.fields.includes(f.key) ? draft.fields.filter((k) => k !== f.key) : [...draft.fields, f.key] })} />
                          {f.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ) : null;
            })}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Columns, in order ({draft.fields.length})</p>
            <ul className="max-h-96 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {draft.fields.length ? draft.fields.map((key, i) => (
                <li key={key} className="flex items-center gap-1 rounded-md bg-subtle px-2.5 py-1 text-sm text-ink">
                  <span className="min-w-0 flex-1 truncate">{label(key)}</span>
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(key, -1)}><FontAwesomeIcon icon={faArrowUp} className="text-[11px]" /></IconButton>
                  <IconButton label="Move down" disabled={i === draft.fields.length - 1} onClick={() => move(key, 1)}><FontAwesomeIcon icon={faArrowDown} className="text-[11px]" /></IconButton>
                  <IconButton label={`Remove ${label(key)}`} onClick={() => set({ fields: draft.fields.filter((k) => k !== key) })}><FontAwesomeIcon icon={faXmark} className="text-[11px]" /></IconButton>
                </li>
              )) : <li className="p-2 text-sm text-muted">Tick fields on the left.</li>}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="space-y-3 lg:w-64 lg:flex-none">
          <label className="flex items-center justify-between gap-2 text-sm text-muted">Showing
            <Select value={draft.showing} onChange={(e) => set({ showing: e.target.value as Showing })} className={cx("h-10 w-36 rounded-full")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </Select>
          </label>
          <FilterPanel filter={draft.filter} onChange={(filter) => set({ filter })} total={preview?.runCustomReport.rows ? (preview.runCustomReport.rows as unknown[]).length : undefined}
            options={{ departments: options.departments, locations: options.locations, legalEntities: options.legalEntities, jobTitles: options.jobTitles, grades: options.grades }} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-3 text-lg font-semibold text-ink">Preview</h2>
          {!draft.fields.length ? <p className="text-sm text-muted">Choose at least one field.</p>
            : preview ? <ResultView result={preview.runCustomReport} fetching={fetching} empty="No one matches these filters." /> : <Loading shape="table" />}
        </div>
      </div>
    </>
  );
}
