"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "urql";

import { IconEye, IconLock, IconPlus } from "@/components/icons";
import { ActionDialog, Badge, Button, Card, Checkbox, cardFrame, FrameSlot, type Frame, Dialog, ErrorNote, Field, Input, Select, Textarea } from "@/components/ui";
import { ListInput } from "@/components/settings/OptionLists";
import { graphql } from "@/gql";

import { BankFields } from "./BankFields";
import type { EmployeeProfileQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors } from "@/lib/forms";

type Employee = EmployeeProfileQuery["employee"];
type Contact = Employee["emergencyContacts"][number];
type CustomValue = Employee["customValues"][number];

/* ------------------------------------------------------- Emergency contacts */

const SaveContactDocument = graphql(`
  mutation SaveEmergencyContact($input: EmergencyContactInput!) {
    saveEmergencyContact(input: $input) { contact { id } errors { field message } }
  }
`);

const DeleteContactDocument = graphql(`
  mutation DeleteEmergencyContact($id: ID!) {
    deleteEmergencyContact(id: $id)
  }
`);

function ContactDialog({ employeeId, contact, onClose, onSaved }: {
  employeeId: string; contact: Contact | null; onClose: () => void; onSaved: () => void;
}) {
  const [, save] = useMutation(SaveContactDocument);
  const [v, setV] = useState({
    name: contact?.name ?? "", relationship: contact?.relationship ?? "", phone: contact?.phone ?? "",
    workPhone: contact?.workPhone ?? "", workPhoneExt: contact?.workPhoneExt ?? "", homePhone: contact?.homePhone ?? "",
    email: contact?.email ?? "", addressLine1: contact?.addressLine1 ?? "", addressLine2: contact?.addressLine2 ?? "",
    city: contact?.city ?? "", state: contact?.state ?? "", postalCode: contact?.postalCode ?? "", country: contact?.country ?? "",
    isPrimary: contact?.isPrimary ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!v.name.trim()) missing.name = "Enter a name.";
    if (!v.phone.trim() && !v.workPhone.trim() && !v.homePhone.trim()) missing.phone = "Enter at least one phone number.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    const result = await save({ input: { id: contact?.id ?? null, employeeId, ...v } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveEmergencyContact.errors, ["name", "relationship", "phone", "workPhone", "homePhone", "email", "postalCode"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title={contact ? "Edit emergency contact" : "Add emergency contact"}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="contact-form" busy={busy}>Save</Button>
      </>}>
      <form id="contact-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name}><Input value={v.name} aria-invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Relationship" optional error={errors.relationship}><ListInput id="contact-relationship" listKey="RELATIONSHIP" value={v.relationship} placeholder="Spouse" onChange={(e) => set("relationship", e.target.value)} /></Field>
          <Field label="Mobile phone" error={errors.phone}><Input type="tel" value={v.phone} aria-invalid={!!errors.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Home phone" optional error={errors.homePhone}><Input type="tel" value={v.homePhone} onChange={(e) => set("homePhone", e.target.value)} /></Field>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <Field label="Work phone" optional error={errors.workPhone}><Input type="tel" value={v.workPhone} onChange={(e) => set("workPhone", e.target.value)} /></Field>
            <Field label="Ext" optional><Input value={v.workPhoneExt} onChange={(e) => set("workPhoneExt", e.target.value)} /></Field>
          </div>
          <Field label="Email" optional error={errors.email}><Input type="email" value={v.email} aria-invalid={!!errors.email} onChange={(e) => set("email", e.target.value)} /></Field>
        </div>
        <fieldset className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <legend className="sr-only">Address</legend>
          <Field label="Address line 1" optional><Input value={v.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} /></Field>
          <Field label="Address line 2" optional><Input value={v.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} /></Field>
          <Field label="City" optional><Input value={v.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="State" optional><Input value={v.state} onChange={(e) => set("state", e.target.value)} /></Field>
          <Field label="Postcode" optional error={errors.postalCode}><Input value={v.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></Field>
          <Field label="Country" optional><Input value={v.country} onChange={(e) => set("country", e.target.value)} /></Field>
        </fieldset>
        <Checkbox label="Call this person first" checked={v.isPrimary} onChange={(c) => set("isPrimary", c)} />
      </form>
    </Dialog>
  );
}

export function EmergencyContactsCard({ employee, canEdit, onChanged, frame = cardFrame("Emergency contacts") }: {
  employee: Employee; canEdit: boolean; onChanged: () => void; frame?: Frame;
}) {
  const [editing, setEditing] = useState<{ contact: Contact | null } | null>(null);
  const [removing, setRemoving] = useState<Contact | null>(null);
  const [, remove] = useMutation(DeleteContactDocument);
  const contacts = employee.emergencyContacts;
  if (!contacts.length && !canEdit) return null;

  return (
    <FrameSlot frame={frame} flush
      actions={canEdit ? <Button size="sm" variant="ghost" icon={<IconPlus size={14} />} className="-my-1 -mr-2" onClick={() => setEditing({ contact: null })}>Add</Button> : undefined}>
      {contacts.length ? (
        <ul className="divide-y divide-line">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 px-5 py-4 text-sm sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-ink">
                  {c.name}{c.relationship && <span className="font-normal text-muted">{c.relationship}</span>}
                  {c.isPrimary && <Badge tone="brand">Primary contact</Badge>}
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {([
                    ["Mobile phone", c.phone], ["Work phone", c.workPhone && `${c.workPhone}${c.workPhoneExt ? ` ext. ${c.workPhoneExt}` : ""}`],
                    ["Home phone", c.homePhone], ["Email", c.email],
                    ["Address", [c.addressLine1, c.addressLine2, c.city, c.state, c.postalCode, c.country].filter(Boolean).join(", ")],
                  ] as const).filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className={label === "Address" ? "sm:col-span-2" : undefined}>
                      <dt className="text-[13px] text-muted">{label}</dt>
                      <dd className="mt-0.5 break-words text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {canEdit && (
                <div className="flex flex-none">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ contact: c })}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRemoving(c)}>Remove</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted">No one listed yet.</p>
      )}
      {editing && (
        <ContactDialog employeeId={employee.id} contact={editing.contact} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }} />
      )}
      <ActionDialog open={removing !== null} onClose={() => setRemoving(null)} title={`Remove ${removing?.name ?? "contact"}?`}
        confirmLabel="Remove" tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          const result = await remove({ id: removing.id });
          if (result.error) throw new Error(errorMessage(result.error));
          onChanged();
        }} />
    </FrameSlot>
  );
}

/* ---------------------------------------------------------- Private details */

const RevealDocument = graphql(`
  mutation RevealPrivateDetails($employeeId: ID!) {
    revealPrivateDetails(employeeId: $employeeId) { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }
  }
`);

const SavePrivateDocument = graphql(`
  mutation SavePrivateDetails($input: PrivateDetailsInput!) {
    savePrivateDetails(input: $input) { details { masked } errors { field message } }
  }
`);

type Private = NonNullable<Employee["privateDetails"]>;
const PRIVATE_LABELS: [keyof Omit<Private, "masked" | "__typename">, string][] = [
  ["bankName", "Bank"], ["bankAccountName", "Account name"], ["bankAccountNumber", "Account number"],
  ["nationalId", "National ID"], ["taxId", "Tax ID"], ["pensionId", "Pension ID"],
];

function PrivateDialog({ employeeId, current, onClose, onSaved }: {
  employeeId: string; current: Private; onClose: () => void; onSaved: () => void;
}) {
  const [, save] = useMutation(SavePrivateDocument);
  // Text fields start filled; number fields start blank so masked values are never sent back.
  const [v, setV] = useState<Record<string, string>>({ bankName: current.bankName, bankAccountName: current.bankAccountName });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    setBusy(true);
    const changes = Object.fromEntries(Object.entries(v).filter(([k, value]) => value !== "" || ["bankName", "bankAccountName"].includes(k)));
    const result = await save({ input: { employeeId, ...changes } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.savePrivateDetails.errors, PRIVATE_LABELS.map(([k]) => k),
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title="Edit bank and ID details"
      description="Numbers are stored encrypted. Leave a number blank to keep what is on file."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="private-form" busy={busy}>Save</Button>
      </>}>
      <form id="private-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <BankFields errors={errors}
            values={{ bankName: v.bankName ?? "", bankAccountNumber: v.bankAccountNumber ?? "", bankAccountName: v.bankAccountName ?? "" }}
            onChange={(key, value) => setV((s) => ({ ...s, [key]: value }))}
            numberHint={current.bankAccountNumber ? `On file: ${current.bankAccountNumber}` : undefined} />
          {PRIVATE_LABELS.filter(([key]) => !key.startsWith("bank")).map(([key, label]) => {
            const secret = !["bankName", "bankAccountName"].includes(key);
            return (
              <Field key={key} label={label} error={errors[key]} hint={secret && current[key] ? `On file: ${current[key]}` : undefined}>
                <Input value={v[key] ?? ""} aria-invalid={!!errors[key]} inputMode={key === "bankAccountNumber" ? "numeric" : undefined}
                  autoComplete="off" onChange={(e) => setV((s) => ({ ...s, [key]: e.target.value }))} />
              </Field>
            );
          })}
        </div>
      </form>
    </Dialog>
  );
}

const lockedFrame = cardFrame(<span className="flex items-center gap-2"><IconLock size={15} className="text-muted" />Bank and ID details</span>);

export function PrivateDetailsCard({ employee, canEdit, onChanged, frame }: {
  employee: Employee; canEdit: boolean; onChanged: () => void; frame?: Frame;
}) {
  const shell = frame ?? lockedFrame;
  const [, reveal] = useMutation(RevealDocument);
  const [shown, setShown] = useState<Private | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const details = employee.privateDetails;
  if (!details) return null;
  const view = shown ?? details;
  const empty = PRIVATE_LABELS.every(([k]) => !details[k]);

  return (
    <FrameSlot frame={shell}
      actions={<div className="-my-1 -mr-2 flex">
        {!empty && !shown && (
          <Button size="sm" variant="ghost" icon={<IconEye size={14} />} onClick={async () => {
            setError(undefined);
            const result = await reveal({ employeeId: employee.id });
            if (result.data) setShown(result.data.revealPrivateDetails);
            else setError(errorMessage(result.error));
          }}>Show</Button>
        )}
        {shown && <Button size="sm" variant="ghost" onClick={() => setShown(null)}>Hide</Button>}
        {canEdit && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>}
      </div>}>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      {empty ? (
        <p className="text-sm text-muted">Nothing on file.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          {PRIVATE_LABELS.filter(([k]) => details[k]).map(([key, label]) => (
            <div key={key} className="min-w-0">
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="mt-0.5 truncate font-mono text-sm text-ink tabular-nums">{view[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {shown && <p className="mt-4 text-xs text-muted">Showing in full. This view was recorded in the audit log.</p>}
      {editing && (
        <PrivateDialog employeeId={employee.id} current={details} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setShown(null); onChanged(); }} />
      )}
    </FrameSlot>
  );
}

/* ------------------------------------------------------------ Custom fields */

const SetCustomDocument = graphql(`
  mutation SetEmployeeCustomValues($employeeId: ID!, $values: JSON!) {
    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }
  }
`);

/** "t_shirt_size" as the API names it in errors: "tShirtSize". */
const camel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function displayValue(v: CustomValue) {
  if (v.value === null || v.value === undefined || v.value === "") return null;
  if (v.field.fieldType === "YES_NO") return v.value ? "Yes" : "No";
  if (v.field.fieldType === "DATE") return formatDate(String(v.value));
  return String(v.value);
}

function CustomDialog({ employeeId, values, onClose, onSaved }: {
  employeeId: string; values: CustomValue[]; onClose: () => void; onSaved: () => void;
}) {
  const [, save] = useMutation(SetCustomDocument);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(values.map((x) => [
    x.field.key, x.value === null || x.value === undefined ? "" : x.field.fieldType === "YES_NO" ? (x.value ? "yes" : "no") : String(x.value),
  ])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    setBusy(true);
    const result = await save({ employeeId, values: Object.fromEntries(Object.entries(v).map(([k, value]) => [k, value || null])) });
    setBusy(false);
    const found: Record<string, string> = {};
    const keys = values.map((x) => x.field.key);
    const failed = reportErrors(result, result.data?.setEmployeeCustomValues.errors, keys.map(camel),
      (f, m) => { found[keys.find((k) => camel(k) === f) ?? f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title="Edit additional details"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="custom-form" busy={busy}>Save</Button>
      </>}>
      <form id="custom-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map(({ field }) => {
            const set = (value: string) => setV((s) => ({ ...s, [field.key]: value }));
            const value = v[field.key] ?? "";
            return (
              <Field key={field.key} label={field.name} optional hint={field.helpText || undefined} error={errors[field.key]}>
                {field.fieldType === "CHOICE" ? (
                  <Select value={value} onChange={(e) => set(e.target.value)}>
                    <option value="">Not set</option>
                    {field.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                ) : field.fieldType === "YES_NO" ? (
                  <Select value={value} onChange={(e) => set(e.target.value)}>
                    <option value="">Not set</option><option value="yes">Yes</option><option value="no">No</option>
                  </Select>
                ) : field.fieldType === "TEXT" && value.length > 60 ? (
                  <Textarea rows={2} value={value} onChange={(e) => set(e.target.value)} />
                ) : (
                  <Input type={field.fieldType === "DATE" ? "date" : "text"} inputMode={field.fieldType === "NUMBER" ? "decimal" : undefined}
                    value={value} aria-invalid={!!errors[field.key]} onChange={(e) => set(e.target.value)} />
                )}
              </Field>
            );
          })}
        </div>
      </form>
    </Dialog>
  );
}

export function CustomFieldsCard({ employee, canEdit, onChanged }: { employee: Employee; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const values = employee.customValues;
  if (!values.length) return null;
  return (
    <Card title="Additional details" actions={canEdit ? <Button size="sm" variant="ghost" className="-my-1 -mr-2" onClick={() => setEditing(true)}>Edit</Button> : undefined}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.field.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[13px] text-muted">{v.field.name}{v.field.hrOnly && <IconLock size={11} aria-label="HR only" />}</dt>
            <dd className="mt-0.5 truncate text-sm text-ink">{displayValue(v) ?? <span className="text-muted">—</span>}</dd>
          </div>
        ))}
      </dl>
      {editing && (
        <CustomDialog employeeId={employee.id} values={values} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onChanged(); }} />
      )}
    </Card>
  );
}
