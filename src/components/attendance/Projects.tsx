"use client";

import { faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { PersonSearch } from "@/components/performance/shared";
import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { ProjectsQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const ProjectsDocument = graphql(`
  query Projects { projects { id name code client costCentre billable employeeIds isActive } }
`);
const SaveProjectDocument = graphql(`
  mutation SaveProject($input: ProjectInput!) { saveProject(input: $input) { project { id } errors { field message } } }
`);

type Project = ProjectsQuery["projects"][number];

function Editor({ project, onClose, onSaved }: { project: Project | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [v, setV] = useState({ name: project?.name ?? "", code: project?.code ?? "", client: project?.client ?? "", costCentre: project?.costCentre ?? "",
    billable: project?.billable ?? false, isActive: project?.isActive ?? true });
  const [people, setPeople] = useState<{ id: string; name: string }[]>((project?.employeeIds ?? []).map((id) => ({ id, name: "Chosen earlier" })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveProjectDocument);
  const submit = async () => {
    const res = await save({ input: { id: project?.id, ...v, employeeIds: people.map((p) => p.id) } });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Could not save." });
    const errs = res.data?.saveProject.errors ?? [];
    if (errs.length) return setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    onSaved(`Saved ${v.name}.`);
  };
  return (
    <Dialog open wide onClose={onClose} title={project ? `Edit ${project.name}` : "New project"}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button busy={fetching} onClick={submit}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Code" optional><Input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value })} /></Field>
        <Field label="Client" optional><Input value={v.client} onChange={(e) => setV({ ...v, client: e.target.value })} /></Field>
        <Field label="Cost centre" optional hint="Where its hours are charged."><Input value={v.costCentre} onChange={(e) => setV({ ...v, costCentre: e.target.value })} /></Field>
        <div className="grid gap-2 sm:col-span-2">
          <p className="text-sm font-medium text-ink">Who can log time to it</p>
          <p className="text-xs text-muted">Leave empty for everyone.</p>
          <PersonSearch onPick={(p) => setPeople([...people, p])} exclude={people.map((p) => p.id)} />
          {people.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {people.map((p) => (
                <button key={p.id} type="button" onClick={() => setPeople(people.filter((x) => x.id !== p.id))}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink hover:bg-subtle" title="Remove">{p.name} ×</button>
              ))}
            </div>
          )}
        </div>
        <Checkbox checked={v.billable} onChange={(billable) => setV({ ...v, billable })} label="Billable to the client" />
        <Checkbox checked={v.isActive} onChange={(isActive) => setV({ ...v, isActive })} label="Open for time" />
      </div>
    </Dialog>
  );
}

export function ProjectsAdmin({ onSaved }: { onSaved: (m: string) => void }) {
  const [{ data, error }, reload] = useQuery({ query: ProjectsDocument });
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  return (
    <>
      <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing(null)}>New project</Button>}>
        Projects and cost centres people log their weekly hours against. Switch timesheets on under Rules.
      </SettingsIntro>
      <Card flush>
        {data.projects.length ? (
          <Table>
            <thead><tr><TH>Project</TH><TH>Client</TH><TH>Cost centre</TH><TH>Who</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id} className={p.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">{p.name}{p.code && <span className="ml-1 text-xs font-normal text-muted">{p.code}</span>} {p.billable && <Badge tone="brand">Billable</Badge>} {!p.isActive && <Badge>Closed</Badge>}</TD>
                  <TD>{p.client || "—"}</TD>
                  <TD>{p.costCentre || "—"}</TD>
                  <TD>{p.employeeIds.length ? `${p.employeeIds.length} people` : "Everyone"}</TD>
                  <TD align="right"><IconButton label={`Edit ${p.name}`} onClick={() => setEditing(p)}><FontAwesomeIcon icon={faPen} className="text-xs" /></IconButton></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No projects yet.</p>}
      </Card>
      {editing !== undefined && <Editor project={editing} onClose={() => setEditing(undefined)}
        onSaved={(m) => { setEditing(undefined); reload({ requestPolicy: "network-only" }); onSaved(m); }} />}
    </>
  );
}
