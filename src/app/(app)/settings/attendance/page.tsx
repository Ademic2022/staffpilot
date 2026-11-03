"use client";

import { faPen, faPlus, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { ProjectsAdmin } from "@/components/attendance/Projects";
import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, SearchInput, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { AttendanceSetupQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { useSession } from "@/lib/session";

const SetupDocument = graphql(`
  query AttendanceSetup {
    attendanceSettings { enabled graceMinutes requireLocation overtimeAfterMinutes overtimeMultiplier payOvertime deductAbsence timesheetsEnabled }
    shifts { id name start end breakMinutes weekdays isDefault isActive people }
    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }
  }
`);
const SaveSettingsDocument = graphql(`
  mutation SaveAttendanceSettings($input: AttendanceSettingsInput!) { saveAttendanceSettings(input: $input) { enabled } }
`);
const SaveShiftDocument = graphql(`
  mutation SaveShift($input: ShiftInput!) { saveShift(input: $input) { shift { id } errors { field message } } }
`);
const AssignDocument = graphql(`
  mutation AssignShift($shift: ID!, $ids: [ID!]!, $start: Date!) { assignShift(shiftId: $shift, employeeIds: $ids, startDate: $start) }
`);

type Data = AttendanceSetupQuery;
type Shift = Data["shifts"][number];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Rules({ data, onSaved }: { data: Data; onSaved: (m: string) => void }) {
  const { reset, tenant } = useSession();
  const payroll = Boolean(tenant?.payrollEnabled);
  const s = data.attendanceSettings;
  const [v, setV] = useState({ ...s, graceMinutes: String(s.graceMinutes), overtimeAfterMinutes: String(s.overtimeAfterMinutes), overtimeMultiplier: String(s.overtimeMultiplier) });
  const [problem, setProblem] = useState<string>();
  const [{ fetching }, save] = useMutation(SaveSettingsDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((x) => ({ ...x, [k]: value }));
  return (
    <Card>
      <div className="space-y-5">
        {problem && <ErrorNote error={problem} />}
        <Checkbox label="Switch on clocking in and out" description="Adds Attendance to everyone's menu." checked={v.enabled} onChange={(c) => set("enabled", c)} />
        <Checkbox label="Switch on weekly timesheets" description="People log hours against projects and cost centres (set them up under Projects); managers approve each week."
          checked={v.timesheetsEnabled} onChange={(c) => set("timesheetsEnabled", c)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Grace (minutes)" hint="Clocking in this late still counts as on time."><Input type="number" min={0} value={v.graceMinutes} onChange={(e) => set("graceMinutes", e.target.value)} /></Field>
          <Field label="Overtime counts after (minutes)" hint="Less extra time than this is ignored."><Input type="number" min={0} value={v.overtimeAfterMinutes} onChange={(e) => set("overtimeAfterMinutes", e.target.value)} /></Field>
          <Field label="Overtime pay rate" hint="Times the hourly rate, e.g. 1.5."><Input inputMode="decimal" value={v.overtimeMultiplier} onChange={(e) => set("overtimeMultiplier", e.target.value)} /></Field>
        </div>
        <div className="space-y-2">
          {!payroll && <p className="text-xs text-muted">The two options below take effect when you run payroll in StaffPilot (Settings → Company).</p>}
          <Checkbox label="Pay approved overtime through payroll" checked={v.payOvertime} onChange={(c) => set("payOvertime", c)} />
          <Checkbox label="Treat unexplained absences as unpaid days" description="Working days with no clock-in and no approved leave are taken off pay." checked={v.deductAbsence} onChange={(c) => set("deductAbsence", c)} />
          <Checkbox label="Refuse clock-ins away from the site" description="Only where a location has a clock-in radius (Job organization → Locations). Otherwise they are just flagged."
            checked={v.requireLocation} onChange={(c) => set("requireLocation", c)} />
        </div>
        <div className="flex justify-end">
          <Button busy={fetching} onClick={async () => {
            const r = await save({ input: { enabled: v.enabled, graceMinutes: Number(v.graceMinutes) || 0, overtimeAfterMinutes: Number(v.overtimeAfterMinutes) || 0,
              overtimeMultiplier: v.overtimeMultiplier || "1.5", requireLocation: v.requireLocation, payOvertime: v.payOvertime, deductAbsence: v.deductAbsence,
              timesheetsEnabled: v.timesheetsEnabled } });
            if (r.error) setProblem(errorMessage(r.error)); else { reset(); onSaved("Attendance settings saved."); }
          }}>Save</Button>
        </div>
      </div>
    </Card>
  );
}

function ShiftDialog({ shift, onClose, onSaved }: { shift: Shift | null; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ name: shift?.name ?? "", start: shift?.start ?? "09:00", end: shift?.end ?? "17:00", breakMinutes: String(shift?.breakMinutes ?? 60),
    weekdays: shift?.weekdays ?? [0, 1, 2, 3, 4], isDefault: shift?.isDefault ?? false, isActive: shift?.isActive ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveShiftDocument);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((x) => ({ ...x, [k]: value }));
  return (
    <Dialog open onClose={onClose} title={shift ? `Edit ${shift.name}` : "New shift"} description="An end before the start means the shift runs past midnight."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} onClick={async () => {
          const r = await save({ input: { id: shift?.id ?? null, ...v, breakMinutes: Number(v.breakMinutes) || 0 } });
          const problems = r.data?.saveShift.errors ?? [];
          if (r.error) setErrors({ "": errorMessage(r.error) ?? "" });
          else if (problems.length) setErrors(Object.fromEntries(problems.map((p) => [p.field ?? "", p.message])));
          else onSaved();
        }}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        {errors[""] && <div className="sm:col-span-3"><ErrorNote error={errors[""]} /></div>}
        <div className="sm:col-span-3"><Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Night shift" /></Field></div>
        <Field label="Starts" error={errors.start}><Input type="time" value={v.start} onChange={(e) => set("start", e.target.value)} /></Field>
        <Field label="Ends"><Input type="time" value={v.end} onChange={(e) => set("end", e.target.value)} /></Field>
        <Field label="Break (minutes)" error={errors.breakMinutes}><Input type="number" value={v.breakMinutes} onChange={(e) => set("breakMinutes", e.target.value)} /></Field>
        <fieldset className="sm:col-span-3">
          <legend className="mb-1 text-sm font-medium text-ink">Days</legend>
          {errors.weekdays && <p className="text-sm text-red-700 dark:text-red-300">{errors.weekdays}</p>}
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <label key={d} className="flex items-center gap-1.5 text-sm text-ink">
                <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={v.weekdays.includes(i)}
                  onChange={() => set("weekdays", v.weekdays.includes(i) ? v.weekdays.filter((x) => x !== i) : [...v.weekdays, i])} />{d}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2 sm:col-span-3">
          <Checkbox label="Standard hours" description="Everyone not on another shift works these." checked={v.isDefault} onChange={(c) => set("isDefault", c)} />
          {shift && <Checkbox label="Active" checked={v.isActive} onChange={(c) => set("isActive", c)} />}
        </div>
      </div>
    </Dialog>
  );
}

function AssignDialog({ shift, people, onClose, onSaved }: { shift: Shift; people: { id: string; fullName: string }[]; onClose: () => void; onSaved: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [{ fetching }, assign] = useMutation(AssignDocument);
  const q = search.trim().toLowerCase();
  return (
    <Dialog open onClose={onClose} title={`Put people on ${shift.name}`} description="From the date you choose; their previous shift ends the day before."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={fetching} disabled={!picked.length} onClick={async () => { await assign({ shift: shift.id, ids: picked, start }); onSaved(); }}>Save ({picked.length})</Button></>}>
      <div className="space-y-3">
        <Field label="From"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <SearchInput aria-label="Search people" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="max-h-64 overflow-y-auto rounded-xl border border-line p-2">
          {people.filter((p) => !q || p.fullName.toLowerCase().includes(q)).map((p) => (
            <li key={p.id}><label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-subtle">
              <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={picked.includes(p.id)}
                onChange={() => setPicked(picked.includes(p.id) ? picked.filter((x) => x !== p.id) : [...picked, p.id])} />{p.fullName}
            </label></li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}

export default function AttendanceSettingsPage() {
  const [tab] = useSettingsTab(["rules", "shifts", "projects"] as const, "rules");
  const [{ data, error }, reload] = useQuery({ query: SetupDocument });
  const [saved, setSaved] = useState<string>();
  const [editing, setEditing] = useState<null | { shift: Shift | null } | { assign: Shift }>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const refresh = (m: string) => { setEditing(null); setSaved(m); reload({ requestPolicy: "network-only" }); };
  return (
    <>
      {saved && <Notice tone="success">{saved}</Notice>}
      {tab === "projects" ? <ProjectsAdmin onSaved={setSaved} /> : tab === "rules" ? (
        <><SettingsIntro>Clocking in and out, lateness, overtime and how attendance feeds payroll.</SettingsIntro><Rules data={data} onSaved={refresh} /></>
      ) : (
        <>
          <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ shift: null })}>New shift</Button>}>
            Working hours by day. People work the standard hours unless you put them on another shift.
          </SettingsIntro>
          <Card flush>
            <Table>
              <thead><tr><TH>Shift</TH><TH>Hours</TH><TH>Days</TH><TH>People</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
              <tbody>
                {data.shifts.map((s) => (
                  <tr key={s.id} className={s.isActive ? undefined : "text-muted"}>
                    <TD className="font-medium">{s.name}{s.isDefault && <Badge tone="brand">Standard</Badge>}</TD>
                    <TD className="tabular-nums">{s.start} – {s.end}<span className="block text-xs text-muted">{s.breakMinutes} min break</span></TD>
                    <TD>{s.weekdays.map((d) => DAYS[d]).join(", ")}</TD>
                    <TD className="tabular-nums">{s.isDefault ? "Everyone else" : s.people}</TD>
                    <TD align="right" className="whitespace-nowrap">
                      {!s.isDefault && <IconButton label={`Put people on ${s.name}`} onClick={() => setEditing({ assign: s })}><FontAwesomeIcon icon={faUsers} /></IconButton>}
                      <IconButton label={`Edit ${s.name}`} onClick={() => setEditing({ shift: s })}><FontAwesomeIcon icon={faPen} /></IconButton>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
      {editing && "shift" in editing && <ShiftDialog shift={editing.shift} onClose={() => setEditing(null)} onSaved={() => refresh("Shift saved.")} />}
      {editing && "assign" in editing && <AssignDialog shift={editing.assign} people={data.employees.nodes} onClose={() => setEditing(null)} onSaved={() => refresh("Roster updated.")} />}
    </>
  );
}
