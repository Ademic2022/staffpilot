"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, Button, Card, Dialog, ErrorNote, Field, Input, Loading, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const LoansDocument = graphql(`
  query PayrollLoans {
    loans { id employeeId employeeName kind amount instalment firstDeduction reason status outstanding repaid }
    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }
  }
`);
const SaveDocument = graphql(`
  mutation SaveLoan($input: LoanInput!) { saveLoan(input: $input) { loan { id } errors { field message } } }
`);
const CloseDocument = graphql(`
  mutation CloseLoan($id: ID!, $repaid: Boolean!) { closeLoan(id: $id, repaid: $repaid) { id status } }
`);

const n = (v: unknown) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STATUS = { active: { label: "Being repaid", tone: "warn" as const }, settled: { label: "Repaid", tone: "good" as const }, cancelled: { label: "Cancelled", tone: "neutral" as const } };

function NewLoan({ people, onClose, onSaved }: { people: { id: string; fullName: string }[]; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ employeeId: people[0]?.id ?? "", kind: "loan", amount: "", instalment: "", firstDeduction: new Date().toISOString().slice(0, 10), reason: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  const periods = Number(v.amount) && Number(v.instalment) ? Math.ceil(Number(v.amount) / Number(v.instalment)) : 0;
  return (
    <Dialog open onClose={onClose} title="New loan or advance" description="Paid out outside payroll; repaid from net pay each period. Anyone leaving repays the rest from their last pay."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { ...v, amount: v.amount.replace(/,/g, ""), instalment: v.instalment.replace(/,/g, "") } });
          const problems = r.data?.saveLoan.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Employee"><Select value={v.employeeId} onChange={(e) => set("employeeId", e.target.value)}>{people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</Select></Field>
        <Field label="Type"><Select value={v.kind} onChange={(e) => set("kind", e.target.value)}><option value="loan">Loan</option><option value="advance">Salary advance</option></Select></Field>
        <Field label="Amount" error={errors.amount}><Input inputMode="decimal" value={v.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Taken each period" error={errors.instalment} hint={periods ? `Repaid in ${periods} ${periods === 1 ? "period" : "periods"}.` : undefined}>
          <Input inputMode="decimal" value={v.instalment} onChange={(e) => set("instalment", e.target.value)} />
        </Field>
        <Field label="First repayment in the period containing"><Input type="date" value={v.firstDeduction} onChange={(e) => set("firstDeduction", e.target.value)} /></Field>
        <Field label="Reason" optional><Input value={v.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}

export function Loans() {
  const [{ data, error }, reload] = useQuery({ query: LoansDocument });
  const [adding, setAdding] = useState(false);
  const [, close] = useMutation(CloseDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const refresh = () => reload({ requestPolicy: "network-only" });
  return (
    <>
      <Card flush title="Loans and salary advances" actions={<Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setAdding(true)}>New</Button>}>
        {data.loans.length ? (
          <Table>
            <thead><tr><TH>Employee</TH><TH>Type</TH><TH align="right">Amount</TH><TH align="right">Each period</TH><TH align="right">Still owed</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.loans.map((l) => (
                <tr key={l.id}>
                  <TD className="font-medium">{l.employeeName}{l.reason && <span className="block text-xs font-normal text-muted">{l.reason}</span>}</TD>
                  <TD>{l.kind === "advance" ? "Salary advance" : "Loan"}<span className="block text-xs text-muted">From {formatDate(l.firstDeduction)}</span></TD>
                  <TD align="right" className="tabular-nums">{n(l.amount)}</TD>
                  <TD align="right" className="tabular-nums">{n(l.instalment)}</TD>
                  <TD align="right" className="tabular-nums font-medium">{n(l.outstanding)}</TD>
                  <TD><Badge tone={STATUS[l.status as keyof typeof STATUS]?.tone ?? "neutral"} dot>{STATUS[l.status as keyof typeof STATUS]?.label ?? l.status}</Badge></TD>
                  <TD align="right" className="whitespace-nowrap">{l.status === "active" && <>
                    <Button size="sm" variant="ghost" onClick={async () => { await close({ id: l.id, repaid: true }); refresh(); }}>Repaid outside payroll</Button>
                    <Button size="sm" variant="ghost" onClick={async () => { await close({ id: l.id, repaid: false }); refresh(); }}>Cancel</Button>
                  </>}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No loans or advances.</p>}
      </Card>
      {adding && <NewLoan people={data.employees.nodes} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); refresh(); }} />}
    </>
  );
}

const MyLoansDocument = graphql(`
  query MyLoans { myLoans { id kind amount outstanding status } }
`);

/** On My payslips: what you still owe on loans and advances. */
export function MyLoans() {
  const [{ data }] = useQuery({ query: MyLoansDocument });
  const active = (data?.myLoans ?? []).filter((l) => l.status === "active");
  if (!active.length) return null;
  return (
    <Card title="Loans and advances">
      <ul className="space-y-1.5 text-sm">
        {active.map((l) => (
          <li key={l.id} className="flex justify-between gap-3"><span className="text-ink">{l.kind === "advance" ? "Salary advance" : "Loan"} of {n(l.amount)}</span>
            <span className="tabular-nums text-muted">{n(l.outstanding)} still to repay</span></li>
        ))}
      </ul>
    </Card>
  );
}
