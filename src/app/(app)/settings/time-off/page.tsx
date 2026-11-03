"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import { EMPLOYMENT_TYPES } from "@/components/employees/EmployeeDialogs";
import { IconChevronLeft, IconChevronRight, IconClose, IconPlus } from "@/components/icons";
import { TypeDot } from "@/components/leave/Leave";
import {
  ActionDialog, Badge, Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, IconButton, Input, Loading, Notice, Select,
  Table, TD, TH,
} from "@/components/ui";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { graphql } from "@/gql";
import type { EmploymentType, LeaveAccrual, LeaveSetupQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatDays } from "@/lib/format";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const LeaveSetupDocument = graphql(`
  query LeaveSetup($year: Int!) {
    leaveTypes(includeInactive: true) { id name code color isPaid tracksBalance paidOutOnExit allowHalfDays approvalLevels isActive }
    leavePolicies {
      id name daysPerYear accrual proRata startsOn carryOverMax carryOverExpiryMonths employmentType isActive
      leaveType { id name color }
      legalEntity { id name }
      location { id name }
      grade { id name }
      tenureRules { years extraDays }
    }
    publicHolidays(year: $year) { id name date location { id name } }
    legalEntities { id name isActive }
    locations { id name isActive }
    grades { id name isActive }
  }
`);

const SaveLeaveTypeDocument = graphql(`
  mutation SaveLeaveType($input: SaveLeaveTypeInput!) {
    saveLeaveType(input: $input) { leaveType { id } errors { field message } }
  }
`);

const SaveLeavePolicyDocument = graphql(`
  mutation SaveLeavePolicy($input: SaveLeavePolicyInput!) {
    saveLeavePolicy(input: $input) { policy { id } errors { field message } }
  }
`);

const SaveHolidayDocument = graphql(`
  mutation SavePublicHoliday($input: SavePublicHolidayInput!) {
    savePublicHoliday(input: $input) { holiday { id } errors { field message } }
  }
`);

const DeleteHolidayDocument = graphql(`
  mutation DeletePublicHoliday($id: ID!) {
    deletePublicHoliday(id: $id)
  }
`);

type Setup = LeaveSetupQuery;
type LeaveTypeRow = Setup["leaveTypes"][number];
type PolicyRow = Setup["leavePolicies"][number];
type HolidayRow = Setup["publicHolidays"][number];
type Tab = "types" | "policies" | "holidays";

const COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#b45309", "#be123c", "#64748b", "#15803d", "#0891b2"];

/** Form plumbing shared by the three dialogs: field errors, a form error and the busy flag. */
function useFormState() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  return { errors, setErrors, formError, setFormError, busy, setBusy };
}

function FormDialog({ id, title, description, busy, wide, onClose, children }: {
  id: string; title: string; description?: string; busy: boolean; wide?: boolean; onClose: () => void; children: ReactNode;
}) {
  return (
    <Dialog open wide={wide} onClose={onClose} title={title} description={description}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form={id} busy={busy}>Save</Button>
      </>}>
      {children}
    </Dialog>
  );
}

/* ---------------------------------------------------------------- Leave type */

function LeaveTypeDialog({ row, onClose, onSaved }: { row: LeaveTypeRow | null; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveLeaveTypeDocument);
  const f = useFormState();
  const [v, setV] = useState({
    name: row?.name ?? "", code: row?.code ?? "", color: row?.color ?? COLORS[0], isPaid: row?.isPaid ?? true,
    tracksBalance: row?.tracksBalance ?? true, paidOutOnExit: row?.paidOutOnExit ?? false, allowHalfDays: row?.allowHalfDays ?? true,
    approvalLevels: String(row?.approvalLevels ?? 1), isActive: row?.isActive ?? true,
  });
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    f.setFormError(undefined);
    if (!v.name.trim()) return f.setErrors({ name: "Enter a name." });
    f.setBusy(true);
    const result = await save({ input: { id: row?.id ?? null, ...v, name: v.name.trim(), approvalLevels: Number(v.approvalLevels) } });
    f.setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveLeaveType.errors, ["name", "code", "color", "approvalLevels"] as const,
      (k, m) => { found[k] = m; }, f.setFormError);
    f.setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <FormDialog id="type-form" title={row ? "Edit leave type" : "Add leave type"} busy={f.busy} onClose={onClose}>
      <form id="type-form" onSubmit={submit} noValidate className="space-y-4">
        {f.formError && <ErrorNote error={f.formError} />}
        <div className="grid grid-cols-[1fr_110px] gap-4">
          <Field label="Name" error={f.errors.name}>
            <Input value={v.name} aria-invalid={!!f.errors.name} placeholder="Annual leave" onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Code" optional error={f.errors.code}>
            <Input value={v.code} maxLength={20} placeholder="AL" onChange={(e) => set("code", e.target.value.toUpperCase())} />
          </Field>
        </div>
        <Field label="Colour on the calendar">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
            {COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={v.color === c} aria-label={c} onClick={() => set("color", c)}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition ${v.color === c ? "ring-2 ring-ink" : "hover:scale-110"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </Field>
        <Field label="Approvals" hint="Each level is the next manager up the reporting line. Where the line ends, HR decides.">
          <Select value={v.approvalLevels} onChange={(e) => set("approvalLevels", e.target.value)}>
            <option value="0">None: booked as soon as it is requested</option>
            <option value="1">Line manager</option>
            <option value="2">Line manager, then their manager</option>
            <option value="3">Three levels up the line</option>
          </Select>
        </Field>
        <div className="space-y-3">
          <Checkbox label="Keeps a balance" description="Days are earned under a policy and drawn down. Turn off for leave granted case by case."
            checked={v.tracksBalance} onChange={(c) => set("tracksBalance", c)} />
          <Checkbox label="Paid" checked={v.isPaid} onChange={(c) => set("isPaid", c)} />
          {v.tracksBalance && v.isPaid && (
            <Checkbox label="Pay out unused days when someone leaves" description="Added to their last payslip as part of the final settlement, when payroll runs in StaffPilot."
              checked={v.paidOutOnExit} onChange={(c) => set("paidOutOnExit", c)} />
          )}
          <Checkbox label="Half days allowed" checked={v.allowHalfDays} onChange={(c) => set("allowHalfDays", c)} />
          {row && <Checkbox label="Active" description="Inactive types cannot be requested. History is kept." checked={v.isActive} onChange={(c) => set("isActive", c)} />}
        </div>
      </form>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------- Policy */

function PolicyDialog({ row, setup, onClose, onSaved }: { row: PolicyRow | null; setup: Setup; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveLeavePolicyDocument);
  const f = useFormState();
  const tracked = setup.leaveTypes.filter((t) => t.tracksBalance && (t.isActive || t.id === row?.leaveType.id));
  const [v, setV] = useState({
    leaveTypeId: row?.leaveType.id ?? tracked[0]?.id ?? "", name: row?.name ?? "", daysPerYear: row ? String(Number(row.daysPerYear)) : "",
    accrual: (row?.accrual ?? "UPFRONT") as LeaveAccrual, proRata: row?.proRata ?? true,
    startsOn: row?.startsOn ?? `${new Date().getFullYear()}-01-01`,
    carryOverMax: row ? String(Number(row.carryOverMax)) : "0", carryOverExpiryMonths: row?.carryOverExpiryMonths != null ? String(row.carryOverExpiryMonths) : "",
    legalEntityId: row?.legalEntity?.id ?? "", locationId: row?.location?.id ?? "", gradeId: row?.grade?.id ?? "",
    employmentType: (row?.employmentType ?? "") as EmploymentType | "", isActive: row?.isActive ?? true,
  });
  const [steps, setSteps] = useState((row?.tenureRules ?? []).map((s) => ({ years: String(s.years), extraDays: String(Number(s.extraDays)) })));
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  const number = /^\d+(\.\d{1,2})?$/;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    f.setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!v.name.trim()) missing.name = "Enter a name.";
    if (!v.leaveTypeId) missing.leaveType = "Choose a leave type.";
    if (!number.test(v.daysPerYear)) missing.daysPerYear = "Enter days, like 20 or 22.5.";
    if (!number.test(v.carryOverMax)) missing.carryOverMax = "Enter days, or 0.";
    if (v.carryOverExpiryMonths && !/^\d+$/.test(v.carryOverExpiryMonths)) missing.carryOverExpiryMonths = "Enter whole months.";
    if (steps.some((s) => !/^\d+$/.test(s.years) || Number(s.years) < 1 || !number.test(s.extraDays))) {
      missing.tenureRules = "Each step needs whole years (1 or more) and extra days.";
    }
    f.setErrors(missing);
    if (Object.keys(missing).length) return;
    f.setBusy(true);
    const result = await save({
      input: {
        id: row?.id ?? null, leaveTypeId: v.leaveTypeId, name: v.name.trim(), daysPerYear: v.daysPerYear, accrual: v.accrual,
        proRata: v.proRata, startsOn: v.startsOn, carryOverMax: v.carryOverMax,
        carryOverExpiryMonths: v.carryOverExpiryMonths ? Number(v.carryOverExpiryMonths) : null,
        legalEntityId: v.legalEntityId || null, locationId: v.locationId || null, gradeId: v.gradeId || null,
        employmentType: v.employmentType || null, isActive: v.isActive,
        tenureRules: steps.map((s) => ({ years: Number(s.years), extraDays: s.extraDays })),
      },
    });
    f.setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveLeavePolicy.errors,
      ["name", "leaveType", "daysPerYear", "carryOverMax", "carryOverExpiryMonths", "tenureRules", "location", "startsOn"] as const,
      (k, m) => { found[k] = m; }, f.setFormError);
    f.setErrors(found);
    if (!failed) onSaved();
  }

  const choose = (label: string, value: string, key: "legalEntityId" | "locationId" | "gradeId", options: { id: string; name: string; isActive: boolean }[]) => (
    <Field label={label} error={key === "locationId" ? f.errors.location : undefined}>
      <Select value={value} onChange={(e) => set(key, e.target.value)}>
        <option value="">Any</option>
        {options.filter((o) => o.isActive || o.id === value).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </Select>
    </Field>
  );

  return (
    <FormDialog id="policy-form" wide title={row ? "Edit policy" : "Add policy"} busy={f.busy} onClose={onClose}
      description="Each employee gets the most specific active policy that matches them.">
      <form id="policy-form" onSubmit={submit} noValidate className="space-y-5">
        {f.formError && <ErrorNote error={f.formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={f.errors.name}>
            <Input value={v.name} aria-invalid={!!f.errors.name} placeholder="Annual leave (Lagos)" onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Leave type" error={f.errors.leaveType}>
            <Select value={v.leaveTypeId} onChange={(e) => set("leaveTypeId", e.target.value)}>
              {tracked.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        </div>

        <fieldset className="space-y-4 border-t border-line pt-4">
          <legend className="sr-only">Entitlement</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Days per year" error={f.errors.daysPerYear}>
              <Input inputMode="decimal" value={v.daysPerYear} aria-invalid={!!f.errors.daysPerYear} onChange={(e) => set("daysPerYear", e.target.value)} />
            </Field>
            <Field label="Earned">
              <Select value={v.accrual} onChange={(e) => set("accrual", e.target.value as LeaveAccrual)}>
                <option value="UPFRONT">All on 1 January</option>
                <option value="MONTHLY">A twelfth each month</option>
              </Select>
            </Field>
            <Field label="Starts" hint="Earlier days: enter as opening balances." error={f.errors.startsOn}>
              <Input type="date" value={v.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
            </Field>
          </div>
          {v.accrual === "UPFRONT" && (
            <Checkbox label="Pro-rata for joiners" description="Someone who joins mid-year gets the share of the year left."
              checked={v.proRata} onChange={(c) => set("proRata", c)} />
          )}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">Long-service days</span>
              <Button type="button" size="sm" variant="ghost" icon={<IconPlus size={14} />} onClick={() => setSteps([...steps, { years: "", extraDays: "" }])}>Add step</Button>
            </div>
            {steps.length ? (
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted">After</span>
                    <Input className="w-16" inputMode="numeric" aria-label="Years of service" value={s.years}
                      onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, years: e.target.value } : x)))} />
                    <span className="text-muted">years,</span>
                    <Input className="w-16" inputMode="decimal" aria-label="Extra days" value={s.extraDays}
                      onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, extraDays: e.target.value } : x)))} />
                    <span className="text-muted">extra days</span>
                    <IconButton label="Remove step" type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))}><IconClose size={14} /></IconButton>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted">None. Service is counted in whole years on 1 January.</p>}
            {f.errors.tenureRules && <p className="mt-1.5 text-xs text-red-600">{f.errors.tenureRules}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Carry over up to (days)" error={f.errors.carryOverMax} hint="Days above this expire on 1 January.">
              <Input inputMode="decimal" value={v.carryOverMax} aria-invalid={!!f.errors.carryOverMax} onChange={(e) => set("carryOverMax", e.target.value)} />
            </Field>
            <Field label="Carried days expire after (months)" optional error={f.errors.carryOverExpiryMonths} hint="Blank: they never expire.">
              <Input inputMode="numeric" value={v.carryOverExpiryMonths} onChange={(e) => set("carryOverExpiryMonths", e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[13px] font-medium text-ink">Applies to</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {choose("Legal entity", v.legalEntityId, "legalEntityId", setup.legalEntities)}
            {choose("Location", v.locationId, "locationId", setup.locations)}
            {choose("Grade", v.gradeId, "gradeId", setup.grades)}
            <Field label="Contract type">
              <Select value={v.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType | "")}>
                <option value="">Any</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
          </div>
        </fieldset>
        {row && <Checkbox label="Active" checked={v.isActive} onChange={(c) => set("isActive", c)} />}
      </form>
    </FormDialog>
  );
}

/* ------------------------------------------------------------------- Holiday */

function HolidayDialog({ row, setup, onClose, onSaved }: { row: HolidayRow | null; setup: Setup; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveHolidayDocument);
  const f = useFormState();
  const [name, setName] = useState(row?.name ?? "");
  const [date, setDate] = useState(row?.date ?? "");
  const [locationId, setLocationId] = useState(row?.location?.id ?? "");

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    f.setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!name.trim()) missing.name = "Enter a name.";
    if (!date) missing.date = "Choose the date.";
    f.setErrors(missing);
    if (Object.keys(missing).length) return;
    f.setBusy(true);
    const result = await save({ input: { id: row?.id ?? null, name: name.trim(), date, locationId: locationId || null } });
    f.setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.savePublicHoliday.errors, ["name", "date", "location"] as const,
      (k, m) => { found[k] = m; }, f.setFormError);
    f.setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <FormDialog id="holiday-form" title={row ? "Edit holiday" : "Add holiday"} busy={f.busy} onClose={onClose}
      description="Holidays are not counted as leave days. Requests already made keep their day count.">
      <form id="holiday-form" onSubmit={submit} noValidate className="space-y-4">
        {f.formError && <ErrorNote error={f.formError} />}
        <Field label="Name" error={f.errors.name}>
          <Input value={name} aria-invalid={!!f.errors.name} placeholder="Eid al-Fitr" onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Date" error={f.errors.date}>
          <Input type="date" value={date} aria-invalid={!!f.errors.date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Where" error={f.errors.location}>
          <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">Every location</option>
            {setup.locations.filter((l) => l.isActive || l.id === locationId).map((l) => <option key={l.id} value={l.id}>{l.name} only</option>)}
          </Select>
        </Field>
      </form>
    </FormDialog>
  );
}

/* ---------------------------------------------------------------------- Page */

function Active({ on }: { on: boolean }) {
  return on ? <Badge tone="good" dot>Active</Badge> : <Badge>Inactive</Badge>;
}

const APPROVALS = ["Booked at once", "Line manager", "2 levels", "3 levels"];

function appliesTo(p: PolicyRow) {
  const parts = [p.legalEntity?.name, p.location?.name, p.grade && `Grade ${p.grade.name}`,
    p.employmentType && EMPLOYMENT_TYPES.find((t) => t.value === p.employmentType)?.label].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Everyone";
}

export default function LeaveSettingsPage() {
  const { can } = useSession();
  const [year, setYear] = useState(new Date().getFullYear());
  const [{ data, error }, reload] = useQuery({ query: LeaveSetupDocument, variables: { year } });
  const [tab] = useSettingsTab<Tab>(["types", "policies", "holidays"], "types");
  const [editing, setEditing] = useState<{ tab: Tab; row: unknown } | null>(null);
  const [removing, setRemoving] = useState<HolidayRow | null>(null);
  const [, remove] = useMutation(DeleteHolidayDocument);
  const [saved, setSaved] = useState<string>();

  if (!can(PERMS.leaveManage)) return <Notice tone="warning">You do not have permission to set up leave.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;

  const done = (message: string) => { setEditing(null); setSaved(message); reload({ requestPolicy: "network-only" }); };
  const open = (row: unknown = null) => { setSaved(undefined); setEditing({ tab, row }); };
  const addLabel = { types: "Add leave type", policies: "Add policy", holidays: "Add holiday" }[tab];

  return (
    <>
      <SettingsIntro>Leave types, who earns how much, and the days everyone is off.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}

      <Card flush
        title={tab === "holidays" ? (
          <span className="flex items-center gap-2">
            <IconButton label="Previous year" onClick={() => setYear(year - 1)}><IconChevronLeft size={16} /></IconButton>
            <span className="tabular-nums">{year}</span>
            <IconButton label="Next year" onClick={() => setYear(year + 1)}><IconChevronRight size={16} /></IconButton>
          </span>
        ) : undefined}
        actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={() => open()}
          disabled={tab === "policies" && !data.leaveTypes.some((t) => t.tracksBalance && t.isActive)}>{addLabel}</Button>}>
        {tab === "types" && (data.leaveTypes.length ? (
          <Table>
            <thead><tr><TH>Leave type</TH><TH>Balance</TH><TH className="hidden sm:table-cell">Approval</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.leaveTypes.map((t) => (
                <tr key={t.id} className={t.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">
                    <span className="flex items-center gap-2"><TypeDot color={t.color} />{t.name}{t.code && <span className="text-xs font-normal text-muted">{t.code}</span>}</span>
                    {!t.isPaid && <span className="mt-0.5 block pl-[18px] text-xs font-normal text-muted">Unpaid</span>}
                  </TD>
                  <TD>{t.tracksBalance ? "Earned under a policy" : "Case by case"}</TD>
                  <TD className="hidden sm:table-cell">{APPROVALS[t.approvalLevels] ?? `${t.approvalLevels} levels`}</TD>
                  <TD><Active on={t.isActive} /></TD>
                  <TD align="right"><Button size="sm" variant="ghost" onClick={() => open(t)}>Edit</Button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><Empty title="No leave types yet" action={<Button size="sm" onClick={() => open()}>Add leave type</Button>}>Start with annual and sick leave.</Empty></div>)}

        {tab === "policies" && (data.leavePolicies.length ? (
          <Table>
            <thead><tr><TH>Policy</TH><TH>Applies to</TH><TH align="right">Days a year</TH><TH className="hidden md:table-cell">Carry-over</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.leavePolicies.map((p) => (
                <tr key={p.id} className={p.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">
                    {p.name}
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-muted"><TypeDot color={p.leaveType.color} className="h-2 w-2" />{p.leaveType.name}</span>
                  </TD>
                  <TD className="text-muted">{appliesTo(p)}</TD>
                  <TD align="right" className="tabular-nums">
                    {Number(p.daysPerYear)}
                    <span className="block text-xs text-muted">{p.accrual === "MONTHLY" ? "monthly" : "on 1 Jan"}{p.tenureRules.length ? " + service" : ""}</span>
                  </TD>
                  <TD className="hidden text-muted md:table-cell">
                    {Number(p.carryOverMax) > 0
                      ? `Up to ${formatDays(p.carryOverMax)}${p.carryOverExpiryMonths ? `, used within ${p.carryOverExpiryMonths} months` : ""}`
                      : "None"}
                  </TD>
                  <TD><Active on={p.isActive} /></TD>
                  <TD align="right"><Button size="sm" variant="ghost" onClick={() => open(p)}>Edit</Button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><Empty title="No policies yet">A policy says how many days of a leave type people earn, and who it covers.</Empty></div>)}

        {tab === "holidays" && (data.publicHolidays.length ? (
          <Table>
            <thead><tr><TH>Date</TH><TH>Holiday</TH><TH>Where</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.publicHolidays.map((h) => (
                <tr key={h.id}>
                  <TD className="whitespace-nowrap tabular-nums">
                    {formatDate(h.date)}
                    <span className="block text-xs text-muted">{new Date(`${h.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</span>
                  </TD>
                  <TD className="font-medium">{h.name}</TD>
                  <TD className="text-muted">{h.location?.name ?? "Every location"}</TD>
                  <TD align="right" className="whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => open(h)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(h)}>Remove</Button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <div className="p-5"><Empty title={`No holidays in ${year}`} action={<Button size="sm" onClick={() => open()}>Add holiday</Button>} /></div>)}
      </Card>

      {editing?.tab === "types" && <LeaveTypeDialog row={editing.row as LeaveTypeRow | null} onClose={() => setEditing(null)} onSaved={() => done("Leave type saved.")} />}
      {editing?.tab === "policies" && <PolicyDialog row={editing.row as PolicyRow | null} setup={data} onClose={() => setEditing(null)} onSaved={() => done("Policy saved. Balances update the next time they are shown.")} />}
      {editing?.tab === "holidays" && <HolidayDialog row={editing.row as HolidayRow | null} setup={data} onClose={() => setEditing(null)} onSaved={() => done("Holiday saved.")} />}
      <ActionDialog open={removing !== null} onClose={() => setRemoving(null)} title={`Remove ${removing?.name ?? "holiday"}?`}
        description="Requests already made keep their day count." confirmLabel="Remove" tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          const result = await remove({ id: removing.id });
          if (result.error) throw new Error(errorMessage(result.error));
          done("Holiday removed.");
        }} />
    </>
  );
}
