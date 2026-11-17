"use client";

import Link from "next/link";
import { faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { PayrollSettingsQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const SettingsDocument = graphql(`
  query PayrollSettings {
    payGroups { id name legalEntityId legalEntity country currency frequency payDay anchorDate isActive memberCount supported }
    payComponents { id code name kind role percentOfGross taxable pensionable isActive }
    rulePacks { id country effectiveFrom name data source }
    legalEntities { id name country isActive }
  }
`);

const SaveGroupDocument = graphql(`
  mutation SavePayGroup($input: PayGroupInput!) { savePayGroup(input: $input) { group { id } errors { field message } } }
`);
const SaveComponentDocument = graphql(`
  mutation SavePayComponent($input: PayComponentInput!) { savePayComponent(input: $input) { component { id } errors { field message } } }
`);

type Data = PayrollSettingsQuery;
type Group = Data["payGroups"][number];
type Component = Data["payComponents"][number];

function GroupDialog({ group, data, onClose, onSaved }: { group: Group | null; data: Data; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    name: group?.name ?? "", legalEntityId: group?.legalEntityId ?? data.legalEntities.find((e) => e.isActive)?.id ?? "",
    frequency: group?.frequency ?? "monthly", payDay: String(group?.payDay ?? 25), anchorDate: group?.anchorDate ?? "", isActive: group?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveGroupDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  return (
    <Dialog open onClose={onClose} title={group ? `Edit ${group.name}` : "New pay group"} description="People paid together, on one schedule, from one legal entity."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: group?.id ?? null, name: v.name, legalEntityId: v.legalEntityId, frequency: v.frequency,
            payDay: Number(v.payDay) || 25, anchorDate: v.anchorDate || null, isActive: v.isActive } });
          const problems = r.data?.savePayGroup.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Lagos monthly" /></Field>
        <Field label="Legal entity" error={errors.legalEntityId} hint="Its country decides the tax rules.">
          <Select value={v.legalEntityId} onChange={(e) => set("legalEntityId", e.target.value)}>
            {data.legalEntities.filter((e) => e.isActive).map((e) => <option key={e.id} value={e.id}>{e.name} ({e.country})</option>)}
          </Select>
        </Field>
        <Field label="How often" error={errors.frequency}>
          <Select value={v.frequency} onChange={(e) => set("frequency", e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Every two weeks</option>
          </Select>
        </Field>
        {v.frequency === "monthly" ? (
          <Field label="Pay day" error={errors.payDay} hint="Day of the month; the last day when a month is shorter.">
            <Input type="number" min={1} max={31} value={v.payDay} onChange={(e) => set("payDay", e.target.value)} />
          </Field>
        ) : (
          <Field label="First day of a period" error={errors.anchorDate} hint="Later periods follow every 14 days; pay is on the last day.">
            <Input type="date" value={v.anchorDate} onChange={(e) => set("anchorDate", e.target.value)} />
          </Field>
        )}
        {group && <div className="sm:col-span-2"><Checkbox label="Active" checked={v.isActive} onChange={(c) => set("isActive", c)} /></div>}
      </div>
    </Dialog>
  );
}

function ComponentDialog({ component, onClose, onSaved }: { component: Component | null; onClose: () => void; onSaved: () => void }) {
  const split = component && ["basic", "housing", "transport"].includes(component.role);
  const [v, setV] = useState({
    name: component?.name ?? "", kind: component?.kind ?? "earning", percent: component?.percentOfGross ?? "",
    taxable: component?.taxable ?? true, pensionable: component?.pensionable ?? false, isActive: component?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveComponentDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  return (
    <Dialog open onClose={onClose} title={component ? `Edit ${component.name}` : "New pay component"}
      description={split ? "Its share of each person's monthly gross pay." : "An allowance or deduction you can give to people from their payroll details."}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: component?.id ?? null, code: v.name, name: v.name, kind: v.kind,
            percentOfGross: split ? String(v.percent || "0") : null, taxable: v.taxable, pensionable: v.pensionable, isActive: v.isActive } });
          const problems = r.data?.savePayComponent.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Meal allowance" /></Field>
        {split ? (
          <Field label="Share of gross (%)" error={errors.percentOfGross}><Input inputMode="decimal" value={String(v.percent)} onChange={(e) => set("percent", e.target.value)} /></Field>
        ) : !component?.role || component.role === "extra" ? (
          <Field label="Type" error={errors.kind}>
            <Select value={v.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="earning">Earning (adds to pay)</option>
              <option value="deduction">Deduction (taken from net pay)</option>
            </Select>
          </Field>
        ) : <div />}
        <div className="space-y-2 sm:col-span-2">
          {v.kind === "earning" && <Checkbox label="Taxable" checked={v.taxable} onChange={(c) => set("taxable", c)} />}
          {v.kind === "earning" && <Checkbox label="Counts towards pension" description="Nigeria: basic, housing and transport at least." checked={v.pensionable} onChange={(c) => set("pensionable", c)} />}
          {component && <Checkbox label="Active" checked={v.isActive} onChange={(c) => set("isActive", c)} />}
        </div>
      </div>
    </Dialog>
  );
}

const money = (v: unknown) => Number(v).toLocaleString();

function Rules({ data }: { data: Data }) {
  return (
    <div className="space-y-4">
      {data.rulePacks.map((p) => {
        const d = p.data as { currency: string; tax: { period: string; bands: [number | null, number][] }; pension?: Record<string, number | string>;
          housing_fund?: Record<string, number | string>; social_security?: Record<string, number | string>; employer_levies?: { name: string; percent: number }[];
          reliefs?: Record<string, number>; minimum_wage_annual?: number };
        let from = 0;
        return (
          <Card key={p.id} title={p.name} description={`In force from ${formatDate(p.effectiveFrom)}`}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Income tax ({d.tax.period === "annual" ? "a year" : "a month"}, {d.currency})</p>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {d.tax.bands.map(([width, rate], i) => {
                      const label = width == null ? `Above ${money(from)}` : `${money(from)} – ${money(from + width)}`;
                      if (width != null) from += width;
                      return <tr key={i}><td className="py-1.5 tabular-nums text-muted">{label}</td><td className="py-1.5 text-right font-medium tabular-nums text-ink">{rate}%</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-1.5 text-sm text-ink">
                {d.pension && <li>{String(d.pension.name)}: {d.pension.employee_percent}% employee, {d.pension.employer_percent}% employer, on basic + housing + transport</li>}
                {d.housing_fund && <li>{String(d.housing_fund.name)}: {d.housing_fund.employee_percent}% of basic</li>}
                {d.social_security && <li>{String(d.social_security.name)}: {d.social_security.employee_percent}% employee, {d.social_security.employer_percent}% employer, on basic</li>}
                {d.employer_levies?.map((l) => <li key={l.name}>{l.name}: {l.percent}% of gross, paid by the employer</li>)}
                {d.reliefs?.rent_percent && <li>Rent relief: {d.reliefs.rent_percent}% of annual rent, at most {money(d.reliefs.rent_cap)}</li>}
                {d.minimum_wage_annual && <li>No tax on employment income of {money(d.minimum_wage_annual)} a year or less (national minimum wage)</li>}
                <li className="pt-2 text-xs text-muted">Source: {p.source}</li>
              </ul>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function PayrollSettingsPage() {
  const [tab] = useSettingsTab(["groups", "components", "rules"] as const, "groups");
  const [{ data, error }, reload] = useQuery({ query: SettingsDocument });
  const [editing, setEditing] = useState<null | { group: Group | null } | { component: Component | null }>(null);
  const [saved, setSaved] = useState<string>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const refresh = (m: string) => { setEditing(null); setSaved(m); reload({ requestPolicy: "network-only" }); };
  const splitTotal = data.payComponents.filter((c) => ["basic", "housing", "transport"].includes(c.role) && c.isActive)
    .reduce((n, c) => n + Number(c.percentOfGross ?? 0), 0);

  return (
    <>
      {saved && <Notice tone="success">{saved}</Notice>}
      {tab === "groups" && (
        <>
          <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ group: null })}>New pay group</Button>}>
            Who is paid together, how often and when. Put people in groups from{" "}
            <Link href="/payroll?tab=people" className="font-medium text-brand-ink hover:underline">Payroll → People</Link>.
          </SettingsIntro>
          <Card flush>
            {data.payGroups.length ? (
              <Table>
                <thead><tr><TH>Group</TH><TH>Legal entity</TH><TH>How often</TH><TH>People</TH><TH align="right"><span className="sr-only">Edit</span></TH></tr></thead>
                <tbody>
                  {data.payGroups.map((g) => (
                    <tr key={g.id} className={g.isActive ? undefined : "text-muted"}>
                      <TD className="font-medium">{g.name}{!g.supported && <Badge tone="warn">No rules for {g.country} yet</Badge>}</TD>
                      <TD>{g.legalEntity} <span className="text-muted">({g.country}, {g.currency})</span></TD>
                      <TD>{g.frequency === "monthly" ? `Monthly, on the ${g.payDay}` : "Every two weeks"}</TD>
                      <TD className="tabular-nums">{g.memberCount}</TD>
                      <TD align="right"><IconButton label={`Edit ${g.name}`} onClick={() => setEditing({ group: g })}><FontAwesomeIcon icon={faPen} /></IconButton></TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p className="p-5 text-sm text-muted">No pay groups yet. Make one for each legal entity and pay frequency.</p>}
          </Card>
        </>
      )}
      {tab === "components" && (
        <>
          <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ component: null })}>New component</Button>}>
            How gross pay splits into basic, housing and transport (the rest is other allowances), and the extra allowances and deductions you can give people.
          </SettingsIntro>
          {splitTotal > 100 && <Notice tone="warning">Basic, housing and transport add up to {splitTotal}%. Keep them at 100% or less.</Notice>}
          <Card flush>
            <Table>
              <thead><tr><TH>Component</TH><TH>Type</TH><TH>Share of gross</TH><TH>Taxable</TH><TH>Pension</TH><TH align="right"><span className="sr-only">Edit</span></TH></tr></thead>
              <tbody>
                {data.payComponents.map((c) => (
                  <tr key={c.id} className={c.isActive ? undefined : "text-muted"}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{c.kind === "earning" ? "Earning" : "Deduction"}{c.role !== "extra" && <span className="block text-xs text-muted">Salary split</span>}</TD>
                    <TD className="tabular-nums">{c.role === "other" ? `${Math.max(0, 100 - splitTotal)}% (the rest)` : c.percentOfGross != null ? `${Number(c.percentOfGross)}%` : "Per person"}</TD>
                    <TD>{c.kind === "earning" ? (c.taxable ? "Yes" : "No") : "—"}</TD>
                    <TD>{c.pensionable ? "Yes" : "—"}</TD>
                    <TD align="right"><IconButton label={`Edit ${c.name}`} onClick={() => setEditing({ component: c })}><FontAwesomeIcon icon={faPen} /></IconButton></TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
      {tab === "rules" && (
        <>
          <SettingsIntro>The statutory rules payroll uses, by country. New versions are added when the law changes; past payslips keep the rules they used.</SettingsIntro>
          <Rules data={data} />
        </>
      )}
      {editing && "group" in editing && <GroupDialog group={editing.group} data={data} onClose={() => setEditing(null)} onSaved={() => refresh("Pay group saved.")} />}
      {editing && "component" in editing && <ComponentDialog component={editing.component} onClose={() => setEditing(null)} onSaved={() => refresh("Component saved.")} />}
    </>
  );
}
