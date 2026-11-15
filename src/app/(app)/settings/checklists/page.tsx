"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { ASSIGNEES } from "@/components/profile/ChecklistBlock";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { graphql } from "@/gql";
import type { ChecklistKind, TaskAssignee, TaskTemplatesQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const TemplatesDocument = graphql(`
  query TaskTemplates {
    taskTemplates { id kind title description category assignee dueOffset isActive appliesTo }
    departments { id name isActive }
    locations { id name isActive }
  }
`);

const SaveTemplateDocument = graphql(`
  mutation SaveTaskTemplate($input: SaveTaskTemplateInput!) {
    saveTaskTemplate(input: $input) { template { id } errors { field message } }
  }
`);

type Template = TaskTemplatesQuery["taskTemplates"][number];

function when(days: number, kind: ChecklistKind) {
  const anchor = kind === "ONBOARDING" ? "start" : "last day";
  if (days === 0) return `On ${anchor === "start" ? "the start date" : "the last day"}`;
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ${days < 0 ? "before" : "after"} ${anchor === "start" ? "start" : "the last day"}`;
}

type Places = { departments: { id: string; name: string; isActive: boolean }[]; locations: { id: string; name: string; isActive: boolean }[] };

function TemplateDialog({ kind, template, places, onClose, onSaved }: {
  kind: ChecklistKind; template: Template | null; places: Places; onClose: () => void; onSaved: () => void;
}) {
  const applies = (template?.appliesTo ?? {}) as Record<string, string[]>;
  const [scope, setScope] = useState({ departments: applies.departments ?? [], locations: applies.locations ?? [] });
  const pick = (k: "departments" | "locations", id: string) =>
    setScope((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id] }));
  const [, save] = useMutation(SaveTemplateDocument);
  const [v, setV] = useState({
    title: template?.title ?? "", category: template?.category ?? "", assignee: template?.assignee ?? ("HR" as TaskAssignee),
    dueOffset: String(template?.dueOffset ?? 0), description: template?.description ?? "", isActive: template?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const bad: Record<string, string> = {};
    if (!v.title.trim()) bad.title = "Give the task a title.";
    if (!/^-?\d+$/.test(v.dueOffset.trim())) bad.dueOffset = "Use a whole number of days, negative for before.";
    setErrors(bad);
    if (Object.keys(bad).length) return;
    setBusy(true);
    const result = await save({ input: { id: template?.id ?? null, kind, title: v.title, category: v.category, assignee: v.assignee,
      dueOffset: Number(v.dueOffset), description: v.description, isActive: v.isActive, appliesTo: scope } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveTaskTemplate.errors, ["title", "category", "assignee", "dueOffset", "description"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title={template ? "Edit task" : "Add task"}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="template-form" busy={busy}>Save</Button>
      </>}>
      <form id="template-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Task" error={errors.title}><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" optional><Input value={v.category} placeholder="Paperwork" onChange={(e) => setV({ ...v, category: e.target.value })} /></Field>
          <Field label="Assigned to">
            <Select value={v.assignee} onChange={(e) => setV({ ...v, assignee: e.target.value as TaskAssignee })}>
              {ASSIGNEES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </Select>
          </Field>
          <Field label="Due (days)" error={errors.dueOffset} hint={/^-?\d+$/.test(v.dueOffset) ? when(Number(v.dueOffset), kind) : undefined}>
            <Input inputMode="numeric" value={v.dueOffset} onChange={(e) => setV({ ...v, dueOffset: e.target.value })} />
          </Field>
        </div>
        <Field label="Details" optional><Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-ink">For</legend>
          <p className="mb-2 text-xs text-muted">Only people in these departments or locations get this task. Leave both empty for everyone.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["departments", "locations"] as const).map((k) => (
              <div key={k} className="max-h-36 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k === "departments" ? "Departments" : "Locations"}</p>
                {places[k].filter((x) => x.isActive).map((x) => (
                  <label key={x.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={scope[k].includes(x.id)} onChange={() => pick(k, x.id)} />{x.name}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </fieldset>
        {template && <Checkbox label="In use" description="Tasks not in use are left out of new checklists." checked={v.isActive} onChange={(c) => setV({ ...v, isActive: c })} />}
      </form>
    </Dialog>
  );
}

export default function ChecklistSetupPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: TemplatesDocument });
  const [kind] = useSettingsTab<ChecklistKind>(["ONBOARDING", "OFFBOARDING"], "ONBOARDING");
  const [editing, setEditing] = useState<{ template: Template | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  if (!can(PERMS.employeesManage)) return <ErrorNote error="You do not have access to checklist setup." />;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const rows = data.taskTemplates.filter((t) => t.kind === kind);

  return (
    <>
      <SettingsIntro>The tasks copied onto a record when you start someone&apos;s checklist.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush title={kind === "ONBOARDING" ? "Onboarding tasks" : "Offboarding tasks"}
        description={kind === "ONBOARDING" ? "Due dates count from the start date." : "Due dates count from the last day."}
        actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={() => setEditing({ template: null })}>Add task</Button>}>
        <Table>
          <thead><tr><TH>Task</TH><TH className="hidden sm:table-cell">Assigned to</TH><TH className="hidden md:table-cell">Due</TH><TH /></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className={t.isActive ? undefined : "text-muted"}>
                <TD>
                  <span className="font-medium">{t.title}</span>{!t.isActive && <span className="ml-2"><Badge>Not in use</Badge></span>}
                  <span className="block text-xs text-muted">{t.category || "Other"}</span>
                </TD>
                <TD className="hidden sm:table-cell">{ASSIGNEES.find((a) => a.value === t.assignee)?.label}</TD>
                <TD className="hidden text-muted md:table-cell">{when(t.dueOffset, kind)}</TD>
                <TD align="right"><Button size="sm" variant="ghost" onClick={() => setEditing({ template: t })}>Edit</Button></TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {editing && <TemplateDialog kind={kind} template={editing.template} places={data} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); setSaved("Task saved."); reload({ requestPolicy: "network-only" }); }} />}
    </>
  );
}
