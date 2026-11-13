"use client";

import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { IconCheck, IconPlus } from "@/components/icons";
import { PendingChanges } from "@/components/approvals/PendingChanges";
import { ApprovalChain, TypeDot } from "@/components/leave/Leave";
import { Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, Input, Loading, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { graphql } from "@/gql";
import type { LeaveApprovalsQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatDays, formatRange } from "@/lib/format";
import { reportErrors, today } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const LeaveApprovalsDocument = graphql(`
  query LeaveApprovals($everyone: Boolean!) {
    leaveApprovals(everyone: $everyone) {
      id startDate endDate halfDay days reason status createdAt canDecide decideAsOverride
      employee { id fullName }
      leaveType { id name color }
      waitingFor { id fullName }
      approvals { level status note overridden actedBy actedAt approver { id fullName } }
    }
    myDelegations { id startDate endDate delegator { id fullName } delegate { id fullName } }
  }
`);

const DecideDocument = graphql(`
  mutation DecideLeave($input: DecideLeaveInput!) {
    decideLeave(input: $input) {
      request { id status }
      errors { field message }
    }
  }
`);

type Request = LeaveApprovalsQuery["leaveApprovals"][number];

function DecideDialog({ request, approve: initial, override, onClose, onDone }: {
  request: Request; approve: boolean; override?: boolean; onClose: () => void; onDone: (message: string) => void;
}) {
  const [, decide] = useMutation(DecideDocument);
  const [approve, setApprove] = useState(initial);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [noteError, setNoteError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError(undefined);
    if ((override || !approve) && !note.trim()) {
      setNoteError(override ? "Say why HR is deciding. It is kept in the audit log." : "Say why. The employee sees this.");
      return;
    }
    setBusy(true);
    const result = await decide({ input: { id: request.id, approve, note: note.trim() || null } });
    setBusy(false);
    const failed = reportErrors(result, result.data?.decideLeave.errors, ["note"] as const, (_f, m) => setNoteError(m), setError);
    if (failed) return;
    const status = result.data?.decideLeave.request?.status;
    onDone(
      !approve ? `Rejected ${request.employee.fullName}'s request.`
        : status === "APPROVED" ? `Approved ${request.employee.fullName}'s leave.`
          : `Approved. The request moves to the next approver.`,
    );
  }

  return (
    <Dialog open onClose={onClose} title={override ? `Decide instead of ${request.waitingFor?.fullName ?? "the approver"}` : approve ? "Approve leave" : "Reject leave"}
      description={`${request.employee.fullName}: ${request.leaveType.name.toLowerCase()}, ${formatRange(request.startDate, request.endDate)} (${formatDays(request.days)}).`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={approve ? "primary" : "danger"} busy={busy} onClick={confirm}>{approve ? "Approve" : "Reject"}</Button>
      </>}>
      <div className="space-y-3">
        {error && <ErrorNote error={error} />}
        {override && (
          <>
            <Notice tone="warning">
              This is {request.waitingFor?.fullName ?? "another approver"}&apos;s decision. Deciding it for them is recorded in the audit log with your reason.
            </Notice>
            <Field label="Decision">
              <Select value={approve ? "approve" : "reject"} onChange={(e) => setApprove(e.target.value === "approve")}>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </Select>
            </Field>
          </>
        )}
        <Field label={override ? "Reason for overriding" : approve ? "Note" : "Reason"} optional={approve && !override} error={noteError}>
          <Textarea rows={2} value={note} aria-invalid={!!noteError} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

const PeopleDocument = graphql(`
  query DelegatePeople {
    employees(filter: { statuses: [ACTIVE, PROBATION] }, first: 100) { nodes { id fullName } }
  }
`);

const DelegateDocument = graphql(`
  mutation DelegateApprovals($input: DelegateInput!) {
    delegateApprovals(input: $input) { delegation { id } errors { field message } }
  }
`);

const RevokeDocument = graphql(`
  mutation RevokeDelegation($id: ID!) {
    revokeDelegation(id: $id) { delegation { id } errors { field message } }
  }
`);

function DelegateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { me } = useSession();
  const [{ data }] = useQuery({ query: PeopleDocument });
  const [, delegate] = useMutation(DelegateDocument);
  const [who, setWho] = useState("");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(undefined);
    const missing: Record<string, string> = {};
    if (!who) missing.delegate = "Choose who covers for you.";
    if (!end) missing.endDate = "Choose the last day.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    const result = await delegate({ input: { delegateId: who, startDate: start, endDate: end } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.delegateApprovals.errors, ["delegate", "startDate", "endDate"] as const,
      (f, m) => { found[f] = m; }, setError);
    setErrors(found);
    if (!failed) onDone();
  }

  return (
    <Dialog open onClose={onClose} title="Hand over your approvals"
      description="While you are away, the person you choose can approve or reject requests that are waiting for you."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button busy={busy} onClick={save}>Save</Button>
      </>}>
      <div className="space-y-4">
        {error && <ErrorNote error={error} />}
        <Field label="Covering for you" error={errors.delegate}>
          <Select value={who} aria-invalid={!!errors.delegate} onChange={(e) => setWho(e.target.value)}>
            <option value="">Choose…</option>
            {data?.employees.nodes.filter((p) => p.id !== me?.employee?.id).map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From" error={errors.startDate}>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Until" error={errors.endDate}>
            <Input type="date" value={end} min={start} aria-invalid={!!errors.endDate} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

export default function LeaveApprovalsPage() {
  const { can, me } = useSession();
  const hr = can(PERMS.leaveManage);
  const [everyone, setEveryone] = useState(false);
  const [{ data, error }, reload] = useQuery({ query: LeaveApprovalsDocument, variables: { everyone } });
  const [deciding, setDeciding] = useState<{ request: Request; approve: boolean; override?: boolean } | null>(null);
  const [delegating, setDelegating] = useState(false);
  const [, revoke] = useMutation(RevokeDocument);
  const [saved, setSaved] = useState<string>();
  const refresh = () => reload({ requestPolicy: "network-only" });

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const requests = data.leaveApprovals;
  const given = data.myDelegations.filter((d) => d.delegator.id === me?.employee?.id);
  const received = data.myDelegations.filter((d) => d.delegate.id === me?.employee?.id);

  return (
    <>
      <PageHeader title="Approvals" subtitle={`${requests.length} leave ${requests.length === 1 ? "request" : "requests"} waiting${everyone ? " across the company" : " for you"}`}
        actions={hr ? <Checkbox label="Show every pending request" checked={everyone} onChange={setEveryone} /> : null} />
      {saved && <Notice tone="success">{saved}</Notice>}
      <PendingChanges />
      {received.map((d) => (
        <Notice key={d.id} tone="info">
          You are covering {d.delegator.fullName}&apos;s approvals until {formatDate(d.endDate)}.
        </Notice>
      ))}

      {requests.length ? (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="text-[15px] font-semibold text-ink">{r.employee.fullName}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-2"><TypeDot color={r.leaveType.color} />{r.leaveType.name}</span>
                    <span className="tabular-nums text-ink">{formatRange(r.startDate, r.endDate)}</span>
                    <span className="tabular-nums text-muted">{formatDays(r.days)}{r.halfDay ? " (half day)" : ""}</span>
                  </div>
                  {r.reason && <p className="text-sm text-muted">“{r.reason}”</p>}
                  <ApprovalChain request={r} />
                  <p className="text-xs text-muted">Asked {formatDate(r.createdAt)}</p>
                </div>
                {r.canDecide && r.decideAsOverride ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted">Waiting for {r.waitingFor?.fullName}</span>
                    <Button variant="secondary" onClick={() => { setSaved(undefined); setDeciding({ request: r, approve: true, override: true }); }}>
                      Decide instead
                    </Button>
                  </div>
                ) : r.canDecide ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => { setSaved(undefined); setDeciding({ request: r, approve: false }); }}>Reject</Button>
                    <Button icon={<IconCheck size={16} />} onClick={() => { setSaved(undefined); setDeciding({ request: r, approve: true }); }}>Approve</Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted">Waiting for {r.waitingFor?.fullName ?? "HR"}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="Nothing waiting" icon={<IconCheck size={18} />}>Leave requests that need your decision appear here.</Empty>
      )}

      <Card title="Away yourself?" description="Hand your approvals to someone while you are out."
        actions={<Button size="sm" variant="secondary" icon={<IconPlus size={15} />} onClick={() => setDelegating(true)}>Hand over</Button>}>
        {given.length ? (
          <ul className="space-y-2 text-sm">
            {given.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3">
                <span>{d.delegate.fullName} covers from {formatDate(d.startDate)} to {formatDate(d.endDate)}</span>
                <Button size="sm" variant="ghost" onClick={async () => {
                  const result = await revoke({ id: d.id });
                  setSaved(errorMessage(result.error) ?? result.data?.revokeDelegation.errors[0]?.message ?? "Handover ended.");
                  refresh();
                }}>End now</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No handover set up.</p>
        )}
      </Card>

      {deciding && (
        <DecideDialog request={deciding.request} approve={deciding.approve} override={deciding.override} onClose={() => setDeciding(null)}
          onDone={(message) => { setDeciding(null); setSaved(message); refresh(); }} />
      )}
      {delegating && (
        <DelegateDialog onClose={() => setDelegating(false)} onDone={() => { setDelegating(false); setSaved("Approvals handed over."); refresh(); }} />
      )}
    </>
  );
}
