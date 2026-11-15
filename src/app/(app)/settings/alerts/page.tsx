"use client";

import { faPaperPlane, faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { EmailAlertsAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const AlertsDocument = graphql(`
  query EmailAlertsAdmin {
    emailAlerts { id name kind field daysBefore recipients enabled lastSentOn }
    alertOptions { kinds { key label } dateFields { key label } recipientTypes { key label } }
    roles { code name }
    members { id fullName email isActive }
  }
`);

const SaveDocument = graphql(`
  mutation SaveEmailAlert($input: EmailAlertInput!) {
    saveEmailAlert(input: $input) { alert { id } errors { field message } }
  }
`);

const DeleteDocument = graphql(`mutation DeleteEmailAlert($id: ID!) { deleteEmailAlert(id: $id) }`);
const SendDocument = graphql(`mutation SendEmailAlertNow($id: ID!) { sendEmailAlertNow(id: $id) }`);

type Data = EmailAlertsAdminQuery;
type Alert = Data["emailAlerts"][number];
type Recipient = { type: string; role?: string; member?: string };

function AlertDialog({ alert, data, onClose, onSaved }: { alert: Alert | null; data: Data; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(alert?.name ?? "");
  const [kind, setKind] = useState(alert?.kind ?? "birthday");
  const [field, setField] = useState(alert?.field ?? "");
  const [days, setDays] = useState(String(alert?.daysBefore ?? 0));
  const [recipients, setRecipients] = useState<Recipient[]>((alert?.recipients as Recipient[]) ?? [{ type: "role", role: "hr_admin" }]);
  const [enabled, setEnabled] = useState(alert?.enabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveDocument);
  const summary = kind === "monthly_summary";
  const setRecipient = (i: number, patch: Partial<Recipient>) => setRecipients(recipients.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Dialog open wide onClose={onClose} title={alert ? `Edit ${alert.name}` : "New email alert"}
      description="Sent each morning, in the app and by email."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: alert?.id ?? null, name, kind, field, daysBefore: Number(days) || 0, recipients, enabled } });
          const problems = r.data?.saveEmailAlert.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save alert</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Probation ending soon" /></Field>
        <Field label="About" error={errors.kind}>
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            {data.alertOptions.kinds.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
          </Select>
        </Field>
        {kind === "date_field" && (
          <Field label="Date field" error={errors.field}>
            <Select value={field} onChange={(e) => setField(e.target.value)}>
              <option value="">Choose…</option>
              {data.alertOptions.dateFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </Select>
          </Field>
        )}
        {!summary && (
          <Field label="Days before" error={errors.daysBefore} hint="0 sends it on the day.">
            <Input type="number" min={0} max={90} value={days} onChange={(e) => setDays(e.target.value)} />
          </Field>
        )}
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-ink">Send to</p>
          {errors.recipients && <p className="mb-2 text-sm text-red-700 dark:text-red-300">{errors.recipients}</p>}
          <ul className="space-y-2">
            {recipients.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <Select aria-label="Recipient" value={r.type} onChange={(e) => setRecipient(i, { type: e.target.value, role: undefined, member: undefined })} className="w-60">
                  {data.alertOptions.recipientTypes.filter((t) => !summary || ["role", "person"].includes(t.key))
                    .map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </Select>
                {r.type === "role" && (
                  <Select aria-label="Access level" value={r.role ?? ""} onChange={(e) => setRecipient(i, { role: e.target.value })} className="w-48">
                    {data.roles.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
                  </Select>
                )}
                {r.type === "person" && (
                  <Select aria-label="Person" value={r.member ?? ""} onChange={(e) => setRecipient(i, { member: e.target.value })} className="w-56">
                    <option value="">Choose…</option>
                    {data.members.filter((m) => m.isActive).map((m) => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
                  </Select>
                )}
                <IconButton label="Remove" onClick={() => setRecipients(recipients.filter((_, j) => j !== i))}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-2" icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setRecipients([...recipients, { type: "role", role: data.roles[0]?.code }])}>Add recipient</Button>
        </div>
        <div className="sm:col-span-2"><Checkbox label="On" checked={enabled} onChange={setEnabled} /></div>
      </div>
    </Dialog>
  );
}

export default function EmailAlertsPage() {
  const [{ data, error }, reload] = useQuery({ query: AlertsDocument });
  const [editing, setEditing] = useState<{ alert: Alert | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  const [, remove] = useMutation(DeleteDocument);
  const [, send] = useMutation(SendDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const refresh = (m: string) => { setSaved(m); reload({ requestPolicy: "network-only" }); };
  const kindLabel = (k: string) => data.alertOptions.kinds.find((x) => x.key === k)?.label ?? k;

  return (
    <>
      <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ alert: null })}>New alert</Button>}>
        Reminders HR sets up: birthdays, work anniversaries, new starters, a monthly summary, or any date on a record.
      </SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush>
        {data.emailAlerts.length ? (
          <Table>
            <thead><tr><TH>Alert</TH><TH>About</TH><TH>When</TH><TH>Last sent</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.emailAlerts.map((a) => (
                <tr key={a.id} className={a.enabled ? undefined : "text-muted"}>
                  <TD className="font-medium">{a.name}{!a.enabled && <Badge>Off</Badge>}</TD>
                  <TD>{kindLabel(a.kind)}{a.field && <span className="block text-xs text-muted">{data.alertOptions.dateFields.find((f) => f.key === a.field)?.label}</span>}</TD>
                  <TD>{a.kind === "monthly_summary" ? "1st of the month" : a.daysBefore ? `${a.daysBefore} days before` : "On the day"}</TD>
                  <TD className="text-muted">{a.lastSentOn ? formatDate(a.lastSentOn) : "Not yet"}</TD>
                  <TD align="right" className="whitespace-nowrap">
                    <IconButton label={`Send ${a.name} now`} onClick={async () => { const r = await send({ id: a.id }); refresh(r.error ? errorMessage(r.error) ?? "" : `${a.name}: ${r.data?.sendEmailAlertNow ?? 0} notifications sent.`); }}>
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </IconButton>
                    <IconButton label={`Edit ${a.name}`} onClick={() => setEditing({ alert: a })}><FontAwesomeIcon icon={faPen} /></IconButton>
                    <IconButton label={`Delete ${a.name}`} onClick={async () => { await remove({ id: a.id }); refresh(`${a.name} deleted.`); }}><FontAwesomeIcon icon={faTrash} /></IconButton>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No alerts yet. Start with birthdays or probation ending.</p>}
      </Card>
      {editing && <AlertDialog alert={editing.alert} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh("Alert saved."); }} />}
    </>
  );
}
