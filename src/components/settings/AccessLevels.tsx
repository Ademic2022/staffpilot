"use client";

import { faCopy, faEye, faLock, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, Button, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Textarea, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { AccessLevelsQuery, RoleScope } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

import { useViewAs } from "./viewAs";

const AccessLevelsDocument = graphql(`
  query AccessLevels {
    roles { id code name description permissions scope isSystem fieldAccess memberCount }
    permissionCatalog { code description }
    fieldGroups { key description }
    members { id fullName email isActive invitePending lastLogin roles { code } }
    me { user { email } }
  }
`);

const SaveRoleDocument = graphql(`
  mutation SaveRole($input: SaveRoleInput!) {
    saveRole(input: $input) { role { id } errors { field message } }
  }
`);

const DuplicateRoleDocument = graphql(`
  mutation DuplicateRole($id: ID!, $name: String!) {
    duplicateRole(id: $id, name: $name) { role { id } errors { field message } }
  }
`);

const DeleteRoleDocument = graphql(`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`);

type Role = AccessLevelsQuery["roles"][number];
type Level = "none" | "view" | "edit";
type Access = { others: Record<string, Level>; self: Record<string, Level> };

const SCOPES: { value: RoleScope; label: string }[] = [
  { value: "ALL", label: "Everyone in the company" },
  { value: "TEAM", label: "Their direct and indirect reports" },
  { value: "DIRECT", label: "Their direct reports only" },
];
const LEVELS: { value: Level; label: string }[] = [{ value: "none", label: "No access" }, { value: "view", label: "View only" }, { value: "edit", label: "Edit" }];

function LevelPicker({ value, onChange, disabled, label }: { value: Level; onChange: (v: Level) => void; disabled?: boolean; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-lg border border-line-strong">
      {LEVELS.map((l) => (
        <button key={l.value} type="button" role="radio" aria-checked={value === l.value} disabled={disabled} onClick={() => onChange(l.value)}
          className={cx("px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed",
            value === l.value ? (l.value === "none" ? "bg-subtle text-ink" : "bg-brand text-white") : "bg-surface text-muted hover:text-ink")}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

function Editor({ role, data, onSaved, onDeleted }: { role: Role; data: AccessLevelsQuery; onSaved: (m: string) => void; onDeleted: () => void }) {
  const access = role.fieldAccess as Access;
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [scope, setScope] = useState<RoleScope>(role.scope);
  const [levels, setLevels] = useState<Access>({ others: { ...access.others }, self: { ...access.self } });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copying, setCopying] = useState(false);
  const [{ fetching }, save] = useMutation(SaveRoleDocument);
  const [, remove] = useMutation(DeleteRoleDocument);
  const locked = role.code === "owner";
  const builtIn = role.isSystem;

  const submit = async () => {
    const result = await save({ input: { id: role.id, name, description, permissions, scope, fieldAccess: levels } });
    const problems = result.data?.saveRole.errors ?? [];
    if (result.error) return setErrors({ "": errorMessage(result.error) ?? "Could not save." });
    if (problems.length) return setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
    setErrors({});
    onSaved(`${name} saved.`);
  };

  return (
    <div className="min-w-0 flex-1 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">{role.name}{builtIn && <Badge>Built in</Badge>}</h3>
          <p className="text-sm text-muted">{role.memberCount} {role.memberCount === 1 ? "person has" : "people have"} this access level.</p>
        </div>
        <div className="flex gap-2">
          {!locked && <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faCopy} />} onClick={() => setCopying(true)}>Duplicate</Button>}
          {!builtIn && (
            <Button size="sm" variant="ghost" icon={<FontAwesomeIcon icon={faTrash} />} disabled={role.memberCount > 0}
              title={role.memberCount > 0 ? "Move everyone off this level first" : undefined}
              onClick={async () => { const r = await remove({ id: role.id }); if (r.error) setErrors({ "": errorMessage(r.error) ?? "" }); else onDeleted(); }}>Delete</Button>
          )}
        </div>
      </div>
      {errors[""] && <ErrorNote error={errors[""]} />}
      {locked ? (
        <Notice title="Full access"><FontAwesomeIcon icon={faLock} className="mr-1.5" />Owners can always see and change everything, so this level cannot be changed.</Notice>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}><Input value={name} disabled={builtIn} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Who it reaches" hint="Whose records the permissions below apply to.">
              <Select value={scope} onChange={(e) => setScope(e.target.value as RoleScope)}>
                {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" optional><Textarea rows={2} value={description} disabled={builtIn} onChange={(e) => setDescription(e.target.value)} /></Field>
            </div>
          </div>

          <section>
            <h4 className="mb-1 text-[15px] font-semibold text-ink">What they can do</h4>
            {builtIn && <p className="mb-2 text-xs text-muted">Built-in levels keep their permissions. Duplicate one to change them.</p>}
            {errors.permissions && <p className="mb-2 text-sm text-red-700 dark:text-red-300">{errors.permissions}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {data.permissionCatalog.map((p) => (
                <Checkbox key={p.code} label={p.description} disabled={builtIn} checked={permissions.includes(p.code)}
                  onChange={(c) => setPermissions(c ? [...permissions, p.code] : permissions.filter((x) => x !== p.code))} />
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-1 text-[15px] font-semibold text-ink">What they can see</h4>
            <p className="mb-3 text-sm text-muted">
              For other people&apos;s records (within their reach) and for their own. Edit also needs the matching permission above,
              such as changing employee records or pay.
            </p>
            {errors.fieldAccess && <p className="mb-2 text-sm text-red-700 dark:text-red-300">{errors.fieldAccess}</p>}
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-subtle/70">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-ink">Fields</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-ink">About other employees</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-ink">About themselves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.fieldGroups.map((g) => (
                    <tr key={g.key}>
                      <td className="px-4 py-2.5 text-ink">{g.description}</td>
                      {(["others", "self"] as const).map((side) => (
                        <td key={side} className="px-4 py-2.5">
                          <LevelPicker label={`${g.description}, ${side === "others" ? "others" : "themselves"}`} value={levels[side][g.key] ?? "none"}
                            onChange={(v) => setLevels((l) => ({ ...l, [side]: { ...l[side], [g.key]: v } }))} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end"><Button busy={fetching} onClick={submit}>Save access level</Button></div>
        </>
      )}
      <People role={role} data={data} />
      {copying && <CopyDialog role={role} onClose={() => setCopying(false)} onDone={(m) => { setCopying(false); onSaved(m); }} />}
    </div>
  );
}

function People({ role, data }: { role: Role; data: AccessLevelsQuery }) {
  const viewAs = useViewAs();
  const [problem, setProblem] = useState<string>();
  const people = data.members.filter((m) => m.isActive && m.roles.some((r) => r.code === role.code));
  return (
    <section className="border-t border-line pt-5">
      <h4 className="mb-2 text-[15px] font-semibold text-ink">People with this access level ({people.length})</h4>
      {problem && <ErrorNote error={problem} />}
      {people.length ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {people.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{m.fullName || m.email}</span>
                <span className="block truncate text-xs text-muted">{m.lastLogin ? `Last signed in ${formatDate(m.lastLogin)}` : m.invitePending ? "Invited" : "Never signed in"}</span>
              </span>
              {!m.invitePending && m.email !== data.me?.user.email && (
                <IconButton label={`View as ${m.fullName || m.email}`}
                  onClick={async () => { const p = await viewAs(m.id); if (p) setProblem(p); }}><FontAwesomeIcon icon={faEye} /></IconButton>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">No one yet. Give people this level from the Users list.</p>}
    </section>
  );
}

function CopyDialog({ role, onClose, onDone }: { role: Role; onClose: () => void; onDone: (m: string) => void }) {
  const [name, setName] = useState(`${role.name} (copy)`);
  const [error, setError] = useState<string>();
  const [{ fetching }, duplicate] = useMutation(DuplicateRoleDocument);
  return (
    <Dialog open onClose={onClose} title={`Duplicate ${role.name}`} description="The copy starts with the same permissions, reach and field access."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await duplicate({ id: role.id, name });
          const problem = errorMessage(r.error) ?? r.data?.duplicateRole.errors[0]?.message;
          if (problem) setError(problem); else onDone(`${name} created.`);
        }}>Duplicate</Button></>}>
      <Field label="Name" error={error}><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
    </Dialog>
  );
}

function NewDialog({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [{ fetching }, save] = useMutation(SaveRoleDocument);
  return (
    <Dialog open onClose={onClose} title="New access level" description="It starts with no permissions; choose them next."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { name, permissions: [], scope: "TEAM", fieldAccess: {} } });
          const problem = errorMessage(r.error) ?? r.data?.saveRole.errors[0]?.message;
          if (problem) setError(problem); else onDone(`${name} created.`);
        }}>Create</Button></>}>
      <Field label="Name" error={error}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team leads Lagos" autoFocus /></Field>
    </Dialog>
  );
}

/** Access levels (as BambooHR calls roles): the list on the left, the chosen one's settings on the right. */
export function AccessLevels() {
  const [{ data, error }, reload] = useQuery({ query: AccessLevelsDocument });
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState<string>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  const refresh = (m?: string) => { setSaved(m); reload({ requestPolicy: "network-only" }); };
  const chosen = data.roles.find((r) => r.id === chosenId) ?? data.roles[0];
  const builtIn = data.roles.filter((r) => r.isSystem);
  const custom = data.roles.filter((r) => !r.isSystem);
  const pill = (r: Role) => (
    <button key={r.id} type="button" onClick={() => { setChosenId(r.id); setSaved(undefined); }} aria-pressed={r.id === chosen?.id}
      className={cx("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
        r.id === chosen?.id ? "border-brand bg-brand text-white" : "border-line-strong text-ink hover:bg-subtle")}>
      {r.name}<span className={cx("text-xs tabular-nums", r.id === chosen?.id ? "text-white/80" : "text-muted")}>{r.memberCount}</span>
    </button>
  );

  return (
    <>
      {saved && <Notice tone="success">{saved}</Notice>}
      <div className="space-y-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">Built in</span>
          {builtIn.map(pill)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">Yours</span>
          {custom.map(pill)}
          <Button size="sm" variant="ghost" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreating(true)}>New access level</Button>
        </div>
      </div>
      {chosen && <Editor key={chosen.id + JSON.stringify(chosen.fieldAccess) + chosen.scope} role={chosen} data={data}
        onSaved={(m) => refresh(m)} onDeleted={() => { setChosenId(null); refresh("Access level deleted."); }} />}
      {creating && <NewDialog onClose={() => setCreating(false)} onDone={(m) => { setCreating(false); refresh(m); }} />}
    </>
  );
}
