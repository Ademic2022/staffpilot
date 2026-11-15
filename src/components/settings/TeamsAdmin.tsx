"use client";

import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, SearchInput, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { TeamsAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const TeamsDocument = graphql(`
  query TeamsAdmin {
    teams(includeInactive: true) { id name description isActive leadId leadName memberIds memberNames }
    orgChart { id fullName jobTitle }
  }
`);

const SaveTeamDocument = graphql(`
  mutation SaveTeam($input: TeamInput!) {
    saveTeam(input: $input) { team { id } errors { field message } }
  }
`);

const DeleteTeamDocument = graphql(`
  mutation DeleteTeam($id: ID!) { deleteTeam(id: $id) }
`);

type Team = TeamsAdminQuery["teams"][number];

function TeamDialog({ team, people, onClose, onSaved }: { team: Team | null; people: TeamsAdminQuery["orgChart"]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [leadId, setLeadId] = useState(team?.leadId ?? "");
  const [members, setMembers] = useState<string[]>(team?.memberIds ?? []);
  const [active, setActive] = useState(team?.isActive ?? true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>();
  const [{ fetching }, save] = useMutation(SaveTeamDocument);
  const q = search.trim().toLowerCase();
  return (
    <Dialog open wide onClose={onClose} title={team ? `Edit ${team.name}` : "New team"} description="Teams group people across departments, such as a project or committee."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: team?.id ?? null, name, description, leadId: leadId || null, memberIds: members, isActive: active } });
          const problem = errorMessage(r.error) ?? r.data?.saveTeam.errors[0]?.message;
          if (problem) setError(problem); else onSaved();
        }}>Save team</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={error}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Payroll project" /></Field>
        <Field label="Lead" optional>
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">No lead</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2"><Field label="Description" optional><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field></div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-ink">Members ({members.length})</p>
          <SearchInput aria-label="Search people" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line p-2">
            {people.filter((p) => !q || p.fullName.toLowerCase().includes(q)).map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-subtle">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={members.includes(p.id)}
                    onChange={() => setMembers(members.includes(p.id) ? members.filter((m) => m !== p.id) : [...members, p.id])} />
                  <span className="text-ink">{p.fullName}</span><span className="text-xs text-muted">{p.jobTitle}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        {team && <div className="sm:col-span-2"><Checkbox label="Active" checked={active} onChange={setActive} /></div>}
      </div>
    </Dialog>
  );
}

export function TeamsAdmin() {
  const [{ data, error }, reload] = useQuery({ query: TeamsDocument });
  const [editing, setEditing] = useState<{ team: Team | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  const [, remove] = useMutation(DeleteTeamDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const refresh = (m: string) => { setSaved(m); reload({ requestPolicy: "network-only" }); };
  return (
    <>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush title="Teams" description="People can be in several teams. Filter the People list by team."
        actions={<Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ team: null })}>Add team</Button>}>
        {data.teams.length ? (
          <Table>
            <thead><tr><TH>Team</TH><TH>Lead</TH><TH>Members</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.teams.map((t) => (
                <tr key={t.id} className={t.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">{t.name}{t.description && <span className="block text-xs font-normal text-muted">{t.description}</span>}</TD>
                  <TD>{t.leadName ?? "—"}</TD>
                  <TD><span title={t.memberNames.join(", ")}>{t.memberNames.length}</span></TD>
                  <TD>{t.isActive ? <Badge tone="good" dot>Active</Badge> : <Badge>Inactive</Badge>}</TD>
                  <TD align="right" className="whitespace-nowrap">
                    <IconButton label={`Edit ${t.name}`} onClick={() => setEditing({ team: t })}><FontAwesomeIcon icon={faPen} /></IconButton>
                    <IconButton label={`Delete ${t.name}`} onClick={async () => { await remove({ id: t.id }); refresh(`${t.name} deleted.`); }}><FontAwesomeIcon icon={faTrash} /></IconButton>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No teams yet.</p>}
      </Card>
      {editing && <TeamDialog team={editing.team} people={data.orgChart} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh("Team saved."); }} />}
    </>
  );
}
