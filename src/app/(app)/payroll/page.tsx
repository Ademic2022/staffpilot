"use client";

import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Loans } from "@/components/payroll/Loans";
import { RUN_STATUS } from "@/components/payroll/status";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, PageHeader, SearchInput, Select, Table, Tabs, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { PayrollHomeQuery, PayrollPeopleQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const HomeDocument = graphql(`
  query PayrollHome {
    payrollRuns { id payGroup currency periodStart periodEnd payDate status offCycle headcount gross net warnings published canApprove }
    payGroups { id name frequency isActive supported }
  }
`);

const PeopleDocument = graphql(`
  query PayrollPeople {
    payrollPeople { employeeId payGroupId taxState pensionProvider socialSecurityNumber nhfNumber contributesNhf pensionExempt annualRent annualLifeInsurance voluntaryPensionPercent }
    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName employeeNumber department { name } } }
    payGroups { id name isActive }
    payComponents { id name kind role isActive }
  }
`);

const CreateRunDocument = graphql(`
  mutation CreatePayrollRun($group: ID!, $start: Date!, $offCycle: Boolean!, $note: String!) {
    createPayrollRun(payGroupId: $group, periodStart: $start, offCycle: $offCycle, note: $note) { run { id } errors { field message } }
  }
`);
const AssignDocument = graphql(`
  mutation AssignPayGroup($ids: [ID!]!, $group: ID) { assignPayGroup(employeeIds: $ids, payGroupId: $group) }
`);
const SaveProfileDocument = graphql(`
  mutation SavePayrollProfile($input: PayrollProfileInput!) { savePayrollProfile(input: $input) { profile { employeeId } errors { field message } } }
`);
const ItemsDocument = graphql(`
  query PayItems($id: ID!) { payItems(employeeId: $id) { id componentId component kind amount startDate endDate note } }
`);
const SaveItemDocument = graphql(`
  mutation SavePayItem($input: PayItemInput!) { savePayItem(input: $input) { item { id } errors { field message } } }
`);
const DeleteItemDocument = graphql(`mutation DeletePayItem($id: ID!) { deletePayItem(id: $id) }`);

function NewRunDialog({ groups, onClose }: { groups: PayrollHomeQuery["payGroups"]; onClose: () => void }) {
  const router = useRouter();
  const active = groups.filter((g) => g.isActive && g.supported);
  const [group, setGroup] = useState(active[0]?.id ?? "");
  const [start, setStart] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; });
  const [offCycle, setOffCycle] = useState(false);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, create] = useMutation(CreateRunDocument);
  return (
    <Dialog open onClose={onClose} title="New payroll" description="Works out everyone's pay for the period from their pay records, leave and payroll details."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} disabled={!group} onClick={async () => {
          const r = await create({ group, start, offCycle, note });
          const problems = r.data?.createPayrollRun.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else router.push(`/payroll/runs/${r.data?.createPayrollRun.run?.id}`);
        }}>Work it out</Button></>}>
      <div className="space-y-4">
        {errors[""] && <ErrorNote error={errors[""]} />}
        {!active.length && <Notice tone="warning">Make a pay group first, in Settings → Payroll.</Notice>}
        <Field label="Pay group" error={errors.payGroup}>
          <Select value={group} onChange={(e) => setGroup(e.target.value)}>{active.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select>
        </Field>
        <Field label="A day in the period" error={errors.periodStart} hint="The pay period that contains this day is used.">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Checkbox label="Off-cycle payroll" description="An extra run in the same period, for back pay or corrections." checked={offCycle} onChange={setOffCycle} />
        <Field label="Note" optional><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}

function Runs() {
  const { can } = useSession();
  const [{ data, error }] = useQuery({ query: HomeDocument, requestPolicy: "cache-and-network" });
  const [creating, setCreating] = useState(false);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  return (
    <>
      <Card flush title="Payroll runs" actions={can(PERMS.payrollManage) ? <Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreating(true)}>New payroll</Button> : undefined}>
        {data.payrollRuns.length ? (
          <Table>
            <thead><tr><TH>Period</TH><TH>Pay group</TH><TH>People</TH><TH align="right">Gross</TH><TH align="right">Net</TH><TH>Status</TH></tr></thead>
            <tbody>
              {data.payrollRuns.map((r) => (
                <tr key={r.id} className="transition hover:bg-subtle/50">
                  <TD><Link href={`/payroll/runs/${r.id}`} className="font-medium text-brand-ink hover:underline">{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</Link>
                    <span className="block text-xs text-muted">Pay day {formatDate(r.payDate)}{r.offCycle ? " · off-cycle" : ""}</span></TD>
                  <TD>{r.payGroup}</TD>
                  <TD className="tabular-nums">{r.headcount}{r.warnings > 0 && <Badge tone="warn">{r.warnings} to check</Badge>}</TD>
                  <TD align="right" className="tabular-nums">{formatMoney(String(r.gross), r.currency)}</TD>
                  <TD align="right" className="tabular-nums">{formatMoney(String(r.net), r.currency)}</TD>
                  <TD><Badge tone={RUN_STATUS[r.status]?.tone ?? "neutral"} dot>{RUN_STATUS[r.status]?.label ?? r.status}</Badge>
                    {r.canApprove && <span className="block text-xs font-medium text-amber-700 dark:text-amber-300">Yours to approve</span>}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No payrolls yet. Set up pay groups in Settings → Payroll, put people in them, then start a payroll.</p>}
      </Card>
      {creating && <NewRunDialog groups={data.payGroups} onClose={() => setCreating(false)} />}
    </>
  );
}

type PeopleData = PayrollPeopleQuery;
type Profile = PeopleData["payrollPeople"][number];

function DetailsDialog({ profile, name, data, onClose, onSaved }: { profile: Profile; name: string; data: PeopleData; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    payGroupId: profile.payGroupId ?? "", taxState: profile.taxState, pensionProvider: profile.pensionProvider, socialSecurityNumber: profile.socialSecurityNumber,
    nhfNumber: profile.nhfNumber, contributesNhf: profile.contributesNhf, pensionExempt: profile.pensionExempt,
    annualRent: profile.annualRent ?? "", annualLifeInsurance: profile.annualLifeInsurance ?? "", voluntaryPensionPercent: profile.voluntaryPensionPercent ?? "",
  });
  const [problem, setProblem] = useState<string>();
  const [{ data: items }, reloadItems] = useQuery({ query: ItemsDocument, variables: { id: profile.employeeId } });
  const [item, setItem] = useState({ componentId: "", amount: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", note: "" });
  const [, saveProfile] = useMutation(SaveProfileDocument);
  const [, saveItem] = useMutation(SaveItemDocument);
  const [, deleteItem] = useMutation(DeleteItemDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  const extras = data.payComponents.filter((c) => c.role === "extra" && c.isActive);
  const num = (x: unknown) => (x === "" || x == null ? null : String(x));

  return (
    <Dialog open wide onClose={onClose} title={`Payroll details: ${name}`} description="Tax ID, pension PIN and bank account are in the person's Bank and ID details."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={async () => {
          const r = await saveProfile({ input: { employeeId: profile.employeeId, payGroupId: v.payGroupId || null, taxState: v.taxState,
            pensionProvider: v.pensionProvider, socialSecurityNumber: v.socialSecurityNumber, nhfNumber: v.nhfNumber, contributesNhf: v.contributesNhf,
            pensionExempt: v.pensionExempt, annualRent: num(v.annualRent), annualLifeInsurance: num(v.annualLifeInsurance), voluntaryPensionPercent: num(v.voluntaryPensionPercent) } });
          const p = errorMessage(r.error) ?? r.data?.savePayrollProfile.errors[0]?.message;
          if (p) setProblem(p); else onSaved();
        }}>Save</Button></>}>
      <div className="space-y-5">
        {problem && <ErrorNote error={problem} />}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pay group"><Select value={v.payGroupId} onChange={(e) => set("payGroupId", e.target.value)}>
            <option value="">Not paid through payroll</option>{data.payGroups.filter((g) => g.isActive).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select></Field>
          <Field label="State of residence" optional hint="Nigeria: the state that receives PAYE."><Input value={v.taxState} onChange={(e) => set("taxState", e.target.value)} /></Field>
          <Field label="Pension provider" optional><Input value={v.pensionProvider} onChange={(e) => set("pensionProvider", e.target.value)} /></Field>
          <Field label="NHF number" optional><Input value={v.nhfNumber} onChange={(e) => set("nhfNumber", e.target.value)} /></Field>
          <Field label="SSNIT number" optional hint="Ghana."><Input value={v.socialSecurityNumber} onChange={(e) => set("socialSecurityNumber", e.target.value)} /></Field>
          <Field label="Voluntary pension (%)" optional><Input inputMode="decimal" value={String(v.voluntaryPensionPercent)} onChange={(e) => set("voluntaryPensionPercent", e.target.value)} /></Field>
          <Field label="Annual rent" optional hint="Nigeria: 20% of it, up to ₦500,000, reduces tax."><Input inputMode="decimal" value={String(v.annualRent)} onChange={(e) => set("annualRent", e.target.value)} /></Field>
          <Field label="Annual life insurance" optional><Input inputMode="decimal" value={String(v.annualLifeInsurance)} onChange={(e) => set("annualLifeInsurance", e.target.value)} /></Field>
          <div className="space-y-2 pt-6">
            <Checkbox label="Pays NHF" checked={v.contributesNhf} onChange={(c) => set("contributesNhf", c)} />
            <Checkbox label="Not in the pension scheme" checked={v.pensionExempt} onChange={(c) => set("pensionExempt", c)} />
          </div>
        </div>
        <section>
          <h3 className="mb-2 text-[15px] font-semibold text-ink">Extra allowances and deductions</h3>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {(items?.payItems ?? []).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span><span className="font-medium text-ink">{i.component}</span> <span className="text-muted">{Number(i.amount).toLocaleString()} a month from {formatDate(i.startDate)}{i.endDate ? ` to ${formatDate(i.endDate)}` : ""}</span></span>
                <IconButton label="Remove" onClick={async () => { await deleteItem({ id: i.id }); reloadItems({ requestPolicy: "network-only" }); }}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
              </li>
            ))}
            {!items?.payItems.length && <li className="px-3 py-3 text-sm text-muted">None.</li>}
          </ul>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Component"><Select value={item.componentId} onChange={(e) => setItem({ ...item, componentId: e.target.value })} className="w-48">
              <option value="">Choose…</option>{extras.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.kind === "earning" ? "earning" : "deduction"})</option>)}
            </Select></Field>
            <Field label="A month"><Input inputMode="decimal" value={item.amount} onChange={(e) => setItem({ ...item, amount: e.target.value })} className="w-32" /></Field>
            <Field label="From"><Input type="date" value={item.startDate} onChange={(e) => setItem({ ...item, startDate: e.target.value })} /></Field>
            <Field label="To" optional><Input type="date" value={item.endDate} onChange={(e) => setItem({ ...item, endDate: e.target.value })} /></Field>
            <Button variant="secondary" disabled={!item.componentId || !item.amount} onClick={async () => {
              const r = await saveItem({ input: { employeeId: profile.employeeId, componentId: item.componentId, amount: item.amount.replace(/,/g, ""),
                startDate: item.startDate, endDate: item.endDate || null, note: item.note } });
              const p = errorMessage(r.error) ?? r.data?.savePayItem.errors[0]?.message;
              if (p) setProblem(p); else { setItem({ ...item, componentId: "", amount: "" }); reloadItems({ requestPolicy: "network-only" }); }
            }}>Add</Button>
          </div>
          {!extras.length && <p className="mt-2 text-xs text-muted">Add components such as a meal allowance or a loan repayment in Settings → Payroll → Pay components.</p>}
        </section>
      </div>
    </Dialog>
  );
}

function People() {
  const [{ data, error }, reload] = useQuery({ query: PeopleDocument });
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkGroup, setBulkGroup] = useState("");
  const [editing, setEditing] = useState<{ profile: Profile; name: string } | null>(null);
  const [, assign] = useMutation(AssignDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const profiles = new Map(data.payrollPeople.map((p) => [p.employeeId, p]));
  const groupName = (id?: string | null) => data.payGroups.find((g) => g.id === id)?.name;
  const q = search.trim().toLowerCase();
  const people = data.employees.nodes.filter((e) => !q || e.fullName.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q));
  const refresh = () => { setPicked(new Set()); reload({ requestPolicy: "network-only" }); };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64"><SearchInput aria-label="Search people" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {picked.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{picked.size} selected:</span>
            <Select aria-label="Pay group" value={bulkGroup} onChange={(e) => setBulkGroup(e.target.value)} className="w-48">
              <option value="">No pay group</option>{data.payGroups.filter((g) => g.isActive).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <Button size="sm" onClick={async () => { await assign({ ids: [...picked], group: bulkGroup || null }); refresh(); }}>Put in group</Button>
          </div>
        )}
      </div>
      <Card flush>
        <Table>
          <thead><tr><TH><span className="sr-only">Select</span></TH><TH>Employee</TH><TH>Pay group</TH><TH>Extras</TH><TH align="right"><span className="sr-only">Edit</span></TH></tr></thead>
          <tbody>
            {people.map((e) => {
              const p = profiles.get(e.id);
              return (
                <tr key={e.id}>
                  <TD><input type="checkbox" aria-label={`Select ${e.fullName}`} className="h-4 w-4 accent-[var(--brand)]" checked={picked.has(e.id)}
                    onChange={() => { const next = new Set(picked); if (next.has(e.id)) next.delete(e.id); else next.add(e.id); setPicked(next); }} /></TD>
                  <TD className="font-medium">{e.fullName}<span className="block text-xs font-normal text-muted">{e.employeeNumber}{e.department ? ` · ${e.department.name}` : ""}</span></TD>
                  <TD>{groupName(p?.payGroupId) ?? <span className="text-muted">Not in payroll</span>}</TD>
                  <TD className="text-xs text-muted">{p?.annualRent ? "Rent relief" : ""}{p && !p.contributesNhf ? " · No NHF" : ""}{p?.pensionExempt ? " · No pension" : ""}</TD>
                  <TD align="right">{p && <IconButton label={`Payroll details for ${e.fullName}`} onClick={() => setEditing({ profile: p, name: e.fullName })}><FontAwesomeIcon icon={faPen} /></IconButton>}</TD>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      {editing && <DetailsDialog profile={editing.profile} name={editing.name} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </>
  );
}

function Payroll() {
  const { can, tenant } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const asked = params.get("tab");
  const tab = (asked === "people" || asked === "loans") && can(PERMS.payrollManage) ? asked : "runs";
  if (!can(PERMS.payrollManage, PERMS.payrollApprove)) return <Notice tone="warning">You do not have access to payroll.</Notice>;
  if (!tenant?.payrollEnabled) {
    return (
      <>
        <PageHeader title="Payroll" />
        <Notice title="Payroll is switched off">
          Your company does not run payroll in StaffPilot. {can(PERMS.tenantManage) ? "Switch it on in Settings → Company → General settings." : "An owner can switch it on in Settings → Company."}
        </Notice>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Payroll" subtitle="Work out pay, check it, have someone else approve it, then publish payslips and pay." />
      <Tabs value={tab} onChange={(t) => router.replace(`${pathname}?tab=${t}`)} tabs={[
        { key: "runs", label: "Payroll runs" },
        ...(can(PERMS.payrollManage) ? [{ key: "people" as const, label: "People" }, { key: "loans" as const, label: "Loans and advances" }] : []),
      ]} />
      {tab === "runs" ? <Runs /> : tab === "people" ? <People /> : <Loans />}
    </>
  );
}

export default function PayrollPage() {
  return <Suspense fallback={<Loading />}><Payroll /></Suspense>;
}
