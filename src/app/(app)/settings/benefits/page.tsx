"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { rates } from "@/components/profile/BenefitsBlock";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, Input, Loading, Notice, Select, Table, TD, TH, Textarea } from "@/components/ui";
import { SettingsIntro } from "@/components/settings/Intro";
import { graphql } from "@/gql";
import type { BenefitBasis, BenefitKind, BenefitPlansSetupQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const PlansDocument = graphql(`
  query BenefitPlansSetup {
    benefitPlans(includeInactive: true) {
      id name kind provider description employeeRate employerRate basis statutory isActive enrolledCount
    }
  }
`);

const SavePlanDocument = graphql(`
  mutation SaveBenefitPlan($input: SaveBenefitPlanInput!) {
    saveBenefitPlan(input: $input) { plan { id } errors { field message } }
  }
`);

type Plan = BenefitPlansSetupQuery["benefitPlans"][number];

const KINDS: { value: BenefitKind; label: string }[] = [
  { value: "PENSION", label: "Pension" }, { value: "NHF", label: "National Housing Fund" },
  { value: "HEALTH", label: "Health insurance (HMO)" }, { value: "LIFE", label: "Group life assurance" },
  { value: "COMPENSATION", label: "Employees' compensation" }, { value: "OTHER", label: "Other" },
];
const BASES: { value: BenefitBasis; label: string }[] = [
  { value: "BASIC", label: "Basic salary" }, { value: "BHT", label: "Basic, housing and transport" },
  { value: "GROSS", label: "Gross pay" }, { value: "ANNUAL_EMOLUMENTS", label: "Annual total emoluments" },
  { value: "FIXED", label: "Fixed amount" },
];

function PlanDialog({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SavePlanDocument);
  const [v, setV] = useState({
    name: plan?.name ?? "", kind: plan?.kind ?? "OTHER", provider: plan?.provider ?? "", description: plan?.description ?? "",
    employeeRate: plan?.employeeRate ? String(Number(plan.employeeRate)) : "", employerRate: plan?.employerRate ? String(Number(plan.employerRate)) : "",
    basis: plan?.basis ?? "", isActive: plan?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const number = /^\d+(\.\d{1,2})?$/;
    const bad: Record<string, string> = {};
    if (!v.name.trim()) bad.name = "Give the plan a name.";
    for (const k of ["employeeRate", "employerRate"] as const) if (v[k] && !number.test(v[k].trim())) bad[k] = "Use a percentage like 8 or 2.5.";
    setErrors(bad);
    if (Object.keys(bad).length) return;
    setBusy(true);
    const result = await save({ input: {
      id: plan?.id ?? null, name: v.name, kind: v.kind as BenefitKind, provider: v.provider, description: v.description,
      employeeRate: v.employeeRate || null, employerRate: v.employerRate || null, basis: (v.basis || null) as BenefitBasis | null, isActive: v.isActive,
    } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveBenefitPlan.errors, ["name", "kind", "provider", "description", "employeeRate", "employerRate", "basis"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title={plan ? `Edit ${plan.name}` : "Add benefit plan"}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="plan-form" busy={busy}>Save</Button>
      </>}>
      <form id="plan-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Type">
            <Select value={v.kind} onChange={(e) => set("kind", e.target.value as BenefitKind)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </Field>
          <Field label="Provider" optional hint="The PFA, HMO or insurer, if the company uses one for everybody.">
            <Input value={v.provider} placeholder="Hygeia HMO" onChange={(e) => set("provider", e.target.value)} />
          </Field>
          <Field label="Contributions based on" optional>
            <Select value={v.basis} onChange={(e) => set("basis", e.target.value)}>
              <option value="">Not set</option>
              {BASES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </Select>
          </Field>
          <Field label="Employee pays (%)" optional error={errors.employeeRate}><Input inputMode="decimal" value={v.employeeRate} onChange={(e) => set("employeeRate", e.target.value)} /></Field>
          <Field label="Employer pays (%)" optional error={errors.employerRate}><Input inputMode="decimal" value={v.employerRate} onChange={(e) => set("employerRate", e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Description" optional><Textarea rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} /></Field>
          </div>
        </div>
        {plan && <Checkbox label="Offered" description="Plans no longer offered stay on the records of people already on them." checked={v.isActive} onChange={(c) => set("isActive", c)} />}
      </form>
    </Dialog>
  );
}

export default function BenefitsSetupPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: PlansDocument });
  const [editing, setEditing] = useState<{ plan: Plan | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  if (!can(PERMS.employeesManage)) return <ErrorNote error="You do not have access to benefits setup." />;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;

  return (
    <>
      <SettingsIntro>The plans the company offers. Enrol people from the Benefits tab of their record.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush title="Benefit plans" description="Starts with the Nigerian statutory schemes. Rates are for reference; payroll works out deductions."
        actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={() => setEditing({ plan: null })}>Add plan</Button>}>
        <Table>
          <thead><tr><TH>Plan</TH><TH className="hidden md:table-cell">Contributions</TH><TH align="right">Enrolled</TH><TH>Status</TH><TH /></tr></thead>
          <tbody>
            {data.benefitPlans.map((p) => (
              <tr key={p.id} className={p.isActive ? undefined : "text-muted"}>
                <TD>
                  <span className="flex items-center gap-2 font-medium">{p.name}{p.statutory && <Badge tone="brand">Statutory</Badge>}</span>
                  <span className="block text-xs text-muted">{[KINDS.find((k) => k.value === p.kind)?.label, p.provider].filter(Boolean).join(" · ")}</span>
                </TD>
                <TD className="hidden text-muted md:table-cell">{rates(p) || "—"}</TD>
                <TD align="right" className="tabular-nums">{p.enrolledCount}</TD>
                <TD>{p.isActive ? <Badge tone="good" dot>Offered</Badge> : <Badge>Not offered</Badge>}</TD>
                <TD align="right"><Button size="sm" variant="ghost" onClick={() => setEditing({ plan: p })}>Edit</Button></TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {editing && <PlanDialog plan={editing.plan} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); setSaved("Plan saved."); reload({ requestPolicy: "network-only" }); }} />}
    </>
  );
}
