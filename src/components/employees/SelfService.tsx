"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { Button, Dialog, ErrorNote, Field, Input, Notice } from "@/components/ui";
import { graphql } from "@/gql";

import { BankFields } from "./BankFields";
import type { EmployeeProfileQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors } from "@/lib/forms";

type Employee = EmployeeProfileQuery["employee"];

export const MyChangeRequestsDocument = graphql(`
  query MyChangeRequests {
    myChangeRequests { id status note createdAt decidedAt decidedBy lines { field label current requested } }
  }
`);

const UpdateMyDetailsDocument = graphql(`
  mutation UpdateMyDetails($input: MyDetailsInput!) {
    updateMyDetails(input: $input) { applied request { id } errors { field message } }
  }
`);

const CancelChangeDocument = graphql(`
  mutation CancelChangeRequest($id: ID!) {
    cancelChangeRequest(id: $id) { request { id status } errors { field message } }
  }
`);

const DIRECT = [["preferredName", "Preferred name"], ["personalEmail", "Personal email"], ["phone", "Phone"]] as const;
const REVIEWED = [
  ["firstName", "First name"], ["middleName", "Middle name"], ["lastName", "Last name"],
  ["bankName", "Bank"], ["bankAccountName", "Account name"], ["bankAccountNumber", "Account number"],
  ["nationalId", "NIN (National ID)"], ["taxId", "Tax ID"], ["pensionId", "Pension PIN"],
] as const;
type Key = (typeof DIRECT)[number][0] | (typeof REVIEWED)[number][0];
const SECRET = ["bankAccountNumber", "nationalId", "taxId", "pensionId"] as const;
type SecretKey = (typeof SECRET)[number];
const isSecret = (k: Key): k is SecretKey => (SECRET as readonly string[]).includes(k);

export function MyDetailsDialog({ employee, onClose, onSaved }: { employee: Employee; onClose: () => void; onSaved: (message: string) => void }) {
  const [, update] = useMutation(UpdateMyDetailsDocument);
  const p = employee.privateDetails;
  const start: Record<Key, string> = {
    preferredName: employee.preferredName, personalEmail: employee.personalEmail, phone: employee.phone,
    firstName: employee.firstName, middleName: employee.middleName, lastName: employee.lastName,
    bankName: p?.bankName ?? "", bankAccountName: p?.bankAccountName ?? "",
    // Numbers start empty: only a new number is sent, never the masked one on file.
    bankAccountNumber: "", nationalId: "", taxId: "", pensionId: "",
  };
  const [v, setV] = useState(start);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const field = (key: Key, label: string, hint?: string) => (
    <Field key={key} label={label} error={errors[key]} optional={key !== "firstName" && key !== "lastName"} hint={hint}>
      <Input value={v[key]} aria-invalid={!!errors[key]} autoComplete="off"
        type={key === "personalEmail" ? "email" : key === "phone" ? "tel" : "text"}
        onChange={(e) => setV((s) => ({ ...s, [key]: e.target.value }))} />
    </Field>
  );

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const changed = Object.fromEntries((Object.keys(v) as Key[]).filter((k) => v[k] !== start[k]).map((k) => [k, v[k].trim()]));
    if (!Object.keys(changed).length) return setFormError("Nothing has changed.");
    setBusy(true);
    const result = await update({ input: changed });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.updateMyDetails.errors, Object.keys(start) as Key[], (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (failed) return;
    const sent = Boolean(result.data?.updateMyDetails.request);
    const applied = result.data?.updateMyDetails.applied.length ?? 0;
    onSaved(sent ? (applied ? "Contact details saved. The rest has gone to HR to approve." : "Sent to HR to approve. You will hear when it is done.") : "Contact details saved.");
  }

  return (
    <Dialog open wide onClose={onClose} title="Update my details"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="my-details" busy={busy}>Save</Button>
      </>}>
      <form id="my-details" onSubmit={submit} noValidate className="space-y-5">
        {formError && <ErrorNote error={formError} />}
        <fieldset className="space-y-3">
          <legend className="text-[13px] font-semibold text-ink">Contact details</legend>
          <p className="text-xs text-muted">Saved straight away.</p>
          <div className="grid gap-4 sm:grid-cols-3">{DIRECT.map(([k, l]) => field(k, l))}</div>
        </fieldset>
        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[13px] font-semibold text-ink">Checked by HR first</legend>
          <p className="text-xs text-muted">Your legal name, bank details and ID numbers feed payroll and tax filings, so HR approves changes before they apply.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {REVIEWED.filter(([k]) => !k.startsWith("bank")).map(([k, l]) => field(k, l, isSecret(k) && p?.[k] ? `On file: ${p[k]}. Leave empty to keep.` : undefined))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <BankFields errors={errors} values={{ bankName: v.bankName, bankAccountNumber: v.bankAccountNumber, bankAccountName: v.bankAccountName }}
              onChange={(key, value) => setV((s) => ({ ...s, [key]: value }))}
              numberHint={p?.bankAccountNumber ? `On file: ${p.bankAccountNumber}. Leave empty to keep.` : undefined} />
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}

/** On your own profile: the change waiting for HR, or the last decision. */
export function MyChangeNotice({ onChanged }: { onChanged: () => void }) {
  const [{ data }, reload] = useQuery({ query: MyChangeRequestsDocument });
  const [, cancel] = useMutation(CancelChangeDocument);
  const [error, setError] = useState<string>();
  // A rejection stays on the profile for two weeks.
  const [cutoff] = useState(() => Date.now() - 14 * 86_400_000);
  const latest = data?.myChangeRequests[0];
  if (!latest) return null;
  const fields = latest.lines.map((l) => l.label.toLowerCase()).join(", ");
  if (latest.status === "PENDING") {
    return (
      <Notice tone="info" title="Waiting for HR">
        <span>Your change to your {fields} was sent on {formatDate(latest.createdAt)}. </span>
        <button className="font-semibold underline-offset-2 hover:underline" onClick={async () => {
          const result = await cancel({ id: latest.id });
          const problem = errorMessage(result.error) ?? result.data?.cancelChangeRequest.errors[0]?.message;
          if (problem) return setError(problem);
          reload({ requestPolicy: "network-only" });
          onChanged();
        }}>Withdraw it</button>
        {error && <span className="block">{error}</span>}
      </Notice>
    );
  }
  if (latest.status === "REJECTED" && latest.decidedAt && new Date(latest.decidedAt).getTime() > cutoff) {
    return (
      <Notice tone="warning" title="HR did not approve your last change">
        Your change to your {fields}{latest.note ? `: “${latest.note}”` : "."}
      </Notice>
    );
  }
  return null;
}
