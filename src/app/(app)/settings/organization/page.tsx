"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { useClient, useQuery } from "urql";

import { IconPlus, IconSitemap, IconSparkle } from "@/components/icons";
import {
  Badge, Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, Input, Loading, Notice, Select, Spinner, Table, TD, TH, Textarea, cx,
} from "@/components/ui";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { TeamsAdmin } from "@/components/settings/TeamsAdmin";
import { graphql } from "@/gql";
import type { OrganizationQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession, type Tenant } from "@/lib/session";

const OrganizationDocument = graphql(`
  query Organization {
    legalEntities { id name registrationNumber country currency isActive }
    locations { id name address city country timezone latitude longitude radiusM isActive legalEntity { id name } }
    departments { id name code isActive legalEntity { id name } parent { id name } head { id fullName } }
    jobTitles { id name description isActive }
    grades { id name rank isActive payMin payMid payMax }
    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }
    aiWriting
  }
`);

const DraftJobDescriptionDocument = graphql(`
  mutation DraftJobDescription($title: String!, $notes: String!) { draftJobDescription(title: $title, notes: $notes) }
`);

const SaveLegalEntityDocument = graphql(`
  mutation SaveLegalEntity($input: SaveLegalEntityInput!) {
    saveLegalEntity(input: $input) { legalEntity { id } errors { field message } }
  }
`);
const SaveLocationDocument = graphql(`
  mutation SaveLocation($input: SaveLocationInput!) {
    saveLocation(input: $input) { location { id } errors { field message } }
  }
`);
const SaveDepartmentDocument = graphql(`
  mutation SaveDepartment($input: SaveDepartmentInput!) {
    saveDepartment(input: $input) { department { id } errors { field message } }
  }
`);
const SaveJobTitleDocument = graphql(`
  mutation SaveJobTitle($input: SaveJobTitleInput!) {
    saveJobTitle(input: $input) { jobTitle { id } errors { field message } }
  }
`);
const SaveGradeDocument = graphql(`
  mutation SaveGrade($input: SaveGradeInput!) {
    saveGrade(input: $input) { grade { id } errors { field message } }
  }
`);

type Kind = "legalEntities" | "departments" | "locations" | "jobTitles" | "grades";
type Values = Record<string, string | boolean>;
type Option = { id: string; name: string };

interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "money";
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Country and currency codes are stored upper-case. */
  upper?: boolean;
  maxLength?: number;
  options?: (data: OrganizationQuery, values: Values, editingId?: string) => Option[];
  empty?: string;
  wide?: boolean;
}

const entityOptions = (d: OrganizationQuery) => d.legalEntities.filter((e) => e.isActive);

const KINDS: Record<Kind, { label: string; singular: string; intro: string; fields: FieldDef[] }> = {
  legalEntities: {
    label: "Legal entities",
    singular: "legal entity",
    intro: "Registered companies in your group. Payroll, tax and bank files are produced per entity.",
    fields: [
      { name: "name", label: "Name", required: true, wide: true },
      { name: "registrationNumber", label: "Registration number" },
      { name: "country", label: "Country code", required: true, upper: true, maxLength: 2, placeholder: "NG", hint: "Two letters, ISO 3166." },
      { name: "currency", label: "Currency", required: true, upper: true, maxLength: 3, placeholder: "NGN", hint: "Three letters, ISO 4217." },
    ],
  },
  departments: {
    label: "Departments",
    singular: "department",
    intro: "The department tree for each legal entity. A department can sit under another one.",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "code", label: "Code", maxLength: 20, placeholder: "ENG" },
      { name: "legalEntityId", label: "Legal entity", type: "select", required: true, options: entityOptions, empty: "Choose…" },
      {
        name: "parentId", label: "Sits under", type: "select", empty: "Top level",
        options: (d, v, editingId) =>
          d.departments.filter((x) => x.isActive && x.id !== editingId && x.legalEntity.id === v.legalEntityId),
      },
      {
        name: "headId", label: "Head of department", type: "select", empty: "None",
        options: (d) => d.employees.nodes.map((e) => ({ id: e.id, name: e.fullName })),
      },
    ],
  },
  locations: {
    label: "Locations",
    singular: "location",
    intro: "Offices and sites. Leave policies and public holidays will attach to locations.",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "legalEntityId", label: "Legal entity", type: "select", required: true, options: entityOptions, empty: "Choose…" },
      { name: "city", label: "City" },
      { name: "country", label: "Country code", required: true, upper: true, maxLength: 2, placeholder: "NG" },
      { name: "timezone", label: "Time zone", placeholder: "Africa/Lagos", hint: "An IANA name, such as Africa/Lagos." },
      { name: "address", label: "Address", type: "textarea", wide: true },
      { name: "latitude", label: "Latitude", type: "money", placeholder: "6.4541", hint: "For attendance: where the site is." },
      { name: "longitude", label: "Longitude", type: "money", placeholder: "3.3947" },
      { name: "radiusM", label: "Clock-in radius (metres)", type: "number", hint: "Clocking in further away is flagged. 0 or empty: no check." },
    ],
  },
  jobTitles: {
    label: "Job titles",
    singular: "job title",
    intro: "The titles you can give employees. The description shows on the Job tab of each record.",
    fields: [
      { name: "name", label: "Name", required: true, wide: true },
      { name: "description", label: "Job description", type: "textarea", wide: true, maxLength: 4000,
        hint: "What the role is for and what it covers. Up to 4,000 characters (about 600 words)." },
    ],
  },
  grades: {
    label: "Grades",
    singular: "grade",
    intro: "Pay grades or bands. Rank orders them from junior (low) to senior (high).",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "rank", label: "Rank", type: "number", required: true, hint: "0 is the most junior." },
      { name: "payMin", label: "Band minimum", type: "money", hint: "Monthly base pay in the company currency." },
      { name: "payMid", label: "Band midpoint", type: "money", hint: "Leave empty to use halfway." },
      { name: "payMax", label: "Band maximum", type: "money" },
    ],
  },
};

function blankValues(kind: Kind, tenant: Tenant | null): Values {
  const values: Values = { isActive: true };
  for (const f of KINDS[kind].fields) values[f.name] = "";
  if (kind === "legalEntities") Object.assign(values, { country: tenant?.country ?? "", currency: tenant?.currency ?? "" });
  if (kind === "locations") values.country = tenant?.country ?? "";
  if (kind === "grades") values.rank = "0";
  return values;
}

type Row = { id: string; isActive: boolean } & Record<string, unknown>;

function valuesOf(kind: Kind, row: Row): Values {
  const ref = (v: unknown) => (v && typeof v === "object" && "id" in v ? String((v as Option).id) : "");
  const values: Values = { isActive: row.isActive };
  for (const f of KINDS[kind].fields) {
    values[f.name] = f.name.endsWith("Id") ? ref(row[f.name.slice(0, -2)]) : String(row[f.name] ?? "");
  }
  return values;
}

function UnitDialog({ kind, data, editing, onClose, onSaved }: {
  kind: Kind;
  data: OrganizationQuery;
  editing: { id?: string; values: Values };
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const client = useClient();
  const config = KINDS[kind];
  const [values, setValues] = useState<Values>(editing.values);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const set = (name: string, value: string | boolean) => setValues((v) => ({ ...v, [name]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing = Object.fromEntries(
      config.fields.filter((f) => f.required && !String(values[f.name]).trim()).map((f) => [f.name, `Enter the ${f.label.toLowerCase()}.`]),
    );
    setFieldErrors(missing);
    if (Object.keys(missing).length) return;

    const input: Record<string, unknown> = { id: editing.id ?? null, isActive: values.isActive };
    for (const f of config.fields) {
      const raw = String(values[f.name]).trim();
      input[f.name] = f.type === "select" ? raw || null : f.type === "number" ? Number(raw)
        : f.type === "money" ? (raw.replace(/[,\s]/g, "") || null) : f.upper ? raw.toUpperCase() : raw;
    }
    setBusy(true);
    const result = await save(client, kind, input);
    setBusy(false);
    const errors: Record<string, string> = {};
    const failed = reportErrors(result, result.errors, config.fields.map((f) => f.name),
      (f, message) => { errors[f] = message; }, setFormError);
    setFieldErrors(errors);
    if (!failed) onSaved(`${config.singular.charAt(0).toUpperCase() + config.singular.slice(1)} saved.`);
  }

  return (
    <Dialog open wide onClose={onClose} title={editing.id ? `Edit ${config.singular}` : `Add ${config.singular}`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="unit-form" busy={busy}>Save</Button>
      </>}>
      <form id="unit-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => {
            const value = String(values[f.name]);
            const invalid = !!fieldErrors[f.name];
            return (
              <div key={f.name} className={f.wide ? "sm:col-span-2" : undefined}>
                <Field label={f.label} hint={f.hint} error={fieldErrors[f.name]} optional={!f.required}>
                  {f.type === "select" ? (
                    <Select value={value} aria-invalid={invalid} onChange={(e) => {
                      set(f.name, e.target.value);
                      // A parent from another entity would be rejected, so clear it when the entity changes.
                      if (f.name === "legalEntityId" && kind === "departments") set("parentId", "");
                    }}>
                      <option value="">{f.empty}</option>
                      {f.options?.(data, values, editing.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </Select>
                  ) : f.type === "textarea" ? (
                    <>
                      <Textarea rows={f.name === "description" ? (kind === "jobTitles" ? 12 : 6) : 2} value={value} readOnly={drafting}
                        maxLength={f.maxLength} aria-invalid={invalid} onChange={(e) => set(f.name, e.target.value)} />
                      {f.maxLength && (
                        <span className={cx("mt-1 block text-right text-xs tabular-nums",
                          value.length >= f.maxLength ? "font-medium text-red-600" : value.length > f.maxLength * 0.9 ? "text-amber-700 dark:text-amber-400" : "text-muted")}>
                          {value.length.toLocaleString()} / {f.maxLength.toLocaleString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <Input value={value} aria-invalid={invalid} placeholder={f.placeholder} maxLength={f.maxLength}
                      inputMode={f.type === "number" ? "numeric" : undefined}
                      className={f.upper ? "uppercase" : undefined}
                      onChange={(e) => set(f.name, e.target.value)} />
                  )}
                </Field>
                {kind === "jobTitles" && f.name === "description" && data.aiWriting && (
                  <AiDraft title={String(values.name)} text={value} busy={drafting} setBusy={setDrafting}
                    onDraft={(text) => set("description", text)} />
                )}
              </div>
            );
          })}
        </div>
        {editing.id && (
          <Checkbox label="Active" description="Inactive units stay on existing records but cannot be chosen for new ones."
            checked={values.isActive === true} onChange={(v) => set("isActive", v)} />
        )}
      </form>
    </Dialog>
  );
}

/**
 * "Write with AI" under a job description: drafts one from the title, using whatever is in the
 * box as notes (or a draft to improve). The person reads and edits it before saving, and can
 * undo straight back to what they had.
 */
function AiDraft({ title, text, busy, setBusy, onDraft }: {
  title: string; text: string; busy: boolean; setBusy: (b: boolean) => void; onDraft: (text: string) => void;
}) {
  const client = useClient();
  const [problem, setProblem] = useState<string>();
  const [before, setBefore] = useState<string | null>(null);

  async function write() {
    if (!title.trim()) return setProblem("Enter the job title first.");
    setProblem(undefined);
    setBusy(true);
    const r = await client.mutation(DraftJobDescriptionDocument, { title, notes: text }).toPromise();
    setBusy(false);
    const draft = r.data?.draftJobDescription;
    if (!draft) return setProblem(errorMessage(r.error) ?? "No draft came back. Try again.");
    setBefore(text);
    onDraft(draft);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button type="button" size="sm" variant="secondary" onClick={write} disabled={busy}
        icon={busy ? <Spinner small /> : <IconSparkle size={15} />}>
        {busy ? "Writing…" : text.trim() ? "Rewrite with AI" : "Write with AI"}
      </Button>
      {before !== null && !busy && (
        <button type="button" className="text-sm font-medium text-brand-ink hover:underline"
          onClick={() => { onDraft(before); setBefore(null); }}>Undo</button>
      )}
      <span className="text-xs text-muted">
        {problem ? <span className="text-red-600">{problem}</span>
          : "Uses the title and anything you have typed here as notes. Read it and adjust it before saving."}
      </span>
    </div>
  );
}

type SaveResult = { error?: Parameters<typeof reportErrors>[0]["error"]; errors?: { field?: string | null; message: string }[] };

async function save(client: ReturnType<typeof useClient>, kind: Kind, input: Record<string, unknown>): Promise<SaveResult> {
  // Each kind has its own typed mutation; the config above guarantees the input shape.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const run = async (doc: any, key: string) => {
    const r = await client.mutation(doc, { input } as any).toPromise();
    return { error: r.error, errors: (r.data as any)?.[key]?.errors };
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  switch (kind) {
    case "legalEntities": return run(SaveLegalEntityDocument, "saveLegalEntity");
    case "locations": return run(SaveLocationDocument, "saveLocation");
    case "departments": return run(SaveDepartmentDocument, "saveDepartment");
    case "jobTitles": return run(SaveJobTitleDocument, "saveJobTitle");
    case "grades": return run(SaveGradeDocument, "saveGrade");
  }
}

function Active({ on }: { on: boolean }) {
  return on ? <Badge tone="good" dot>Active</Badge> : <Badge>Inactive</Badge>;
}

const dash = <span className="text-muted">—</span>;

function OrganizationPage() {
  const { can, tenant } = useSession();
  const [{ data, error }, reload] = useQuery({ query: OrganizationDocument });
  const [tab] = useSettingsTab<Kind>(["legalEntities", "locations", "departments", "jobTitles", "grades"], "legalEntities");
  const [editing, setEditing] = useState<{ id?: string; values: Values } | null>(null);
  const [saved, setSaved] = useState<string>();

  if (!can(PERMS.orgManage)) return <Notice tone="warning">You do not have permission to manage the organization.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;

  const config = KINDS[tab];
  const rows = data[tab] as Row[];
  const edit = (row: Row) => { setSaved(undefined); setEditing({ id: row.id, values: valuesOf(tab, row) }); };
  const add = () => { setSaved(undefined); setEditing({ values: blankValues(tab, tenant) }); };
  const needsEntity = (tab === "departments" || tab === "locations") && !data.legalEntities.some((e) => e.isActive);

  const columns: Record<Kind, { head: string[]; cells: (r: Row) => ReactNode[] }> = {
    legalEntities: {
      head: ["Name", "Registration no.", "Country", "Currency"],
      cells: (r) => [r.name as string, (r.registrationNumber as string) || dash, r.country as string, r.currency as string],
    },
    departments: {
      head: ["Name", "Legal entity", "Sits under", "Head"],
      cells: (r) => {
        const d = r as unknown as OrganizationQuery["departments"][number];
        return [<>{d.name}{d.code && <span className="ml-2 text-xs text-muted">{d.code}</span>}</>, d.legalEntity.name, d.parent?.name ?? dash, d.head?.fullName ?? dash];
      },
    },
    locations: {
      head: ["Name", "Legal entity", "City", "Time zone"],
      cells: (r) => {
        const l = r as unknown as OrganizationQuery["locations"][number];
        return [l.name, l.legalEntity.name, [l.city, l.country].filter(Boolean).join(", "), l.timezone || dash];
      },
    },
    jobTitles: { head: ["Name"], cells: (r) => [r.name as string] },
    grades: {
      head: ["Rank", "Name", "Pay band (monthly)"],
      cells: (r) => [<span key="rank" className="tabular-nums">{r.rank as number}</span>, r.name as string,
        <span key="band" className="tabular-nums text-muted">{r.payMin || r.payMax
          ? `${r.payMin ? Number(r.payMin).toLocaleString() : "…"} – ${r.payMax ? Number(r.payMax).toLocaleString() : "…"}` : "—"}</span>],
    },
  };

  return (
    <>
      <SettingsIntro>The structure every employee record points to.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush title={config.label} description={config.intro}
        actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={add} disabled={needsEntity}>Add {config.singular}</Button>}>
        {needsEntity ? (
          <div className="p-5"><Notice tone="info">Add a legal entity first. {config.label} belong to one.</Notice></div>
        ) : !rows.length ? (
          <div className="p-5">
            <Empty title={`No ${config.label.toLowerCase()} yet`} icon={<IconSitemap size={18} />}
              action={<Button size="sm" onClick={add}>Add {config.singular}</Button>} />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                {columns[tab].head.map((h) => <TH key={h}>{h}</TH>)}
                <TH>Status</TH>
                <TH align="right"><span className="sr-only">Actions</span></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.isActive ? "transition hover:bg-subtle/60" : "text-muted transition hover:bg-subtle/60"}>
                  {columns[tab].cells(r).map((c, i) => <TD key={i} className={i === 0 ? "font-medium" : undefined}>{c}</TD>)}
                  <TD><Active on={r.isActive} /></TD>
                  <TD align="right"><Button size="sm" variant="ghost" onClick={() => edit(r)}>Edit</Button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <UnitDialog key={tab + (editing.id ?? "new")} kind={tab} data={data} editing={editing} onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); setSaved(message); reload({ requestPolicy: "network-only" }); }} />
      )}
    </>
  );
}

export default function OrganizationSettingsPage() {
  const params = useSearchParams();
  return params.get("tab") === "teams" ? <TeamsAdmin /> : <OrganizationPage />;
}
