"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Button, Checkbox, Dialog, Empty, ErrorNote, Input, Loading, Notice } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";

const CandidatesDocument = graphql(`
  query InviteCandidates { inviteCandidates { withoutEmail people { employeeId name email department } } }
`);

const InviteEmployeesDocument = graphql(`
  mutation InviteEmployees($ids: [ID!]!) { inviteEmployees(employeeIds: $ids) { invited problems { name message } } }
`);

/**
 * Invite many employees at once: everyone present with a work email and no login, each with the
 * Employee role and linked to their record. All are ticked; untick anyone who should wait.
 * Managers, HR and payroll are still invited one by one, so nobody gets more access by accident.
 */
export function InviteEmployeesDialog({ onClose, onDone }: { onClose: () => void; onDone: (message: string) => void }) {
  const [{ data, error }] = useQuery({ query: CandidatesDocument, requestPolicy: "network-only" });
  const [{ fetching }, invite] = useMutation(InviteEmployeesDocument);
  const [left, setLeft] = useState<Set<string>>(new Set()); // unticked
  const [search, setSearch] = useState("");
  const [problem, setProblem] = useState<string>();
  const people = useMemo(() => data?.inviteCandidates.people ?? [], [data]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? people.filter((p) => `${p.name} ${p.email} ${p.department ?? ""}`.toLowerCase().includes(q)) : people;
  }, [people, search]);
  const chosen = people.filter((p) => !left.has(p.employeeId));
  const allShownTicked = shown.every((p) => !left.has(p.employeeId));

  function toggle(id: string, on: boolean) {
    setLeft((s) => { const next = new Set(s); if (on) next.delete(id); else next.add(id); return next; });
  }

  async function send() {
    setProblem(undefined);
    const r = await invite({ ids: chosen.map((p) => p.employeeId) });
    const result = r.data?.inviteEmployees;
    if (!result) return setProblem(errorMessage(r.error) ?? "The invitations could not be sent. Try again.");
    const sent = `${result.invited} ${result.invited === 1 ? "invitation" : "invitations"} sent.`;
    const failed = result.problems.length
      ? ` Not invited: ${result.problems.map((p) => `${p.name} (${p.message})`).join("; ")}.`
      : "";
    onDone(sent + failed);
  }

  const without = data?.inviteCandidates.withoutEmail ?? 0;
  return (
    <Dialog open wide onClose={onClose} title="Invite employees"
      description="Each person gets an email to set a password and sign in, with the Employee role: their own profile, time off, payslips and documents."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={fetching}>Cancel</Button>
        <Button onClick={send} busy={fetching} disabled={!chosen.length}>
          {chosen.length ? `Send ${chosen.length} ${chosen.length === 1 ? "invitation" : "invitations"}` : "Send invitations"}
        </Button>
      </>}>
      <div className="space-y-4">
        {problem && <ErrorNote error={problem} />}
        {error && <ErrorNote error={errorMessage(error)} />}
        {!data && !error ? <Loading /> : !people.length ? (
          <Empty title="Everyone is already invited">
            Everyone with a work email already has a login or an invitation.
            {without > 0 && ` ${without} ${without === 1 ? "person has" : "people have"} no work email yet.`}
          </Empty>
        ) : (
          <>
            {people.length > 8 && (
              <Input placeholder="Search by name, email or department" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
            )}
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <Checkbox label={<span className="font-medium">{allShownTicked ? "Untick all" : "Tick all"}</span>}
                checked={allShownTicked} onChange={(on) => shown.forEach((p) => toggle(p.employeeId, on))} />
              <span className="text-sm text-muted">{chosen.length} of {people.length} chosen</span>
            </div>
            <ul className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {shown.map((p) => (
                <li key={p.employeeId}>
                  <Checkbox label={p.name} description={[p.email, p.department].filter(Boolean).join(" · ")}
                    checked={!left.has(p.employeeId)} onChange={(on) => toggle(p.employeeId, on)} />
                </li>
              ))}
            </ul>
          </>
        )}
        {without > 0 && people.length > 0 && (
          <Notice tone="info">
            {without} {without === 1 ? "person has" : "people have"} no work email, so {without === 1 ? "is" : "are"} not listed. Add one on their record to invite them.
          </Notice>
        )}
        <p className="text-xs text-muted">Managers, HR and payroll need more than the Employee role: invite them with <strong>Invite someone</strong>, or change their role here after they join.</p>
      </div>
    </Dialog>
  );
}
