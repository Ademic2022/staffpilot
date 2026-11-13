"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { faEye, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { AccessLevels } from "@/components/settings/AccessLevels";
import { InviteEmployeesDialog } from "@/components/settings/InviteEmployees";
import { ApiKeys } from "@/components/settings/Integrations";
import { useViewAs } from "@/components/settings/viewAs";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { graphql } from "@/gql";
import type { UsersAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const UsersAdminDocument = graphql(`
  query UsersAdmin {
    members {
      id email firstName lastName fullName isActive invitePending lastLogin
      roles { code name scope }
      employee { id name }
      legalEntities { id name }
      locations { id name }
      departments { id name }
    }
    roles { id code name scope permissions }
    legalEntities { id name isActive }
    locations { id name isActive }
    departments { id name isActive }
    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE, CANDIDATE] }) { nodes { id fullName } }
  }
`);

const InviteDocument = graphql(`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) { member { id } errors { field message } }
  }
`);

const UpdateMemberDocument = graphql(`
  mutation UpdateMember($input: UpdateMemberInput!) {
    updateMember(input: $input) { member { id } errors { field message } }
  }
`);

const CorrectInviteDocument = graphql(`
  mutation CorrectInvite($input: CorrectInviteInput!) {
    correctInvite(input: $input) { member { id } errors { field message } }
  }
`);

const CancelInviteDocument = graphql(`
  mutation CancelInvite($id: ID!) {
    cancelInvite(id: $id) { errors { field message } }
  }
`);

const ResendDocument = graphql(`
  mutation ResendInvite($id: ID!) {
    resendInvite(id: $id)
  }
`);

type Data = UsersAdminQuery;
type Member = Data["members"][number];

const ROLE_HELP: Record<string, string> = {
  owner: "Everything, including company settings.",
  hr_admin: "Everything except company settings.",
  payroll_officer: "Sees everyone; sees and changes pay.",
  manager: "Sees and approves for their own team.",
  employee: "Their own record, leave and documents.",
  former_employee: "For people who have left: their own record only.",
};

function exportCsv(members: Member[]) {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const rows = [["Name", "Email", "Employee", "Access levels", "Status", "Last sign-in"],
    ...members.map((m) => [m.fullName, m.email, m.employee?.name ?? "", m.roles.map((r) => r.name).join("; "),
      !m.isActive ? "No access" : m.invitePending ? "Invited" : "Active", m.lastLogin ? m.lastLogin.slice(0, 16).replace("T", " ") : ""])];
  const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "users.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CheckList({ label, hint, options, chosen, onChange }: {
  label: string; hint?: string; options: { id: string; name: string }[]; chosen: string[]; onChange: (ids: string[]) => void;
}) {
  return (
    <Field label={label} hint={hint} optional>
      <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-line-strong p-3">
        {options.length ? options.map((o) => (
          <Checkbox key={o.id} label={o.name} checked={chosen.includes(o.id)}
            onChange={(c) => onChange(c ? [...chosen, o.id] : chosen.filter((x) => x !== o.id))} />
        )) : <span className="text-xs text-muted">None set up.</span>}
      </div>
    </Field>
  );
}

function MemberDialog({ data, member, onClose, onSaved }: { data: Data; member: Member | null; onClose: () => void; onSaved: (message: string) => void }) {
  const { me, can } = useSession();
  const [, invite] = useMutation(InviteDocument);
  const [, update] = useMutation(UpdateMemberDocument);
  const [, correct] = useMutation(CorrectInviteDocument);
  const [, cancelInvite] = useMutation(CancelInviteDocument);
  const [email, setEmail] = useState(member?.email ?? "");
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  // Until someone accepts, their address and name can still be fixed (a typo in the invite, say).
  const editableIdentity = !member || member.invitePending;
  const identityChanged = Boolean(member) && (email.trim().toLowerCase() !== member!.email || firstName.trim() !== member!.firstName || lastName.trim() !== member!.lastName);
  const [roles, setRoles] = useState<string[]>(member ? member.roles.map((r) => r.code) : ["employee"]);
  const [employeeId, setEmployeeId] = useState(member?.employee?.id ?? "");
  const [active, setActive] = useState(member?.isActive ?? true);
  const [entities, setEntities] = useState(member?.legalEntities.map((x) => x.id) ?? []);
  const [locations, setLocations] = useState(member?.locations.map((x) => x.id) ?? []);
  const [departments, setDepartments] = useState(member?.departments.map((x) => x.id) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const self = member?.email === me?.user.email;
  const withActive = <T extends { isActive: boolean; id: string }>(xs: T[], keep: string[]) => xs.filter((x) => x.isActive || keep.includes(x.id));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (editableIdentity && !email.includes("@")) missing.email = "Enter an email address.";
    if (editableIdentity && !firstName.trim()) missing.firstName = "Enter a first name.";
    if (!roles.length) missing.roles = "Choose at least one role.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    const scope = { legalEntityIds: entities, locationIds: locations, departmentIds: departments };
    setBusy(true);
    if (member && identityChanged) {
      const fixed = await correct({ input: { id: member.id, email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() } });
      const found: Record<string, string> = {};
      if (reportErrors(fixed, fixed.data?.correctInvite.errors, ["email", "firstName"] as const, (f, m) => { found[f] = m; }, setFormError)) {
        setBusy(false);
        return setErrors(found);
      }
    }
    const result = member
      ? await update({ input: { id: member.id, roleCodes: roles, isActive: active, employeeId: employeeId || null, scope } })
      : await invite({ input: { email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), roleCodes: roles, employeeId: employeeId || null, scope } });
    setBusy(false);
    const payload = result.data && ("updateMember" in result.data ? result.data.updateMember : result.data.inviteMember);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, payload?.errors, ["email", "roles", "employee", "isActive"] as const, (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved(!member ? `Invitation sent to ${email.trim()}.` : identityChanged ? `Invitation corrected and sent again to ${email.trim()}.` : "Access updated.");
  }

  return (
    <Dialog open wide onClose={onClose} title={member ? member.fullName : "Invite someone"}
      description={member ? (member.invitePending ? "Invited, not accepted yet. You can still fix their email or name." : member.email) : "They get an email with a link to choose a password."}
      footer={<>
        {member?.invitePending && (
          <Button variant="ghost" className="mr-auto text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await cancelInvite({ id: member.id });
              setBusy(false);
              const problem = errorMessage(result.error) ?? result.data?.cancelInvite.errors[0]?.message;
              if (problem) return setFormError(problem);
              onSaved(`Invitation to ${member.email} withdrawn.`);
            }}>Cancel invitation</Button>
        )}
        <Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button>
        <Button type="submit" form="member-form" busy={busy}>{!member ? "Send invitation" : identityChanged ? "Save and resend" : "Save"}</Button>
      </>}>
      <form id="member-form" onSubmit={submit} noValidate className="space-y-5">
        {formError && <ErrorNote error={formError} />}
        {editableIdentity && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3"><Field label="Email" error={errors.email}><Input type="email" value={email} aria-invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} /></Field></div>
            <Field label="First name" error={errors.firstName}><Input value={firstName} aria-invalid={!!errors.firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
            <Field label="Last name" optional><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
          </div>
        )}
        <Field label="Roles" error={errors.roles}>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.roles.map((r) => (
              <Checkbox key={r.code} label={r.name} description={ROLE_HELP[r.code] ?? `${r.permissions.length} permissions`}
                disabled={r.code === "owner" && !can(PERMS.tenantManage)}
                checked={roles.includes(r.code)} onChange={(c) => setRoles(c ? [...roles, r.code] : roles.filter((x) => x !== r.code))} />
            ))}
          </div>
        </Field>
        <Field label="Their employee record" optional error={errors.employee} hint="Links their account to their own record, leave and documents.">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Not linked</option>
            {data.employees.nodes.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </Select>
        </Field>
        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[13px] font-medium text-ink">Limit to part of the organization</legend>
          <p className="text-xs text-muted">Leave all empty for no limit. Their permissions then reach only people in the chosen entities, locations and departments (with sub-departments).</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <CheckList label="Legal entities" options={withActive(data.legalEntities, entities)} chosen={entities} onChange={setEntities} />
            <CheckList label="Locations" options={withActive(data.locations, locations)} chosen={locations} onChange={setLocations} />
            <CheckList label="Departments" options={withActive(data.departments, departments)} chosen={departments} onChange={setDepartments} />
          </div>
        </fieldset>
        {member && !self && (
          <Checkbox label="Can sign in" description="Turning this off ends their access straight away. Their records stay." checked={active} onChange={setActive} />
        )}
      </form>
    </Dialog>
  );
}

function scopeSummary(m: Member) {
  const parts = [...m.legalEntities, ...m.locations, ...m.departments].map((x) => x.name);
  const team = m.roles.length > 0 && m.roles.every((r) => r.scope === "TEAM");
  if (team) return parts.length ? `Own team · ${parts.join(", ")}` : "Own team";
  return parts.length ? parts.join(", ") : "Everyone";
}

export default function UsersPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: UsersAdminDocument });
  const [editing, setEditing] = useState<{ member: Member | null } | null>(null);
  const [bulk, setBulk] = useState(false);
  const [, resend] = useMutation(ResendDocument);
  const viewAs = useViewAs();
  const { me } = useSession();
  const [saved, setSaved] = useState<string>();
  const [tab] = useSettingsTab(["users", "levels", "api"] as const, "users");

  if (tab === "api") return <><SettingsIntro>Keys that let other systems, such as payroll or accounting, use this company&apos;s data through the API.</SettingsIntro><ApiKeys /></>;
  if (tab === "levels") return <><SettingsIntro>What each access level may do and see. Give people levels from the Users list.</SettingsIntro><AccessLevels /></>;
  if (!can(PERMS.usersManage)) return <Notice tone="warning">You do not have permission to manage users.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;

  return (
    <>
      <SettingsIntro actions={<><Button variant="secondary" onClick={() => exportCsv(data.members)}>Export</Button><Button variant="secondary" onClick={() => { setSaved(undefined); setBulk(true); }}>Invite employees</Button><Button icon={<IconPlus size={16} />} onClick={() => { setSaved(undefined); setEditing({ member: null }); }}>Invite someone</Button></>}>Who can sign in, what they can do, and whose records they reach.</SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush>
        <Table>
          <thead><tr><TH>Person</TH><TH>Roles</TH><TH className="hidden 2xl:table-cell">Reaches</TH><TH>Status</TH><TH className="hidden lg:table-cell">Last sign-in</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.id} className={m.isActive ? undefined : "text-muted"}>
                <TD>
                  <span className="block font-medium">{m.fullName || m.email}</span>
                  <span className="block text-xs text-muted">{m.email}{m.employee ? ` · ${m.employee.name}` : ""}</span>
                </TD>
                <TD><span className="flex flex-wrap gap-1">{m.roles.map((r) => <Badge key={r.code}>{r.name}</Badge>)}</span></TD>
                <TD className="hidden text-muted 2xl:table-cell">{scopeSummary(m)}</TD>
                <TD className="whitespace-nowrap">
                  {!m.isActive ? <Badge>No access</Badge> : m.invitePending ? <Badge tone="warn" dot>Invited</Badge> : <Badge tone="good" dot>Active</Badge>}
                </TD>
                <TD className="hidden whitespace-nowrap text-muted lg:table-cell">{m.lastLogin ? formatDate(m.lastLogin) : "Never"}</TD>
                <TD align="right" className="whitespace-nowrap">
                  {m.isActive && m.invitePending && (
                    <Button size="sm" variant="ghost" onClick={async () => {
                      const result = await resend({ id: m.id });
                      setSaved(result.error ? errorMessage(result.error) : `Invitation sent again to ${m.email}.`);
                    }}>Resend</Button>
                  )}
                  {m.isActive && !m.invitePending && m.email !== me?.user.email && (
                    <IconButton label={`View as ${m.fullName || m.email}`} onClick={async () => { const problem = await viewAs(m.id); if (problem) setSaved(problem); }}><FontAwesomeIcon icon={faEye} /></IconButton>
                  )}
                  <IconButton label={`Edit ${m.fullName || m.email}`} onClick={() => { setSaved(undefined); setEditing({ member: m }); }}><FontAwesomeIcon icon={faPen} /></IconButton>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {bulk && (
        <InviteEmployeesDialog onClose={() => setBulk(false)}
          onDone={(message) => { setBulk(false); setSaved(message); reload({ requestPolicy: "network-only" }); }} />
      )}
      {editing && (
        <MemberDialog data={data} member={editing.member} onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); setSaved(message); reload({ requestPolicy: "network-only" }); }} />
      )}
    </>
  );
}
