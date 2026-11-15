"use client";

import { faChevronLeft, faChevronRight, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { ActionDialog, Badge, type BadgeTone, Button, Card, Dialog, ErrorNote, IconButton, Input, Loading, Notice, Select } from "@/components/ui";
import { graphql } from "@/gql";
import type { MyTimesheetQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

/** Fields every timesheet view shows; codegen picks this fragment up from here. */
export const TimesheetFields = graphql(`
  fragment TimesheetFields on Timesheet {
    id employeeId employeeName weekStart status submittedAt decidedBy decidedAt note totalMinutes mine canApprove
    entries { projectId projectName date minutes note }
    clocked { date minutes }
  }
`);
const MyTimesheetDocument = graphql(`
  query MyTimesheet($week: Date!) { myTimesheet(weekStart: $week) { ...TimesheetFields } myProjects { id name code client } }
`);
const SaveDocument = graphql(`
  mutation SaveTimesheet($week: Date!, $entries: [TimesheetCellInput!]!) {
    saveTimesheet(weekStart: $week, entries: $entries) { timesheet { ...TimesheetFields } errors { field message } }
  }
`);
const SubmitDocument = graphql(`
  mutation SubmitTimesheet($week: Date!) { submitTimesheet(weekStart: $week) { timesheet { ...TimesheetFields } errors { message } } }
`);
const ToApproveDocument = graphql(`query TimesheetsToApprove { timesheetsToApprove { ...TimesheetFields } }`);
const TeamDocument = graphql(`query TeamTimesheets($week: Date!) { teamTimesheets(weekStart: $week) { ...TimesheetFields } }`);
const DecideDocument = graphql(`
  mutation DecideTimesheet($id: ID!, $approve: Boolean!, $note: String!) {
    decideTimesheet(id: $id, approve: $approve, note: $note) { timesheet { id status } errors { field message } }
  }
`);
const ReopenDocument = graphql(`
  mutation ReopenTimesheet($id: ID!, $note: String!) { reopenTimesheet(id: $id, note: $note) { timesheet { id status } errors { message } } }
`);

type Sheet = MyTimesheetQuery["myTimesheet"];

export const SHEET_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: "Not submitted", tone: "neutral" }, submitted: { label: "Waiting for approval", tone: "warn" },
  approved: { label: "Approved", tone: "good" }, rejected: { label: "Sent back", tone: "bad" },
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
export function mondayOf(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}
function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
const weekDays = (start: string) => Array.from({ length: 7 }, (_, i) => addDays(start, i));
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", timeZone: "UTC" });
export const hours = (m: number) => (m ? String(Number((m / 60).toFixed(2))) : "");

/** "7.5", "7,5" or "7:30" to minutes; null when it cannot be read. */
function toMinutes(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return 0;
  const hm = v.match(/^(\d{1,2}):([0-5]\d)$/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 24 ? Math.round(n * 60) : null;
}

type Grid = { projectId: string; name: string; cells: Record<string, string> }[];

function gridOf(sheet: Sheet): Grid {
  const rows = new Map<string, Grid[number]>();
  for (const e of sheet.entries) {
    const row = rows.get(e.projectId) ?? { projectId: e.projectId, name: e.projectName, cells: {} };
    row.cells[e.date] = hours(e.minutes);
    rows.set(e.projectId, row);
  }
  return [...rows.values()];
}

/** The week as a read-only table (for approvers) or a form (for the person). */
function WeekTable({ sheet, grid, days, onCell, onRemove }: {
  sheet: Sheet; grid: Grid; days: string[]; onCell?: (row: number, day: string, value: string) => void; onRemove?: (row: number) => void;
}) {
  const minutesOf = (v: string | undefined) => toMinutes(v ?? "") ?? 0;
  const dayTotal = (day: string) => grid.reduce((n, r) => n + minutesOf(r.cells[day]), 0);
  const clocked = Object.fromEntries(sheet.clocked.map((c) => [c.date, c.minutes]));
  const total = days.reduce((n, d) => n + dayTotal(d), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-subtle/70 text-left"><tr>
          <th className="px-4 py-2.5 font-semibold text-ink">Project</th>
          {days.map((d) => <th key={d} className="w-20 px-2 py-2.5 text-center font-semibold text-ink">{dayLabel(d)}</th>)}
          <th className="w-20 px-3 py-2.5 text-right font-semibold text-ink">Total</th>
          {onRemove && <th className="w-10" />}
        </tr></thead>
        <tbody className="divide-y divide-line">
          {grid.map((row, i) => (
            <tr key={row.projectId}>
              <td className="px-4 py-2 font-medium text-ink">{row.name}</td>
              {days.map((d) => (
                <td key={d} className="px-1.5 py-1.5 text-center tabular-nums">
                  {onCell ? (
                    <Input aria-label={`${row.name}, ${dayLabel(d)}`} inputMode="decimal" value={row.cells[d] ?? ""} placeholder="–"
                      className={`h-9 text-center ${toMinutes(row.cells[d] ?? "") === null ? "border-red-500" : ""}`}
                      onChange={(e) => onCell(i, d, e.target.value)} />
                  ) : (row.cells[d] || <span className="text-muted">–</span>)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-medium tabular-nums">{hours(days.reduce((n, d) => n + minutesOf(row.cells[d]), 0)) || "0"}</td>
              {onRemove && <td className="pr-2"><IconButton label={`Remove ${row.name}`} onClick={() => onRemove(i)}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton></td>}
            </tr>
          ))}
          <tr className="bg-subtle/40">
            <td className="px-4 py-2 font-semibold text-ink">Logged</td>
            {days.map((d) => <td key={d} className="px-2 py-2 text-center font-semibold tabular-nums">{hours(dayTotal(d)) || "–"}</td>)}
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{hours(total) || "0"}</td>
            {onRemove && <td />}
          </tr>
          {sheet.clocked.length > 0 && (
            <tr className="text-muted">
              <td className="px-4 py-2">Clocked</td>
              {days.map((d) => <td key={d} className="px-2 py-2 text-center tabular-nums">{hours(clocked[d] ?? 0) || "–"}</td>)}
              <td className="px-3 py-2 text-right tabular-nums">{hours(sheet.clocked.reduce((n, c) => n + c.minutes, 0)) || "0"}</td>
              {onRemove && <td />}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function WeekPicker({ week, onChange }: { week: string; onChange: (w: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous week" onClick={() => onChange(addDays(week, -7))}><FontAwesomeIcon icon={faChevronLeft} className="text-xs" /></IconButton>
      <span className="min-w-44 text-center text-sm font-medium text-ink">{formatDate(week)} – {formatDate(addDays(week, 6))}</span>
      <IconButton label="Next week" onClick={() => onChange(addDays(week, 7))}><FontAwesomeIcon icon={faChevronRight} className="text-xs" /></IconButton>
    </div>
  );
}

function Editor({ sheet, projects, onSaved }: { sheet: Sheet; projects: MyTimesheetQuery["myProjects"]; onSaved: () => void }) {
  const days = weekDays(sheet.weekStart);
  const [grid, setGrid] = useState<Grid>(() => gridOf(sheet));
  const [adding, setAdding] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [{ fetching: saving }, save] = useMutation(SaveDocument);
  const [{ fetching: submitting }, submit] = useMutation(SubmitDocument);
  const editable = sheet.status === "draft" || sheet.status === "rejected";
  const unused = projects.filter((p) => !grid.some((r) => r.projectId === p.id));
  const bad = grid.some((r) => Object.values(r.cells).some((v) => toMinutes(v) === null));
  const persist = async () => {
    const entries = grid.flatMap((r) => days.map((d) => ({ projectId: r.projectId, date: d, minutes: toMinutes(r.cells[d] ?? "") ?? 0 }))
      .filter((c) => c.minutes > 0));
    const res = await save({ week: sheet.weekStart, entries });
    const msg = res.error ? errorMessage(res.error) : res.data?.saveTimesheet.errors[0]?.message;
    if (msg) { setMessage({ ok: false, text: msg }); return false; }
    return true;
  };
  return (
    <Card flush title="Hours by project" description={editable ? "Type hours (7.5 or 7:30). Save as you go; submit at the end of the week." : undefined}
      actions={editable ? <>
        <Button size="sm" variant="secondary" busy={saving} disabled={bad} onClick={async () => { if (await persist()) { setMessage({ ok: true, text: "Saved." }); onSaved(); } }}>Save</Button>
        <Button size="sm" busy={submitting} disabled={bad || !grid.length} onClick={async () => {
          if (!(await persist())) return;
          const res = await submit({ week: sheet.weekStart });
          const msg = res.error ? errorMessage(res.error) : res.data?.submitTimesheet.errors[0]?.message;
          setMessage(msg ? { ok: false, text: msg } : { ok: true, text: "Submitted to your manager." });
          onSaved();
        }}>Submit week</Button>
      </> : undefined}>
      {message && <div className="px-5 pt-4"><Notice tone={message.ok ? "success" : "error"}>{message.text}</Notice></div>}
      {grid.length ? (
        <WeekTable sheet={sheet} grid={grid} days={days}
          onCell={editable ? (i, d, value) => setGrid(grid.map((r, j) => (j === i ? { ...r, cells: { ...r.cells, [d]: value } } : r))) : undefined}
          onRemove={editable ? (i) => setGrid(grid.filter((_, j) => j !== i)) : undefined} />
      ) : <p className="px-5 py-4 text-sm text-muted">{editable ? "Add a project to start logging hours." : "No hours logged."}</p>}
      {editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
          {projects.length ? <>
            <Select aria-label="Project to add" value={adding} onChange={(e) => setAdding(e.target.value)} className="w-64">
              <option value="">Add a project…</option>
              {unused.map((p) => <option key={p.id} value={p.id}>{p.name}{p.client && ` (${p.client})`}</option>)}
            </Select>
            <Button size="sm" variant="secondary" disabled={!adding} icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => {
              const p = projects.find((x) => x.id === adding);
              if (p) setGrid([...grid, { projectId: p.id, name: p.name, cells: {} }]);
              setAdding("");
            }}>Add</Button>
          </> : <p className="text-sm text-muted">There are no projects to log time to yet. HR sets them up in Settings → Attendance.</p>}
        </div>
      )}
    </Card>
  );
}

export function MyTimesheet({ initialWeek }: { initialWeek?: string | null }) {
  const [week, setWeek] = useState(() => mondayOf(initialWeek || iso(new Date())));
  const [{ data, error }, reload] = useQuery({ query: MyTimesheetDocument, variables: { week }, requestPolicy: "cache-and-network" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  const sheet = data?.myTimesheet;
  const s = sheet ? SHEET_STATUS[sheet.status] : undefined;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekPicker week={week} onChange={setWeek} />
        {s && <Badge tone={s.tone} dot>{s.label}</Badge>}
      </div>
      {sheet?.status === "rejected" && sheet.note && <Notice tone="warning" title={`Sent back by ${sheet.decidedBy ?? "your manager"}`}>{sheet.note}</Notice>}
      {!data || data.myTimesheet.weekStart !== week ? <Loading shape="table" /> : (
        <Editor key={`${week}-${sheet!.status}-${sheet!.id}`} sheet={sheet!} projects={data.myProjects} onSaved={() => reload({ requestPolicy: "network-only" })} />
      )}
    </div>
  );
}

function Review({ sheet, onClose, onDone }: { sheet: Sheet; onClose: () => void; onDone: () => void }) {
  const [, decide] = useMutation(DecideDocument);
  const [, reopen] = useMutation(ReopenDocument);
  const [asking, setAsking] = useState<"back" | "reopen" | null>(null);
  const [error, setError] = useState<string>();
  const days = weekDays(sheet.weekStart);
  const approve = async () => {
    const res = await decide({ id: sheet.id!, approve: true, note: "" });
    const msg = res.error ? errorMessage(res.error) : res.data?.decideTimesheet.errors[0]?.message;
    if (msg) return setError(msg);
    onDone();
  };
  return (
    <Dialog open wide onClose={onClose} title={`${sheet.employeeName}: week of ${formatDate(sheet.weekStart)}`}
      description={`${hours(sheet.totalMinutes) || 0} hours logged${sheet.clocked.length ? `, ${hours(sheet.clocked.reduce((n, c) => n + c.minutes, 0)) || 0} clocked` : ""}.`}
      footer={sheet.canApprove ? (sheet.status === "submitted" ? <>
        <Button variant="secondary" onClick={() => setAsking("back")}>Send back</Button>
        <Button onClick={approve}>Approve</Button>
      </> : sheet.status === "approved" ? <Button variant="secondary" onClick={() => setAsking("reopen")}>Reopen</Button> : undefined) : undefined}>
      {error && <ErrorNote error={error} />}
      <div className="-mx-6"><WeekTable sheet={sheet} grid={gridOf(sheet)} days={days} /></div>
      <ActionDialog open={asking !== null} onClose={() => setAsking(null)} title={asking === "back" ? "Send this week back" : "Reopen this week"}
        description={`${sheet.employeeName.split(" ")[0]} can change it and submit again.`} confirmLabel={asking === "back" ? "Send back" : "Reopen"}
        input={{ label: "What needs to change", required: asking === "back" }}
        onConfirm={async (note) => {
          const res = asking === "back" ? await decide({ id: sheet.id!, approve: false, note }) : await reopen({ id: sheet.id!, note });
          if (res.error) throw new Error(errorMessage(res.error));
          onDone();
        }} />
    </Dialog>
  );
}

export function TimesheetApprovals() {
  const [{ data, error }, reload] = useQuery({ query: ToApproveDocument, requestPolicy: "cache-and-network" });
  const [open, setOpen] = useState<Sheet | null>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  return (
    <Card flush title="Timesheets to approve" description="Weeks your team has submitted.">
      {data.timesheetsToApprove.length ? (
        <ul className="divide-y divide-line">
          {data.timesheetsToApprove.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setOpen(t)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3 text-left text-sm hover:bg-subtle/50">
                <span><span className="font-medium text-ink">{t.employeeName}</span> <span className="text-muted">week of {formatDate(t.weekStart)}</span></span>
                <span className="tabular-nums text-ink">{hours(t.totalMinutes)} h</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="p-5 text-sm text-muted">Nothing waiting.</p>}
      {open && <Review sheet={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload({ requestPolicy: "network-only" }); }} />}
    </Card>
  );
}

/** Who has submitted a week, for managers and HR, with the export for HR. */
export function TeamTimesheets({ canExport }: { canExport: boolean }) {
  const [week, setWeek] = useState(() => mondayOf(iso(new Date())));
  const [{ data, error }, reload] = useQuery({ query: TeamDocument, variables: { week }, requestPolicy: "cache-and-network" });
  const [open, setOpen] = useState<Sheet | null>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  const month = week.slice(0, 7);
  return (
    <Card flush title="Timesheets" actions={<>
      <WeekPicker week={week} onChange={setWeek} />
      {canExport && <a className="text-sm font-medium text-brand-ink hover:underline" href={`/api/attendance/timesheets/export.xlsx?start=${month}-01&end=${addDays(week, 6)}`}>
        Export project hours</a>}
    </>}>
      {!data ? <Loading shape="table" /> : data.teamTimesheets.length ? (
        <ul className="divide-y divide-line">
          {data.teamTimesheets.map((t) => {
            const s = SHEET_STATUS[t.status];
            return (
              <li key={t.employeeId}>
                <button type="button" disabled={!t.id} onClick={() => setOpen(t)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-2.5 text-left text-sm hover:bg-subtle/50 disabled:hover:bg-transparent">
                  <span className="font-medium text-ink">{t.employeeName}</span>
                  <span className="flex items-center gap-3"><span className="tabular-nums text-muted">{t.id ? `${hours(t.totalMinutes) || 0} h` : ""}</span>
                    <Badge tone={t.id ? s?.tone ?? "neutral" : "neutral"} dot>{t.id ? s?.label : "Not started"}</Badge></span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <p className="p-5 text-sm text-muted">No one reports to you.</p>}
      {open && <Review sheet={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload({ requestPolicy: "network-only" }); }} />}
    </Card>
  );
}
