"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { IconCheck } from "@/components/icons";
import { Button, Card, Dialog, Empty, ErrorNote, Field, Loading, Notice, PageHeader, Textarea } from "@/components/ui";
import { graphql } from "@/gql";
import type { PendingChangesQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const PendingChangesDocument = graphql(`
  query PendingChanges {
    pendingChangeRequests { id employeeId employeeName createdAt canDecide lines { field label current requested } }
  }
`);

const DecideChangeDocument = graphql(`
  mutation DecideChangeRequest($id: ID!, $approve: Boolean!, $note: String) {
    decideChangeRequest(id: $id, approve: $approve, note: $note) { request { id status } errors { field message } }
  }
`);

type Change = PendingChangesQuery["pendingChangeRequests"][number];

function DecideDialog({ change, approve, onClose, onDone }: { change: Change; approve: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const [, decide] = useMutation(DecideChangeDocument);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError(undefined);
    if (!approve && !note.trim()) return setNoteError("Say why. The employee sees this.");
    setBusy(true);
    const result = await decide({ id: change.id, approve, note: note.trim() || null });
    setBusy(false);
    const failed = reportErrors(result, result.data?.decideChangeRequest.errors, ["note"] as const, (_f, m) => setNoteError(m), setError);
    if (!failed) onDone(approve ? `${change.employeeName}'s record is updated.` : `Rejected ${change.employeeName}'s change.`);
  }

  return (
    <Dialog open onClose={onClose} title={approve ? "Approve the change" : "Reject the change"} description={change.employeeName}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={approve ? "primary" : "danger"} busy={busy} onClick={confirm}>{approve ? "Approve and update" : "Reject"}</Button>
      </>}>
      <div className="space-y-3">
        {error && <ErrorNote error={error} />}
        {approve && <p className="text-sm text-muted">Check the new details against a document before approving: they go straight into payroll.</p>}
        <Field label={approve ? "Note" : "Reason"} optional={approve} error={noteError}>
          <Textarea rows={2} value={note} aria-invalid={!!noteError} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

export default function ChangeRequestsPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: PendingChangesDocument });
  const [deciding, setDeciding] = useState<{ change: Change; approve: boolean } | null>(null);
  const [saved, setSaved] = useState<string>();

  if (!can(PERMS.employeesManage)) return <Notice tone="warning">You do not have permission to review changes.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const changes = data.pendingChangeRequests;

  return (
    <>
      <PageHeader back={{ href: "/employees", label: "Employees" }} title="Change requests"
        subtitle="Legal names, bank details and ID numbers employees asked to change." />
      {saved && <Notice tone="success">{saved}</Notice>}
      {changes.length ? (
        <div className="space-y-3">
          {changes.map((c) => (
            <Card key={c.id} title={<Link href={`/employees/${c.employeeId}`} className="hover:underline">{c.employeeName}</Link>}
              description={`Asked ${formatDate(c.createdAt)}`}
              actions={c.canDecide ? (
                <>
                  <Button size="sm" variant="secondary" onClick={() => { setSaved(undefined); setDeciding({ change: c, approve: false }); }}>Reject</Button>
                  <Button size="sm" icon={<IconCheck size={15} />} onClick={() => { setSaved(undefined); setDeciding({ change: c, approve: true }); }}>Approve</Button>
                </>
              ) : <span className="text-xs text-muted">Needs someone with pay access</span>}>
              <dl className="divide-y divide-line text-sm">
                {c.lines.map((l) => (
                  <div key={l.field} className="grid grid-cols-[140px_1fr] gap-3 py-2 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr_1fr]">
                    <dt className="text-muted">{l.label}</dt>
                    <dd className="hidden truncate font-mono text-muted line-through sm:block">{l.current || "—"}</dd>
                    <dd className="truncate font-mono font-medium text-ink">{l.requested || <span className="font-sans text-muted">Clear it</span>}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="Nothing waiting" icon={<IconCheck size={18} />}>Changes employees ask for appear here.</Empty>
      )}
      {deciding && (
        <DecideDialog change={deciding.change} approve={deciding.approve} onClose={() => setDeciding(null)}
          onDone={(m) => { setDeciding(null); setSaved(m); reload({ requestPolicy: "network-only" }); }} />
      )}
    </>
  );
}
