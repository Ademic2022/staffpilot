"use client";

import { faCamera, faPaperclip, faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "urql";

import { ACTION, claimStatus, FLAG } from "@/components/expenses/shared";
import { ActionDialog, Badge, Button, Card, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, PageHeader, Select } from "@/components/ui";
import { graphql } from "@/gql";
import type { ExpenseClaimQuery } from "@/gql/graphql";
import { errorMessage, postForm } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

const ClaimDocument = graphql(`
  query ExpenseClaim($id: ID!) {
    expenseClaim(id: $id) {
      ...ClaimRowFields
      lines { id categoryId categoryName date description amount distanceKm receiptName receiptUrl flags }
      actions { id actor action stage note createdAt }
    }
    expenseCategories { id name description limitPerItem limitPerMonth receiptRequired mileageRate }
    expenseSettings { receiptOver maxAgeDays payVia }
  }
`);
const RenameDocument = graphql(`mutation RenameExpenseClaim($id: ID!, $title: String!) { renameExpenseClaim(id: $id, title: $title) { claim { id title } errors { message } } }`);
const DeleteLineDocument = graphql(`mutation DeleteExpenseLine($id: ID!) { deleteExpenseLine(id: $id) { claim { id total } errors { message } } }`);
const SubmitDocument = graphql(`mutation SubmitExpenseClaim($id: ID!) { submitExpenseClaim(id: $id) { claim { id status } errors { message } } }`);
const WithdrawDocument = graphql(`mutation WithdrawExpenseClaim($id: ID!) { withdrawExpenseClaim(id: $id) { claim { id status } errors { message } } }`);
const DecideDocument = graphql(`
  mutation DecideExpenseClaim($id: ID!, $action: String!, $note: String!) {
    decideExpenseClaim(id: $id, action: $action, note: $note) { claim { id status stage } errors { field message } }
  }
`);

type Data = ExpenseClaimQuery;
type Line = Data["expenseClaim"]["lines"][number];

function LineEditor({ claimId, line, data, onClose, onSaved }: { claimId: string; line?: Line; data: Data; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState({
    category: line?.categoryId ?? data.expenseCategories[0]?.id ?? "", date: line?.date ?? today, description: line?.description ?? "",
    amount: line && !line.distanceKm ? String(line.amount) : "", distanceKm: line?.distanceKm ? String(line.distanceKm) : "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const cat = data.expenseCategories.find((c) => c.id === v.category);
  const mileage = Boolean(cat?.mileageRate);
  const currency = data.expenseClaim.currency;
  const submit = async () => {
    setBusy(true);
    const form = new FormData();
    form.set("claim", claimId);
    if (line) form.set("line", line.id);
    form.set("category", v.category);
    form.set("date", v.date);
    form.set("description", v.description);
    form.set(mileage ? "distanceKm" : "amount", mileage ? v.distanceKm : v.amount);
    if (file) form.set("receipt", file);
    if (removeReceipt) form.set("removeReceipt", "true");
    const res = await postForm<{ line?: { id: string } }>("/api/expenses/lines/", form);
    setBusy(false);
    if (res.errors?.length) return setErrors(Object.fromEntries(res.errors.map((e) => [e.field ?? "", e.message])));
    onSaved();
  };
  const hasReceipt = (line?.receiptName && !removeReceipt) || file;
  return (
    <Dialog open onClose={onClose} wide title={line ? "Edit expense" : "Add an expense"}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={submit}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Category" error={errors.category}
          hint={cat && [cat.description, cat.limitPerItem && `Up to ${formatMoney(String(cat.limitPerItem), currency)} an item`,
            cat.limitPerMonth && `${formatMoney(String(cat.limitPerMonth), currency)} a month`].filter(Boolean).join(" · ")}>
          <Select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
            {data.expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Date" error={errors.date}><Input type="date" max={today} value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label="What was it for" error={errors.description}>
            <Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Taxi from the airport to the client" />
          </Field>
        </div>
        {mileage ? (
          <Field label="Distance (km)" error={errors.distanceKm ?? errors.distance_km}
            hint={`${formatMoney(String(cat!.mileageRate), currency)} a km${v.distanceKm ? ` = ${formatMoney(String(Number(v.distanceKm) * Number(cat!.mileageRate)), currency)}` : ""}`}>
            <Input inputMode="decimal" value={v.distanceKm} onChange={(e) => setV({ ...v, distanceKm: e.target.value })} />
          </Field>
        ) : (
          <Field label={`Amount (${currency})`} error={errors.amount}>
            <Input inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} placeholder="0.00" />
          </Field>
        )}
        {!mileage && (
          <Field group label="Receipt" optional={!cat?.receiptRequired} error={errors.receipt}
            hint={cat?.receiptRequired && data.expenseSettings.receiptOver && Number(data.expenseSettings.receiptOver) > 0
              ? `Needed above ${formatMoney(String(data.expenseSettings.receiptOver), currency)}.` : "A photo or PDF."}>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <input ref={picker} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faCamera} />} onClick={() => camera.current?.click()} className="sm:hidden">Take photo</Button>
              <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPaperclip} />} onClick={() => picker.current?.click()}>
                {hasReceipt ? "Replace" : "Choose file"}
              </Button>
              {hasReceipt && (
                <span className="flex items-center gap-1 text-sm text-ink">
                  <span className="max-w-40 truncate">{file?.name ?? line?.receiptName}</span>
                  <IconButton label="Remove receipt" onClick={() => { setFile(null); setRemoveReceipt(true); }}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
                </span>
              )}
            </div>
          </Field>
        )}
      </div>
    </Dialog>
  );
}

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [{ data, error }, reload] = useQuery({ query: ClaimDocument, variables: { id }, requestPolicy: "cache-and-network" });
  const [, rename] = useMutation(RenameDocument);
  const [, deleteLine] = useMutation(DeleteLineDocument);
  const [{ fetching: submitting }, submit] = useMutation(SubmitDocument);
  const [, withdraw] = useMutation(WithdrawDocument);
  const [, decide] = useMutation(DecideDocument);
  const [editing, setEditing] = useState<Line | "new" | null>(null);
  const [problem, setProblem] = useState<string>();
  const [title, setTitle] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<"approve" | "return" | "reject" | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const c = data.expenseClaim;
  const draft = c.mine && c.status === "draft";
  const refresh = () => reload({ requestPolicy: "network-only" });
  const s = claimStatus(c.status, c.stage);
  const send = async () => {
    setProblem(undefined);
    const res = await submit({ id: c.id });
    const msg = res.error ? errorMessage(res.error) : res.data?.submitExpenseClaim.errors[0]?.message;
    if (msg) setProblem(msg);
    refresh();
  };
  return (
    <>
      <PageHeader title={c.title} back={{ href: "/expenses", label: "Expenses" }}
        subtitle={<>
          {!c.mine && <span>{c.employeeName}{c.department && ` · ${c.department}`}</span>}
          <Badge tone={s.tone} dot>{s.label}</Badge>
          {c.status === "submitted" && c.approverName && <span>with {c.approverName}</span>}
          {c.paidAt && <span>paid {formatDate(c.paidAt)}{c.paymentReference && ` (${c.paymentReference})`}</span>}
        </>}
        actions={<>
          {draft && <Button variant="ghost" onClick={() => setTitle(c.title)} icon={<FontAwesomeIcon icon={faPen} />}>Rename</Button>}
          {c.mine && (c.status === "draft" || c.status === "submitted") && (
            <Button variant="secondary" onClick={() => setWithdrawing(true)}>{c.status === "draft" ? "Delete" : "Withdraw"}</Button>
          )}
          {draft && <Button busy={submitting} disabled={!c.linesCount} onClick={send}>Submit for approval</Button>}
          {c.canDecide && <>
            <Button variant="secondary" onClick={() => setDeciding("reject")}>Reject</Button>
            <Button variant="secondary" onClick={() => setDeciding("return")}>Send back</Button>
            <Button onClick={() => setDeciding("approve")}>Approve</Button>
          </>}
        </>} />
      {problem && <ErrorNote error={problem} />}
      {c.canDecide && c.flags.some((f) => f !== "no_receipt") && (
        <Notice tone="warning" title="Check against policy">{c.flags.map((f) => FLAG[f] ?? f).join(", ")}. The items are marked below.</Notice>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card flush title="Items" description={`${formatMoney(c.total, c.currency)} in total`}
          actions={draft ? <Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing("new")}>Add expense</Button> : undefined}>
          {c.lines.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-subtle/70 text-left"><tr>
                  <th className="px-4 py-2.5 font-semibold text-ink">Date</th><th className="px-3 py-2.5 font-semibold text-ink">Expense</th>
                  <th className="px-3 py-2.5 font-semibold text-ink">Receipt</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Amount</th>
                  {draft && <th className="w-20" />}
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {c.lines.map((x) => (
                    <tr key={x.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(x.date)}</td>
                      <td className="px-3 py-2.5">
                        <span className="block text-ink">{x.description}</span>
                        <span className="block text-xs text-muted">{x.categoryName}{x.distanceKm && ` · ${x.distanceKm} km`}</span>
                        {x.flags.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{x.flags.map((f) => <Badge key={f} tone="warn">{FLAG[f] ?? f}</Badge>)}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {x.receiptUrl ? <a href={x.receiptUrl} className="text-brand-ink hover:underline"><FontAwesomeIcon icon={faPaperclip} className="mr-1" />View</a>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink">{formatMoney(String(x.amount), c.currency)}</td>
                      {draft && (
                        <td className="whitespace-nowrap px-2 py-1.5 text-right">
                          <IconButton label={`Edit ${x.description}`} onClick={() => setEditing(x)}><FontAwesomeIcon icon={faPen} className="text-xs" /></IconButton>
                          <IconButton label={`Remove ${x.description}`} onClick={async () => { await deleteLine({ id: x.id }); refresh(); }}>
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </IconButton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 py-4 text-sm text-muted">{draft ? "Add each expense with its receipt." : "No items."}</p>}
        </Card>
        <Card title="History">
          <ol className="grid gap-3 text-sm">
            {c.actions.map((a) => (
              <li key={a.id}>
                <span className="text-ink">{ACTION[a.action] ?? a.action}</span>
                <span className="block text-xs text-muted">{[a.actor, formatDate(a.createdAt)].filter(Boolean).join(" · ")}</span>
                {a.note && <p className="mt-0.5 whitespace-pre-wrap text-muted">“{a.note}”</p>}
              </li>
            ))}
          </ol>
          {c.status === "approved" && (
            <p className="mt-4 text-xs text-muted">
              {c.payrollPeriod ? `Included in the ${c.payrollPeriod} payroll.` : c.payVia === "payroll" ? "Will be paid with the next payroll." : "Will be paid by bank transfer."}
            </p>
          )}
        </Card>
      </div>
      {editing && <LineEditor claimId={c.id} data={data} line={editing === "new" ? undefined : editing} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }} />}
      {title !== null && (
        <Dialog open onClose={() => setTitle(null)} title="Rename claim" footer={<>
          <Button variant="secondary" onClick={() => setTitle(null)}>Cancel</Button>
          <Button onClick={async () => { await rename({ id: c.id, title }); setTitle(null); refresh(); }}>Save</Button>
        </>}>
          <Field label="Name"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        </Dialog>
      )}
      <ActionDialog open={withdrawing} onClose={() => setWithdrawing(false)} tone={c.status === "draft" ? "danger" : "primary"}
        title={c.status === "draft" ? "Delete this draft?" : "Withdraw this claim?"}
        description={c.status === "draft" ? "Its items and receipts are removed." : "It goes back to draft so you can change it and submit again."}
        confirmLabel={c.status === "draft" ? "Delete" : "Withdraw"}
        onConfirm={async () => {
          const res = await withdraw({ id: c.id });
          if (c.status === "draft" && !res.error) return router.push("/expenses");
          setWithdrawing(false);
          refresh();
        }} />
      <ActionDialog open={deciding !== null} onClose={() => setDeciding(null)} tone={deciding === "reject" ? "danger" : "primary"}
        title={deciding === "approve" ? `Approve ${formatMoney(c.total, c.currency)}?` : deciding === "return" ? "Send back for changes" : "Reject this claim"}
        description={deciding === "approve" ? (c.stage === "manager" ? "Finance checks it next." : "It will be paid back.")
          : deciding === "return" ? `${c.employeeName.split(" ")[0]} can change it and submit again.` : "It cannot be submitted again."}
        confirmLabel={deciding === "approve" ? "Approve" : deciding === "return" ? "Send back" : "Reject"}
        input={deciding === "approve" ? { label: "Note", placeholder: "Optional", required: false } : { label: "Reason", required: true, placeholder: "What needs to change" }}
        onConfirm={async (note) => {
          const res = await decide({ id: c.id, action: deciding!, note });
          const msg = res.error ? errorMessage(res.error) : res.data?.decideExpenseClaim.errors[0]?.message;
          if (msg) throw new Error(msg);
          setDeciding(null);
          refresh();
        }} />
    </>
  );
}
