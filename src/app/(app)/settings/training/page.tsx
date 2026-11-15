"use client";

import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { TrainingAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const TrainingDocument = graphql(`
  query TrainingAdmin {
    trainingCourses(includeInactive: true) { id name description category required frequencyMonths dueDays appliesTo isActive }
    departments { id name isActive }
    locations { id name isActive }
  }
`);

const SaveDocument = graphql(`
  mutation SaveTrainingCourse($input: TrainingCourseInput!) {
    saveTrainingCourse(input: $input) { course { id } errors { field message } }
  }
`);

const DeleteDocument = graphql(`mutation DeleteTrainingCourse($id: ID!) { deleteTrainingCourse(id: $id) }`);

type Data = TrainingAdminQuery;
type Course = Data["trainingCourses"][number];
const FREQUENCIES = [[0, "Once"], [6, "Every 6 months"], [12, "Every year"], [24, "Every 2 years"], [36, "Every 3 years"]] as const;

function CourseDialog({ course, data, onClose, onSaved }: { course: Course | null; data: Data; onClose: () => void; onSaved: () => void }) {
  const applies = (course?.appliesTo ?? {}) as Record<string, string[]>;
  const [v, setV] = useState({
    name: course?.name ?? "", description: course?.description ?? "", category: course?.category ?? "", required: course?.required ?? true,
    frequencyMonths: course?.frequencyMonths ?? 0, dueDays: course?.dueDays == null ? "" : String(course.dueDays), isActive: course?.isActive ?? true,
    departments: applies.departments ?? [], locations: applies.locations ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  const pick = (k: "departments" | "locations", id: string) => set(k, v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id]);

  return (
    <Dialog open wide onClose={onClose} title={course ? `Edit ${course.name}` : "New course"}
      description="People record completions in the Training table on their profile, with this course name."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: course?.id ?? null, name: v.name, description: v.description, category: v.category, required: v.required,
            frequencyMonths: v.frequencyMonths, dueDays: v.dueDays === "" ? null : Number(v.dueDays), isActive: v.isActive,
            appliesTo: { departments: v.departments, locations: v.locations } } });
          const problems = r.data?.saveTrainingCourse.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save course</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Fire safety" /></Field>
        <Field label="Category" optional><Input value={v.category} onChange={(e) => set("category", e.target.value)} placeholder="Health and safety" /></Field>
        <div className="sm:col-span-2"><Field label="Description" optional><Input value={v.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
        <Field label="How often" error={errors.frequencyMonths}>
          <Select value={String(v.frequencyMonths)} onChange={(e) => set("frequencyMonths", Number(e.target.value))}>
            {FREQUENCIES.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
          </Select>
        </Field>
        <Field label="First due, days after hire" optional error={errors.dueDays} hint="Empty: no first deadline.">
          <Input type="number" min={0} max={730} value={v.dueDays} onChange={(e) => set("dueDays", e.target.value)} />
        </Field>
        <div className="sm:col-span-2 space-y-2">
          <Checkbox label="Required" description="Shows as due or overdue for the people it applies to, and in the Training due report." checked={v.required} onChange={(c) => set("required", c)} />
          {course && <Checkbox label="Active" checked={v.isActive} onChange={(c) => set("isActive", c)} />}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium text-ink">Applies to</legend>
          <p className="mb-2 text-xs text-muted">Leave both empty for everyone.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["departments", "locations"] as const).map((k) => (
              <div key={k}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{k === "departments" ? "Departments" : "Locations"}</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {data[k].filter((x) => x.isActive).map((x) => (
                    <label key={x.id} className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={v[k].includes(x.id)} onChange={() => pick(k, x.id)} />{x.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}

export default function TrainingSettingsPage() {
  const [{ data, error }, reload] = useQuery({ query: TrainingDocument });
  const [editing, setEditing] = useState<{ course: Course | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  const [, remove] = useMutation(DeleteDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const refresh = (m: string) => { setSaved(m); reload({ requestPolicy: "network-only" }); };
  return (
    <>
      <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ course: null })}>New course</Button>}>
        The training catalogue: which courses are required, how often, and for whom.
      </SettingsIntro>
      {saved && <Notice tone="success">{saved}</Notice>}
      <Card flush>
        {data.trainingCourses.length ? (
          <Table>
            <thead><tr><TH>Course</TH><TH>Required</TH><TH>How often</TH><TH>Due</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.trainingCourses.map((c) => (
                <tr key={c.id} className={c.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">{c.name}{c.category && <span className="block text-xs font-normal text-muted">{c.category}</span>}</TD>
                  <TD>{c.required ? <Badge tone="brand">Required</Badge> : "Optional"}</TD>
                  <TD>{FREQUENCIES.find(([m]) => m === c.frequencyMonths)?.[1] ?? `Every ${c.frequencyMonths} months`}</TD>
                  <TD>{c.dueDays == null ? "—" : `${c.dueDays} days from hire`}</TD>
                  <TD align="right" className="whitespace-nowrap">
                    <IconButton label={`Edit ${c.name}`} onClick={() => setEditing({ course: c })}><FontAwesomeIcon icon={faPen} /></IconButton>
                    <IconButton label={`Delete ${c.name}`} onClick={async () => { await remove({ id: c.id }); refresh(`${c.name} deleted.`); }}><FontAwesomeIcon icon={faTrash} /></IconButton>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No courses yet.</p>}
      </Card>
      {editing && <CourseDialog course={editing.course} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh("Course saved."); }} />}
    </>
  );
}
