"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { ActionDialog, Badge, Button, Checkbox, Dialog, ErrorNote, Field, Input, Select, Table, TD, TH, Textarea, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { EmployeeLeaveQuery, LeaveStatus } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatDays, formatRange } from "@/lib/format";
import { reportErrors } from "@/lib/forms";

export const EmployeeLeaveDocument = graphql(`
  query EmployeeLeave($employeeId: ID) {
    employeeLeave(employeeId: $employeeId) {
      employee { id fullName }
      balances {
        leaveType { id name color tracksBalance allowHalfDays isPaid }
        policyName entitlement balance pending available takenThisYear
      }
      requests {
        id startDate endDate halfDay days reason status createdAt canCancel canDecide
        leaveType { id name color }
        approvals { level status note overridden actedBy actedAt approver { id fullName } }
      }
      ledger { id date kind amount reason leaveType { name } }
    }
  }
`);

export type LeaveSummary = EmployeeLeaveQuery["employeeLeave"];
export type LeaveRequestRow = LeaveSummary["requests"][number];
export type LeaveBalanceRow = LeaveSummary["balances"][number];

const STATUS: Record<LeaveStatus, { label: string; tone: "warn" | "good" | "bad" | "neutral" }> = {
  PENDING: { label: "Pending", tone: "warn" },
  APPROVED: { label: "Approved", tone: "good" },
  REJECTED: { label: "Rejected", tone: "bad" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return <Badge tone={STATUS[status].tone} dot>{STATUS[status].label}</Badge>;
}

export function TypeDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cx("inline-block h-2.5 w-2.5 flex-none rounded-full", className)} style={{ backgroundColor: color }} />;
}

/* ------------------------------------------------------------------ Balances */

export function BalanceCards({ balances }: { balances: LeaveBalanceRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {balances.map((b) => (
        <div key={b.leaveType.id} className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <TypeDot color={b.leaveType.color} />
            <span className="truncate">{b.leaveType.name}</span>
          </div>
          {b.available !== null && b.available !== undefined ? (
            <>
              <div className="mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.01em] text-ink tabular-nums">
                {Number(b.available).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                <span className="ml-1.5 font-sans text-sm font-normal text-muted">days left</span>
              </div>
              <div className="mt-2 text-xs text-muted">
                {[
                  b.entitlement && `${formatDays(b.entitlement)} a year`,
                  Number(b.pending) > 0 && `${formatDays(b.pending)} pending`,
                  `${formatDays(b.takenThisYear)} taken`,
                ].filter(Boolean).join(" · ")}
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 text-sm text-ink">Granted case by case</div>
              <div className="mt-2 text-xs text-muted">{formatDays(b.takenThisYear)} taken this year</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Requests */

const CancelLeaveDocument = graphql(`
  mutation CancelLeave($id: ID!) {
    cancelLeave(id: $id) {
      request { id status }
      errors { field message }
    }
  }
`);

export function ApprovalChain({ request }: { request: Pick<LeaveRequestRow, "approvals" | "status"> }) {
  if (!request.approvals.length) return <span className="text-xs text-muted">No approval needed</span>;
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
      {request.approvals.map((s, i) => (
        <li key={s.level} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>→</span>}
          <span className={cx(
            s.status === "APPROVED" && "text-emerald-700 dark:text-emerald-300",
            s.status === "REJECTED" && "text-red-700 dark:text-red-300",
            s.status === "PENDING" && "font-medium text-ink",
          )}>
            {s.overridden ? `HR for ${s.approver?.fullName}` : s.approver?.fullName ?? "HR"}
            {s.status === "APPROVED" && " ✓"}
            {s.status === "REJECTED" && " ✕"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RequestsTable({ requests, onChanged, showEmployee }: {
  requests: LeaveRequestRow[];
  onChanged: () => void;
  showEmployee?: string;
}) {
  const [, cancel] = useMutation(CancelLeaveDocument);
  const [cancelling, setCancelling] = useState<LeaveRequestRow | null>(null);
  return (
    <>
      <Table>
        <thead>
          <tr>
            <TH>Leave</TH>
            <TH>Dates</TH>
            <TH align="right">Days</TH>
            <TH className="hidden md:table-cell">Approval</TH>
            <TH>Status</TH>
            <TH align="right"><span className="sr-only">Actions</span></TH>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const rejection = r.approvals.find((s) => s.status === "REJECTED")?.note;
            return (
              <tr key={r.id} className="align-top">
                <TD>
                  <span className="flex items-center gap-2 font-medium"><TypeDot color={r.leaveType.color} />{r.leaveType.name}</span>
                  {r.reason && <span className="mt-0.5 block text-xs text-muted">{r.reason}</span>}
                  {rejection && <span className="mt-0.5 block text-xs text-red-700 dark:text-red-300">Rejected: {rejection}</span>}
                </TD>
                <TD className="whitespace-nowrap tabular-nums">
                  {formatRange(r.startDate, r.endDate)}
                  {r.halfDay && <span className="block text-xs text-muted">Half day</span>}
                </TD>
                <TD align="right" className="tabular-nums">{Number(r.days)}</TD>
                <TD className="hidden md:table-cell"><ApprovalChain request={r} /></TD>
                <TD><LeaveStatusBadge status={r.status} /></TD>
                <TD align="right">
                  {r.canCancel && <Button size="sm" variant="ghost" onClick={() => setCancelling(r)}>Cancel</Button>}
                </TD>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <ActionDialog
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this leave?"
        description={cancelling && `${showEmployee ? `${showEmployee}'s ` : ""}${cancelling.leaveType.name.toLowerCase()}, ${formatRange(cancelling.startDate, cancelling.endDate)}.${cancelling.status === "APPROVED" ? " The days go back to the balance." : ""}`}
        confirmLabel="Cancel leave"
        tone="danger"
        onConfirm={async () => {
          if (!cancelling) return;
          const result = await cancel({ id: cancelling.id });
          const problem = errorMessage(result.error) ?? result.data?.cancelLeave.errors[0]?.message;
          if (problem) throw new Error(problem);
          onChanged();
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------- Request dialog */

const LeaveQuoteDocument = graphql(`
  query LeaveQuote($leaveTypeId: ID!, $startDate: Date!, $endDate: Date!, $halfDay: Boolean!, $employeeId: ID) {
    leaveQuote(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, halfDay: $halfDay, employeeId: $employeeId) {
      days available availableAfter
      errors { field message }
    }
  }
`);

const RequestLeaveDocument = graphql(`
  mutation RequestLeave($input: RequestLeaveInput!) {
    requestLeave(input: $input) {
      request { id status }
      errors { field message }
    }
  }
`);

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export function RequestLeaveDialog({ balances, employeeId, onClose, onSaved }: {
  balances: LeaveBalanceRow[];
  /** HR requesting for someone else; omit for your own leave. */
  employeeId?: string;
  onClose: () => void;
  onSaved: (status: LeaveStatus) => void;
}) {
  const [typeId, setTypeId] = useState(balances[0]?.leaveType.id ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, request] = useMutation(RequestLeaveDocument);

  const type = balances.find((b) => b.leaveType.id === typeId);
  const endDate = halfDay ? start : end;
  const ready = Boolean(typeId && isDate(start) && isDate(endDate) && endDate >= start);
  const [{ data: quoteData, fetching: quoting }] = useQuery({
    query: LeaveQuoteDocument,
    variables: { leaveTypeId: typeId, startDate: start, endDate, halfDay, employeeId: employeeId ?? null },
    pause: !ready,
    requestPolicy: "network-only",
  });
  const quote = ready ? quoteData?.leaveQuote : undefined;
  const quoteError = quote?.errors[0]?.message;
  const short = quote?.availableAfter != null && Number(quote.availableAfter) < 0;
  // Every chosen day is a weekend or public holiday: nothing to take, so say so before they send.
  const noWorkingDays = !quoteError && quote?.days != null && Number(quote.days) === 0;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!isDate(start)) missing.startDate = "Choose the first day.";
    if (!halfDay && !isDate(end)) missing.endDate = "Choose the last day.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    const result = await request({
      input: { leaveTypeId: typeId, startDate: start, endDate, halfDay, reason: reason.trim() || null, employeeId: employeeId ?? null },
    });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.requestLeave.errors, ["startDate", "endDate", "halfDay", "leaveType"] as const,
      (f, message) => { found[f] = message; }, setFormError);
    // For a half day only one date is shown: a problem with the "last day" belongs on it.
    if (halfDay && found.endDate && !found.startDate) { found.startDate = found.endDate; delete found.endDate; }
    setErrors(found);
    if (found.leaveType || found.halfDay) setFormError(found.leaveType ?? found.halfDay);
    const made = result.data?.requestLeave.request;
    if (!failed && made) onSaved(made.status);
  }

  return (
    <Dialog open onClose={onClose} title="Request time off"
      description="Weekends and public holidays are not counted."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="leave-form" busy={busy} disabled={short || noWorkingDays}>Send request</Button>
      </>}>
      <form id="leave-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Type of leave">
          <Select value={typeId} onChange={(e) => { setTypeId(e.target.value); setHalfDay(false); }}>
            {balances.map((b) => (
              <option key={b.leaveType.id} value={b.leaveType.id}>
                {b.leaveType.name}{b.available != null ? ` (${formatDays(b.available)} left)` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <div className={cx("grid gap-4", !halfDay && "grid-cols-2")}>
          <Field label={halfDay ? "Date" : "First day"} error={errors.startDate}>
            <Input type="date" value={start} aria-invalid={!!errors.startDate}
              onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value); }} />
          </Field>
          {!halfDay && (
            <Field label="Last day" error={errors.endDate}>
              <Input type="date" value={end} min={start || undefined} aria-invalid={!!errors.endDate} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          )}
        </div>
        {type?.leaveType.allowHalfDays && (
          <Checkbox label="Half day" checked={halfDay} onChange={setHalfDay} />
        )}

        {ready && (
          <div aria-live="polite" className={cx("rounded-lg border px-4 py-3 text-sm",
            quoteError || short || noWorkingDays ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100" : "border-line bg-subtle/60")}>
            {quoting && !quote ? (
              <span className="text-muted">Working out the days…</span>
            ) : quoteError ? (
              quoteError
            ) : noWorkingDays ? (
              halfDay || start === endDate
                ? `${formatDate(start)} is a weekend or public holiday, so there is nothing to take. Choose a working day.`
                : "Every day in these dates is a weekend or public holiday, so there is nothing to take. Choose working days."
            ) : quote ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span><span className="font-semibold tabular-nums">{formatDays(quote.days ?? 0)}</span> of {type?.leaveType.name.toLowerCase()}</span>
                {quote.available != null && (
                  <span className={cx("tabular-nums", !short && "text-muted")}>
                    {short ? `Only ${formatDays(quote.available)} available` : `${formatDays(quote.availableAfter ?? 0)} left afterwards`}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}

        <Field label="Note for your manager" optional>
          <Textarea rows={2} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- Adjustment */

const AdjustDocument = graphql(`
  mutation AdjustLeaveBalance($input: AdjustLeaveInput!) {
    adjustLeaveBalance(input: $input) {
      balance { balance }
      errors { field message }
    }
  }
`);

export function AdjustBalanceDialog({ employeeId, employeeName, balances, onClose, onSaved }: {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalanceRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const tracked = balances.filter((b) => b.leaveType.tracksBalance);
  const [typeId, setTypeId] = useState(tracked[0]?.leaveType.id ?? "");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, adjust] = useMutation(AdjustDocument);
  const current = tracked.find((b) => b.leaveType.id === typeId);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) === 0) missing.amount = "Enter a number of days, like 2 or 0.5.";
    if (!reason.trim()) missing.reason = "Give a reason. It is kept in the audit log.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    const signed = direction === "remove" ? `-${amount.trim()}` : amount.trim();
    const result = await adjust({ input: { employeeId, leaveTypeId: typeId, amount: signed, reason: reason.trim() } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.adjustLeaveBalance.errors, ["amount", "reason"] as const,
      (f, message) => { found[f] = message; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title="Adjust leave balance" description={`For ${employeeName}. The change and its reason are kept on the ledger and in the audit log.`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="adjust-form" busy={busy}>Save adjustment</Button>
      </>}>
      <form id="adjust-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Leave type" hint={current?.balance != null ? `Balance now: ${formatDays(current.balance)}` : undefined}>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {tracked.map((b) => <option key={b.leaveType.id} value={b.leaveType.id}>{b.leaveType.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-[140px_1fr] gap-4">
          <Field label="Change">
            <Select value={direction} onChange={(e) => setDirection(e.target.value as "add" | "remove")}>
              <option value="add">Add days</option>
              <option value="remove">Remove days</option>
            </Select>
          </Field>
          <Field label="Days" error={errors.amount}>
            <Input inputMode="decimal" className="tabular-nums" value={amount} aria-invalid={!!errors.amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
        <Field label="Reason" error={errors.reason}>
          <Input value={reason} aria-invalid={!!errors.reason} placeholder="Opening balance from the old system" onChange={(e) => setReason(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- Ledger */

const KIND_LABEL: Record<string, string> = {
  ACCRUAL: "Earned", EXPIRY: "Expired", TAKEN: "Taken", REVERSAL: "Returned", ADJUSTMENT: "Adjusted",
};

export function LedgerTable({ ledger }: { ledger: LeaveSummary["ledger"] }) {
  return (
    <Table>
      <thead>
        <tr><TH>Date</TH><TH>Leave</TH><TH>Entry</TH><TH align="right">Days</TH></tr>
      </thead>
      <tbody>
        {ledger.map((e) => (
          <tr key={e.id}>
            <TD className="whitespace-nowrap tabular-nums text-muted">{formatDate(e.date)}</TD>
            <TD>{e.leaveType.name}</TD>
            <TD>
              {KIND_LABEL[e.kind] ?? e.kind}
              {e.reason && <span className="block text-xs text-muted">{e.reason}</span>}
            </TD>
            <TD align="right" className={cx("tabular-nums", Number(e.amount) < 0 ? "text-ink" : "text-emerald-700 dark:text-emerald-300")}>
              {Number(e.amount) > 0 ? "+" : ""}{Number(e.amount)}
            </TD>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
