"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { ChangeJobDialog, ChangePayDialog, ChangeStatusDialog, OVERTIME, PAY_SCHEDULES, PAY_TYPES, canChangeStatus } from "@/components/employees/EmployeeDialogs";
import { IconPlus, IconTrash } from "@/components/icons";
import { inDays } from "@/components/home/Reminders";
import { AdjustBalanceDialog, BalanceCards, EmployeeLeaveDocument, RequestLeaveDialog } from "@/components/leave/Leave";
import { Badge, Button, Dialog, ErrorNote, Field, IconButton, Input, StatusBadge, Table, TD, TH, Textarea } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatFrequency, formatMoney, humanize } from "@/lib/format";
import { today } from "@/lib/forms";

import { LeaveHistory, UpcomingLeave } from "./LeaveHistory";
import type { Profile } from "./query";
import { ProfileSection } from "./Section";

interface BlockProps {
  e: Profile;
  title: string;
  icon: string;
  onSaved: (message: string) => void;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-ink">{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

export function JobSummaryBlock({ e, title, icon, onSaved, canManage }: BlockProps & { canManage: boolean }) {
  const [open, setOpen] = useState<"job" | "status" | null>(null);
  const left = e.status === "TERMINATED";
  return (
    <ProfileSection title={title} icon={icon} actions={canManage ? (
      <>
        {!left && <Button size="sm" variant="secondary" onClick={() => setOpen("job")}>Change job</Button>}
        {canChangeStatus(e.status) && <Button size="sm" variant="secondary" onClick={() => setOpen("status")}>Change status</Button>}
      </>
    ) : undefined}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Detail label="Status"><StatusBadge status={e.status} /></Detail>
        <Detail label="Job title">{e.jobTitle?.name}</Detail>
        <Detail label="Grade">{e.grade?.name}</Detail>
        <Detail label="Department">{e.department?.name}</Detail>
        <Detail label="Location">{e.location?.name}</Detail>
        <Detail label="Legal entity">{e.legalEntity.name}</Detail>
        <Detail label="Employment type">{humanize(e.employmentType)}</Detail>
        <Detail label="Reports to">
          {e.manager ? <Link className="font-medium text-brand-ink hover:underline" href={`/employees/${e.manager.id}`}>{e.manager.fullName}</Link> : null}
        </Detail>
        <Detail label="Hire date">{formatDate(e.hireDate)}</Detail>
        {e.probationEndDate ? <Detail label="Probation ends">{formatDate(e.probationEndDate)}</Detail> : null}
        {e.terminationDate ? <Detail label="Left on">{formatDate(e.terminationDate)}</Detail> : null}
        {e.terminationReason ? <Detail label="Reason for leaving">{e.terminationReason}</Detail> : null}
      </dl>
      {e.jobTitle?.description && (
        <div className="mt-5 border-t border-line pt-4">
          <h4 className="text-[13px] text-muted">Job description</h4>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink">{e.jobTitle.description}</p>
        </div>
      )}
      {open === "job" && <ChangeJobDialog employee={e} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); onSaved("Job change recorded."); }} />}
      {open === "status" && <ChangeStatusDialog employee={e} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); onSaved("Status updated."); }} />}
    </ProfileSection>
  );
}

export function JobHistoryBlock({ e, title, icon, onSaved, canManage }: BlockProps & { canManage: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ProfileSection title={title} icon={icon} flush description="Every hire, promotion, transfer and change, newest first."
      actions={canManage && e.status !== "TERMINATED" ? <Button size="sm" variant="secondary" icon={<IconPlus size={14} />} onClick={() => setOpen(true)}>Add entry</Button> : undefined}>
      <Table>
        <thead>
          <tr><TH>Effective</TH><TH>Change</TH><TH>Job title</TH><TH className="hidden md:table-cell">Department</TH><TH className="hidden lg:table-cell">Location</TH><TH className="hidden md:table-cell">Reports to</TH></tr>
        </thead>
        <tbody>
          {e.employmentHistory.map((h, i) => (
            <tr key={h.id}>
              <TD className="whitespace-nowrap tabular-nums">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-line-strong"}`} aria-hidden />
                  {formatDate(h.effectiveDate)}
                </span>
              </TD>
              <TD>
                {humanize(h.changeType)}
                {h.effectiveDate > today() && <span className="ml-2"><Badge tone="warn">Upcoming</Badge></span>}
                {h.reason && <span className="block text-xs text-muted">{h.reason}</span>}
              </TD>
              <TD>{h.jobTitle?.name ?? "—"}</TD>
              <TD className="hidden md:table-cell">{h.department?.name ?? "—"}</TD>
              <TD className="hidden lg:table-cell">{h.location?.name ?? "—"}</TD>
              <TD className="hidden md:table-cell">{h.manager?.fullName ?? "—"}</TD>
            </tr>
          ))}
        </tbody>
      </Table>
      {open && <ChangeJobDialog employee={e} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); onSaved("Job change recorded."); }} />}
    </ProfileSection>
  );
}

const label = <T extends string>(list: { value: T; label: string }[], value: T | null | undefined) =>
  list.find((o) => o.value === value)?.label ?? "—";

export function PayBlock({ e, title, icon, onSaved, canManagePay, currency }: BlockProps & { canManagePay: boolean; currency: string }) {
  const [open, setOpen] = useState<"pay" | "bonus" | null>(null);
  // The API returns pay only to people allowed to see it.
  if (!e.compensation && !e.compensationHistory.length && !canManagePay) return null;
  const payCurrency = e.compensation?.currency ?? currency;
  const target = e.bonusTarget;
  return (
    <>
      <ProfileSection title={title} icon={icon} flush
        description={e.compensation ? `${formatMoney(e.compensation.amount, e.compensation.currency)} ${formatFrequency(e.compensation.frequency)} since ${formatDate(e.compensation.effectiveDate)}` : "No pay recorded yet."}
        actions={canManagePay && e.status !== "TERMINATED" ? <Button size="sm" variant="secondary" icon={<IconPlus size={14} />} onClick={() => setOpen("pay")}>Add entry</Button> : undefined}>
        {e.compensationHistory.length > 0 && (
          <Table>
            <thead>
              <tr>
                <TH>Effective</TH><TH className="hidden md:table-cell">Pay schedule</TH><TH className="hidden sm:table-cell">Pay type</TH>
                <TH align="right">Pay rate</TH><TH className="hidden lg:table-cell">Overtime</TH><TH className="hidden md:table-cell">Reason</TH>
              </tr>
            </thead>
            <tbody>
              {e.compensationHistory.map((c) => (
                <tr key={c.id}>
                  <TD className="whitespace-nowrap tabular-nums">
                    {formatDate(c.effectiveDate)}
                    {c.effectiveDate > today() && <span className="ml-2"><Badge tone="warn">Upcoming</Badge></span>}
                  </TD>
                  <TD className="hidden md:table-cell">{label(PAY_SCHEDULES, c.paySchedule)}</TD>
                  <TD className="hidden sm:table-cell">{label(PAY_TYPES, c.payType)}</TD>
                  <TD align="right" className="whitespace-nowrap tabular-nums">
                    <span className="font-medium">{formatMoney(c.amount, c.currency)}</span>
                    <span className="block text-xs text-muted">{formatFrequency(c.frequency)}</span>
                  </TD>
                  <TD className="hidden lg:table-cell">{label(OVERTIME, c.overtime)}</TD>
                  <TD className="hidden text-muted md:table-cell">
                    {c.reason || "—"}
                    {c.comment && <span className="block text-xs">{c.comment}</span>}
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {open === "pay" && <ChangePayDialog employee={e} currency={currency} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); onSaved("Pay change recorded."); }} />}
      </ProfileSection>
      {target && (
        <ProfileSection title="Potential bonus" icon="star"
          actions={canManagePay ? <Button size="sm" variant="ghost" className="-my-1 -mr-2" onClick={() => setOpen("bonus")}>Edit</Button> : undefined}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Detail label="Annual percentage">{target.percent ? `${Number(target.percent)}% of base pay` : null}</Detail>
            <Detail label="Annual amount">{target.amount ? formatMoney(target.amount, payCurrency) : null}</Detail>
          </dl>
          {open === "bonus" && <BonusTargetDialog e={e} currency={payCurrency} onClose={() => setOpen(null)}
            onSaved={() => { setOpen(null); onSaved("Potential bonus saved."); }} />}
        </ProfileSection>
      )}
    </>
  );
}

const SetBonusTargetDocument = graphql(`
  mutation SetBonusTarget($input: BonusTargetInput!) {
    setBonusTarget(input: $input) { employee { id } errors { field message } }
  }
`);

function BonusTargetDialog({ e, currency, onClose, onSaved }: { e: Profile; currency: string; onClose: () => void; onSaved: () => void }) {
  const [percent, setPercent] = useState(e.bonusTarget?.percent ? String(Number(e.bonusTarget.percent)) : "");
  const [amount, setAmount] = useState(e.bonusTarget?.amount ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, save] = useMutation(SetBonusTargetDocument);
  const number = /^\d+(\.\d{1,2})?$/;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if ((percent && !number.test(percent.trim())) || (amount && !number.test(amount.trim()))) {
      setError("Use numbers like 10 or 250000.50.");
      return;
    }
    setBusy(true);
    const result = await save({ input: { id: e.id, percent: percent.trim() || null, amount: amount.trim() || null } });
    setBusy(false);
    const problem = errorMessage(result.error) ?? result.data?.setBonusTarget.errors[0]?.message;
    if (problem) setError(problem);
    else onSaved();
  }

  return (
    <Dialog open onClose={onClose} title="Potential bonus" description="What this person could earn as a bonus in a year. Leave both empty to clear it."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="bonus-form" busy={busy}>Save</Button>
      </>}>
      <form id="bonus-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <ErrorNote error={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Annual percentage" optional hint="Of yearly base pay">
            <Input inputMode="decimal" value={percent} onChange={(ev) => setPercent(ev.target.value)} />
          </Field>
          <Field label={`Annual amount (${currency})`} optional>
            <Input inputMode="decimal" className="tabular-nums" value={amount} onChange={(ev) => setAmount(ev.target.value)} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}

export function StatusHistoryBlock({ e, title, icon, onSaved, canManage }: BlockProps & { canManage: boolean }) {
  const [open, setOpen] = useState(false);
  if (!e.statusHistory.length) return null;
  return (
    <ProfileSection title={title} icon={icon} flush description="Probation, confirmation, leave and leaving, newest first."
      actions={canManage && canChangeStatus(e.status) ? <Button size="sm" variant="secondary" icon={<IconPlus size={14} />} onClick={() => setOpen(true)}>Add entry</Button> : undefined}>
      <Table>
        <thead><tr><TH>Effective</TH><TH>Status</TH><TH className="hidden sm:table-cell">Comment</TH></tr></thead>
        <tbody>
          {e.statusHistory.map((s) => (
            <tr key={s.id}>
              <TD className="whitespace-nowrap tabular-nums">{formatDate(s.effectiveDate)}</TD>
              <TD><StatusBadge status={s.status} /></TD>
              <TD className="hidden text-muted sm:table-cell">{s.comment || "—"}</TD>
            </tr>
          ))}
        </tbody>
      </Table>
      {open && <ChangeStatusDialog employee={e} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); onSaved("Status updated."); }} />}
    </ProfileSection>
  );
}

const AddNoteDocument = graphql(`
  mutation AddEmployeeNote($employeeId: ID!, $body: String!, $remindOn: Date) {
    addEmployeeNote(employeeId: $employeeId, body: $body, remindOn: $remindOn) { note { id } errors { field message } }
  }
`);

const DeleteNoteDocument = graphql(`
  mutation DeleteEmployeeNote($id: ID!) {
    deleteEmployeeNote(id: $id)
  }
`);

/** HR's dated notes on the record. Only people who manage the employee see them. */
export function NotesBlock({ e, title, icon, onSaved, canManage }: BlockProps & { canManage: boolean }) {
  const [body, setBody] = useState("");
  const [remindOn, setRemindOn] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, add] = useMutation(AddNoteDocument);
  const [, remove] = useMutation(DeleteNoteDocument);
  if (!canManage) return null;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const result = await add({ employeeId: e.id, body, remindOn });
    setBusy(false);
    const problem = errorMessage(result.error) ?? result.data?.addEmployeeNote.errors[0]?.message;
    if (problem) return setError(problem);
    setBody("");
    setError(undefined);
    onSaved(remindOn ? "Note added. You will be reminded to follow up." : "Note added.");
    setRemindOn(null);
  }

  return (
    <ProfileSection title={title} icon={icon} description="Only people who manage this record can see notes.">
      <form onSubmit={submit} className="space-y-3">
        {error && <ErrorNote error={error} />}
        <Textarea rows={3} value={body} onChange={(ev) => setBody(ev.target.value)} placeholder="Add a note about a conversation, a commendation or a follow-up" aria-label="New note" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {remindOn === null ? (
            <button type="button" onClick={() => setRemindOn(inDays(7))} className="text-sm font-medium text-brand-ink hover:underline">
              + Remind me to follow up
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              Remind me on
              <Input type="date" value={remindOn} min={inDays(0)} onChange={(ev) => setRemindOn(ev.target.value || null)} className="h-8 w-40" aria-label="Follow-up date" />
              <button type="button" onClick={() => setRemindOn(null)} className="text-muted hover:text-ink">No reminder</button>
            </div>
          )}
          <Button type="submit" size="sm" busy={busy} disabled={!body.trim()}>Add note</Button>
        </div>
      </form>
      {e.notes.length > 0 ? (
        <ul className="mt-5 space-y-4 border-t border-line pt-5">
          {e.notes.map((n) => (
            <li key={n.id} className="group flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{n.authorName} · {formatDate(n.createdAt.slice(0, 10))}</p>
                <p className="mt-1 whitespace-pre-line text-[15px] text-ink">{n.body}</p>
              </div>
              <IconButton label="Delete note" className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                onClick={async () => { await remove({ id: n.id }); onSaved("Note deleted."); }}>
                <IconTrash size={15} />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 text-sm text-muted">No notes yet.</p>}
    </ProfileSection>
  );
}

export function LeaveBlock({ e, title, icon, onSaved, isSelf, canManageLeave }: BlockProps & { isSelf: boolean; canManageLeave: boolean }) {
  const [{ data, error }, reload] = useQuery({ query: EmployeeLeaveDocument, variables: { employeeId: e.id } });
  const [open, setOpen] = useState<"request" | "adjust" | null>(null);
  // Leave shows to the person, their managers up the line and HR; anyone else gets "not found".
  if (error || !data) return null;
  const leave = data.employeeLeave;
  const refresh = (message: string) => { setOpen(null); reload({ requestPolicy: "network-only" }); onSaved(message); };
  return (
    <ProfileSection title={title} icon={icon}
      actions={<>
        {(isSelf || canManageLeave) && leave.balances.length > 0 && e.status !== "TERMINATED" && (
          <Button size="sm" icon={<IconPlus size={14} />} onClick={() => setOpen("request")}>Request time off</Button>
        )}
        {canManageLeave && leave.balances.some((b) => b.leaveType.tracksBalance) && (
          <Button size="sm" variant="secondary" onClick={() => setOpen("adjust")}>Adjust balance</Button>
        )}
      </>}>
      {leave.balances.length ? <BalanceCards balances={leave.balances} /> : <p className="text-sm text-muted">No leave policy covers this employee.</p>}
      {open === "request" && (
        <RequestLeaveDialog balances={leave.balances} employeeId={isSelf ? undefined : e.id} onClose={() => setOpen(null)}
          onSaved={(status) => refresh(status === "APPROVED" ? "Leave booked." : "Request sent for approval.")} />
      )}
      {open === "adjust" && (
        <AdjustBalanceDialog employeeId={e.id} employeeName={e.fullName} balances={leave.balances} onClose={() => setOpen(null)}
          onSaved={() => refresh("Leave balance adjusted.")} />
      )}
    </ProfileSection>
  );
}

// The two blocks below read the same query as LeaveBlock, so urql serves them from one request
// and a reload in any of them updates all three.

export function LeaveUpcomingBlock({ e, title, icon }: BlockProps) {
  const [{ data, error }] = useQuery({ query: EmployeeLeaveDocument, variables: { employeeId: e.id } });
  if (error || !data) return null;
  return <UpcomingLeave title={title} icon={icon} requests={data.employeeLeave.requests} />;
}

export function LeaveHistoryBlock({ e, title, icon, onSaved, isSelf }: BlockProps & { isSelf: boolean }) {
  const [{ data, error }, reload] = useQuery({ query: EmployeeLeaveDocument, variables: { employeeId: e.id } });
  if (error || !data) return null;
  const leave = data.employeeLeave;
  return (
    <LeaveHistory key={leave.requests.length + leave.balances.map((b) => b.balance).join()} title={title} icon={icon}
      employeeId={isSelf ? undefined : e.id} balances={leave.balances} requests={leave.requests}
      showEmployee={isSelf ? undefined : e.fullName}
      onChanged={() => { reload({ requestPolicy: "network-only" }); onSaved("Leave cancelled."); }} />
  );
}
