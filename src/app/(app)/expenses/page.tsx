"use client";

import { faDownload, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQuery } from "urql";

import { claimStatus, FLAG } from "@/components/expenses/shared";
import {
  Badge, Button, buttonClass, Card, Dialog, Empty, ErrorNote, Field, Input, Loading, Notice, PageHeader, SearchInput, Select, Tabs,
} from "@/components/ui";
import { graphql } from "@/gql";
import type { ClaimRowFieldsFragment } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const MineDocument = graphql(`query MyExpenseClaims { myExpenseClaims { ...ClaimRowFields } expenseSettings { enabled payVia } }`);
const ToApproveDocument = graphql(`query ExpensesToApprove { expensesToApprove { ...ClaimRowFields } }`);
const AllDocument = graphql(`
  query ExpenseClaims($status: String, $search: String!) { expenseClaims(status: $status, search: $search) { ...ClaimRowFields } }
`);
const CreateDocument = graphql(`
  mutation CreateExpenseClaim($title: String!) { createExpenseClaim(title: $title) { claim { id } errors { field message } } }
`);
const PaidDocument = graphql(`mutation MarkExpenseClaimsPaid($ids: [ID!]!, $reference: String!) { markExpenseClaimsPaid(ids: $ids, reference: $reference) }`);

type Claim = ClaimRowFieldsFragment;

function ClaimRow({ c, showPerson, select }: { c: Claim; showPerson?: boolean; select?: { checked: boolean; onChange: (v: boolean) => void } }) {
  const s = claimStatus(c.status, c.stage);
  return (
    <li className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/50">
      {select && <input type="checkbox" aria-label={`Select ${c.title}`} checked={select.checked} onChange={(e) => select.onChange(e.target.checked)}
        className="size-4 accent-[var(--color-brand)]" />}
      <Link href={`/expenses/${c.id}`} className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[1fr_140px_170px] sm:items-center">
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{showPerson ? `${c.employeeName} · ${c.title}` : c.title}</span>
          <span className="block truncate text-xs text-muted">
            {[c.submittedAt ? `Submitted ${formatDate(c.submittedAt)}` : `Started ${formatDate(c.createdAt)}`, `${c.linesCount} item${c.linesCount === 1 ? "" : "s"}`,
              c.payrollPeriod && `paid with ${c.payrollPeriod} payroll`, c.status === "submitted" && c.approverName && `with ${c.approverName}`].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="text-sm font-medium tabular-nums text-ink sm:text-right">{formatMoney(c.total, c.currency)}</span>
        <span className="flex flex-wrap gap-1 sm:justify-end">
          {c.flags.filter((f) => f !== "no_receipt" || c.status === "draft").map((f) => <Badge key={f} tone="warn">{FLAG[f] ?? f}</Badge>)}
          <Badge tone={s.tone} dot>{s.label}</Badge>
        </span>
      </Link>
    </li>
  );
}

function NewClaim({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [{ fetching }, create] = useMutation(CreateDocument);
  const [error, setError] = useState<string>();
  const submit = async () => {
    const res = await create({ title });
    const msg = res.error ? errorMessage(res.error) : res.data?.createExpenseClaim.errors[0]?.message;
    if (msg) return setError(msg);
    router.push(`/expenses/${res.data!.createExpenseClaim.claim!.id}`);
  };
  return (
    <Dialog open onClose={onClose} title="New expense claim" description="Group expenses from one trip or one month into a claim."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button busy={fetching} onClick={submit}>Start claim</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Name" error={error}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Abuja client visit" /></Field>
      </form>
    </Dialog>
  );
}

function Mine() {
  const [{ data, error }] = useQuery({ query: MineDocument, requestPolicy: "cache-and-network" });
  const [creating, setCreating] = useState(false);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  if (!data.expenseSettings.enabled) return <Notice title="Expenses are off">Your company has not switched on expense claims.</Notice>;
  const open = data.myExpenseClaims.filter((c) => ["draft", "submitted", "approved"].includes(c.status));
  const done = data.myExpenseClaims.filter((c) => !open.includes(c));
  return (
    <div className="grid gap-5">
      <Card flush title="Open claims" description={data.expenseSettings.payVia === "payroll" ? "Approved claims are paid back with your next pay." : "Approved claims are paid back by bank transfer."}
        actions={<Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreating(true)}>New claim</Button>}>
        {open.length ? <ul className="divide-y divide-line">{open.map((c) => <ClaimRow key={c.id} c={c} />)}</ul>
          : <Empty title="Nothing open">Spent your own money on work? Start a claim and add each receipt.</Empty>}
      </Card>
      {done.length > 0 && <Card flush title="Earlier"><ul className="divide-y divide-line">{done.map((c) => <ClaimRow key={c.id} c={c} />)}</ul></Card>}
      {creating && <NewClaim onClose={() => setCreating(false)} />}
    </div>
  );
}

function ToApprove() {
  const [{ data, error }] = useQuery({ query: ToApproveDocument, requestPolicy: "cache-and-network" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  return (
    <Card flush title="Waiting for you" description="Open a claim to check its receipts, then approve, send it back or reject it.">
      {data.expensesToApprove.length ? <ul className="divide-y divide-line">{data.expensesToApprove.map((c) => <ClaimRow key={c.id} c={c} showPerson />)}</ul>
        : <p className="px-5 py-4 text-sm text-muted">Nothing waiting.</p>}
    </Card>
  );
}

function All() {
  const { can } = useSession();
  const finance = can(PERMS.expensesManage);
  const [status, setStatus] = useState(finance ? "to_pay" : "");
  const [search, setSearch] = useState("");
  const [{ data, error }, reload] = useQuery({ query: AllDocument, variables: { status: status || null, search }, requestPolicy: "cache-and-network" });
  const [picked, setPicked] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [reference, setReference] = useState("");
  const [{ fetching, error: payError }, pay] = useMutation(PaidDocument);
  const [message, setMessage] = useState<string>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  const rows = data?.expenseClaims ?? [];
  const payable = rows.filter((c) => c.canPay);
  return (
    <div className="grid gap-4">
      {message && <Notice tone="success">{message}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPicked([]); }} className="w-52">
          <option value="">Every claim</option>
          <option value="submitted">Waiting for approval</option>
          <option value="to_pay">Approved, to be paid</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </Select>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by person or claim" className="w-64" />
        {finance && (
          <span className="ml-auto flex flex-wrap gap-2">
            <a className={buttonClass("secondary", "sm")} href="/api/expenses/export/lines.xlsx"><FontAwesomeIcon icon={faDownload} /> Accounting export</a>
            <a className={buttonClass("secondary", "sm")} href="/api/expenses/export/bank.csv"><FontAwesomeIcon icon={faDownload} /> Bank file</a>
          </span>
        )}
      </div>
      {finance && payable.length > 0 && (
        <Notice title={`${payable.length} approved claim${payable.length === 1 ? "" : "s"} to pay separately`}>
          Claims paid through payroll are settled when the payroll is approved. Pay the others by transfer, then record them here.
          <span className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPicked(picked.length === payable.length ? [] : payable.map((c) => c.id))}>
              {picked.length === payable.length ? "Clear" : "Select all"}
            </Button>
            <Button size="sm" disabled={!picked.length} onClick={() => setPaying(true)}>Record {picked.length || ""} as paid</Button>
          </span>
        </Notice>
      )}
      <Card flush>
        {!data ? <Loading shape="list" /> : rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((c) => <ClaimRow key={c.id} c={c} showPerson select={c.canPay ? {
              checked: picked.includes(c.id), onChange: (on) => setPicked(on ? [...picked, c.id] : picked.filter((x) => x !== c.id)),
            } : undefined} />)}
          </ul>
        ) : <p className="px-5 py-4 text-sm text-muted">No claims here.</p>}
      </Card>
      <Dialog open={paying} onClose={() => setPaying(false)} title={`Record ${picked.length} claim${picked.length === 1 ? "" : "s"} as paid`}
        description="Each person is told their claim was paid."
        footer={<><Button variant="secondary" onClick={() => setPaying(false)}>Cancel</Button>
          <Button busy={fetching} onClick={async () => {
            const res = await pay({ ids: picked, reference });
            if (res.error) return;
            setPaying(false); setPicked([]); setReference("");
            setMessage(`Recorded ${res.data?.markExpenseClaimsPaid} as paid.`);
            reload({ requestPolicy: "network-only" });
          }}>Record payment</Button></>}>
        {payError && <ErrorNote error={errorMessage(payError)} />}
        <Field label="Payment reference" optional><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transfer batch or bank reference" /></Field>
      </Dialog>
    </div>
  );
}

type Tab = "mine" | "approve" | "all";

function Expenses() {
  const { can, me } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [{ data: waiting }] = useQuery({ query: ToApproveDocument, requestPolicy: "cache-and-network" });
  const finance = can(PERMS.expensesManage);
  const lead = finance || me?.roles.includes("manager");
  const tabs: { key: Tab; label: string; count?: number }[] = [
    ...(me?.employee ? [{ key: "mine" as const, label: "My claims" }] : []),
    ...(lead || waiting?.expensesToApprove.length ? [{ key: "approve" as const, label: "To approve", count: waiting?.expensesToApprove.length || undefined }] : []),
    ...(lead ? [{ key: "all" as const, label: finance ? "All claims" : "My team" }] : []),
  ];
  const asked = params.get("tab") as Tab | null;
  const tab = tabs.some((t) => t.key === asked) ? asked! : tabs[0]?.key ?? "mine";
  return (
    <>
      <PageHeader title="Expenses" subtitle="Claim back what you spend on work, with a receipt for each item." />
      <Tabs value={tab} onChange={(t) => router.replace(`${pathname}?tab=${t}`)} tabs={tabs} />
      {tab === "mine" ? <Mine /> : tab === "approve" ? <ToApprove /> : <All />}
    </>
  );
}

export default function ExpensesPage() {
  return <Suspense fallback={<Loading shape="list" />}><Expenses /></Suspense>;
}
