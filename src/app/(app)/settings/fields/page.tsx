"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { Badge, Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { OptionLists } from "@/components/settings/OptionLists";
import { graphql } from "@/gql";
import type { CustomFieldsAdminQuery, CustomFieldType } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const CustomFieldsAdminDocument = graphql(`
  query CustomFieldsAdmin {
    customFields(includeInactive: true) { id name key fieldType choices helpText hrOnly position isActive }
  }
`);

const SaveFieldDocument = graphql(`
  mutation SaveCustomField($input: SaveCustomFieldInput!) {
    saveCustomField(input: $input) { field { id } errors { field message } }
  }
`);

type Row = CustomFieldsAdminQuery["customFields"][number];

const TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "TEXT", label: "Text" }, { value: "NUMBER", label: "Number" }, { value: "DATE", label: "Date" },
  { value: "CHOICE", label: "Choice from a list" }, { value: "YES_NO", label: "Yes or no" },
];

function FieldDialog({ row, nextPosition, onClose, onSaved }: { row: Row | null; nextPosition: number; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveFieldDocument);
  const [v, setV] = useState({
    name: row?.name ?? "", fieldType: (row?.fieldType ?? "TEXT") as CustomFieldType, choices: (row?.choices ?? []).join("\n"),
    helpText: row?.helpText ?? "", hrOnly: row?.hrOnly ?? false, isActive: row?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    if (!v.name.trim()) return setErrors({ name: "Enter a name." });
    setBusy(true);
    const result = await save({ input: {
      id: row?.id ?? null, name: v.name.trim(), fieldType: v.fieldType, helpText: v.helpText.trim(), hrOnly: v.hrOnly,
      isActive: v.isActive, choices: v.choices.split("\n").map((c) => c.trim()).filter(Boolean),
      ...(row ? {} : { position: nextPosition }),
    } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveCustomField.errors, ["name", "fieldType", "choices"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title={row ? "Edit field" : "Add field"}
      description={row ? `Imports and exports use the column "${row.name}".` : "It appears on every employee's record, and as a column in imports and exports."}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="field-form" busy={busy}>Save</Button>
      </>}>
      <form id="field-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Name" error={errors.name}>
          <Input value={v.name} aria-invalid={!!errors.name} placeholder="T-shirt size" onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Type" error={errors.fieldType}>
          <Select value={v.fieldType} onChange={(e) => set("fieldType", e.target.value as CustomFieldType)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        {v.fieldType === "CHOICE" && (
          <Field label="Choices" hint="One per line." error={errors.choices}>
            <textarea rows={4} value={v.choices} onChange={(e) => set("choices", e.target.value)}
              className="block w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink shadow-sm outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15" />
          </Field>
        )}
        <Field label="Help text" optional>
          <Input value={v.helpText} onChange={(e) => set("helpText", e.target.value)} />
        </Field>
        <Checkbox label="HR only" description="Hidden from managers and the employee." checked={v.hrOnly} onChange={(c) => set("hrOnly", c)} />
        {row && <Checkbox label="Active" description="Inactive fields are hidden. Their values are kept." checked={v.isActive} onChange={(c) => set("isActive", c)} />}
      </form>
    </Dialog>
  );
}

export default function CustomFieldsPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: CustomFieldsAdminDocument });
  const [editing, setEditing] = useState<{ row: Row | null } | null>(null);
  const [tab] = useSettingsTab(["fields", "lists"] as const, "fields");
  const [saved, setSaved] = useState<string>();

  if (!can(PERMS.employeesManage)) return <Notice tone="warning">You do not have permission to set up employee fields.</Notice>;
  if (tab === "lists") return <><SettingsIntro>The choices offered for reasons, relationships and degrees.</SettingsIntro><OptionLists /></>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const fields = data.customFields;

  return (
    <>
      <SettingsIntro>Extra details your company keeps on every employee.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={() => { setSaved(undefined); setEditing({ row: null }); }}>Add field</Button>}
        title="Fields">
        {fields.length ? (
          <Table>
            <thead><tr><TH>Field</TH><TH>Type</TH><TH>Who sees it</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id} className={f.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">{f.name}{f.helpText && <span className="block text-xs font-normal text-muted">{f.helpText}</span>}</TD>
                  <TD>{TYPES.find((t) => t.value === f.fieldType)?.label}{f.fieldType === "CHOICE" && <span className="block text-xs text-muted">{f.choices.join(", ")}</span>}</TD>
                  <TD>{f.hrOnly ? "HR only" : "Anyone who can see the record"}</TD>
                  <TD>{f.isActive ? <Badge tone="good" dot>Active</Badge> : <Badge>Inactive</Badge>}</TD>
                  <TD align="right"><Button size="sm" variant="ghost" onClick={() => { setSaved(undefined); setEditing({ row: f }); }}>Edit</Button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5"><Empty title="No extra fields yet">Add fields such as T-shirt size, badge number or a background check.</Empty></div>
        )}
      </Card>
      {editing && (
        <FieldDialog row={editing.row} nextPosition={fields.length} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setSaved("Field saved."); reload({ requestPolicy: "network-only" }); }} />
      )}
    </>
  );
}
