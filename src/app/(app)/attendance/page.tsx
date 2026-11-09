"use client";

import { faLocationDot, faPen, faRightFromBracket, faRightToBracket, faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, type BadgeTone, Button, Card, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, PageHeader, Tabs } from "@/components/ui";
import { graphql } from "@/gql";
import type { MyAttendanceQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";
import { MyTimesheet, TeamTimesheets, TimesheetApprovals } from "@/components/attendance/Timesheet";
import { where } from "@/components/attendance/ClockPill";

const MineDocument = graphql(`
  query MyAttendance {
    myAttendance(days: 14) {
      enabled shift shiftStart shiftEnd geofenced
      clockedIn { id clockIn flags }
      days { date shift scheduled worked late absent onLeave holiday
        entries { id clockIn clockOut minutes flags note source }
        overtime { id minutes status } }
    }
  }
`);
const ClockInDocument = graphql(`
  mutation ClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id flags } errors { message } } }
`);
const ClockOutDocument = graphql(`
  mutation ClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id minutes } errors { message } } }
`);
const BoardDocument = graphql(`
  query AttendanceBoard($date: Date) { attendanceBoard(date: $date) { employeeId employeeName department status clockIn clockOut worked flags } }
`);
const PersonDocument = graphql(`
  query AttendanceDays($id: ID!, $start: Date!, $end: Date!) {
    attendanceDays(employeeId: $id, start: $start, end: $end) { date shift scheduled worked late absent onLeave holiday
      entries { id clockIn clockOut minutes flags note source } overtime { id minutes status } }
  }
`);
const SaveEntryDocument = graphql(`
  mutation SaveTimeEntry($input: TimeEntryInput!) { saveTimeEntry(input: $input) { entry { id } errors { field message } } }
`);
const DeleteEntryDocument = graphql(`mutation DeleteTimeEntry($id: ID!) { deleteTimeEntry(id: $id) }`);
const OvertimeDocument = graphql(`
  query OvertimeToDecide { overtimeToDecide { id employeeName date minutes } }
`);
const DecideDocument = graphql(`
  mutation DecideOvertime($id: ID!, $approve: Boolean!) { decideOvertime(id: $id, approve: $approve) { id status } }
`);

type Day = MyAttendanceQuery["myAttendance"]["days"][number];
const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
const time = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—");
const FLAG: Record<string, string> = { late: "Late", off_site: "Away from site", no_location: "No location", edited: "Edited" };
const BOARD: Record<string, { label: string; tone: BadgeTone }> = {
  in: { label: "In", tone: "good" }, out: { label: "Gone home", tone: "neutral" }, not_in: { label: "Not in yet", tone: "warn" },
  absent: { label: "Absent", tone: "bad" }, on_leave: { label: "On leave", tone: "brand" }, off: { label: "Not working", tone: "neutral" },
};


function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  return <>{hm(Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000)))}</>;
}

function DayRows({ days, onEdit }: { days: Day[]; onEdit?: (d: Day) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-subtle/70 text-left"><tr>
        <th className="px-4 py-2.5 font-semibold text-ink">Day</th><th className="px-3 py-2.5 font-semibold text-ink">In</th>
        <th className="px-3 py-2.5 font-semibold text-ink">Out</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Worked</th>
        <th className="px-3 py-2.5 font-semibold text-ink" /><th className="w-10" />
      </tr></thead>
      <tbody className="divide-y divide-line">
        {days.map((d) => {
          const flags = [...new Set(d.entries.flatMap((e) => e.flags))];
          return (
            <tr key={d.date}>
              <td className="px-4 py-2"><span className="text-ink">{formatDate(d.date)}</span>
                <span className="block text-xs text-muted">{d.holiday ? "Public holiday" : d.scheduled ? d.shift : "Not a working day"}</span></td>
              <td className="px-3 py-2 tabular-nums">{time(d.entries[0]?.clockIn)}</td>
              <td className="px-3 py-2 tabular-nums">{d.entries.length ? time(d.entries[d.entries.length - 1].clockOut) : "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{d.worked ? hm(d.worked) : "—"}</td>
              <td className="px-3 py-2">
                <span className="flex flex-wrap gap-1">
                  {d.absent && <Badge tone="bad">Absent</Badge>}
                  {d.onLeave && <Badge tone="brand">On leave</Badge>}
                  {flags.map((f) => <Badge key={f} tone={f === "late" || f === "off_site" ? "warn" : "neutral"}>{FLAG[f] ?? f}</Badge>)}
                  {d.overtime && <Badge tone={d.overtime.status === "approved" ? "good" : d.overtime.status === "rejected" ? "neutral" : "warn"}>
                    Overtime {hm(d.overtime.minutes)} · {d.overtime.status === "pending" ? "waiting" : d.overtime.status}</Badge>}
                </span>
              </td>
              <td className="pr-2">{onEdit && <IconButton label={`Edit ${d.date}`} onClick={() => onEdit(d)}><FontAwesomeIcon icon={faPen} className="text-xs" /></IconButton>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MyTime() {
  const [{ data, error }, reload] = useQuery({ query: MineDocument, requestPolicy: "cache-and-network" });
  const [, clockIn] = useMutation(ClockInDocument);
  const [, clockOut] = useMutation(ClockOutDocument);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const me = data.myAttendance;
  if (!me.enabled) return <Notice title="Attendance is off">Your company has not switched on clocking in and out.</Notice>;
  const run = async (inOut: "in" | "out") => {
    setBusy(true);
    const place = await where();
    const vars = { lat: place?.lat ?? null, lng: place?.lng ?? null };
    const r = inOut === "in" ? await clockIn(vars) : await clockOut(vars);
    const payload = r.data && ("clockIn" in r.data ? r.data.clockIn : r.data.clockOut);
    const problem = errorMessage(r.error) ?? payload?.errors[0]?.message;
    setBusy(false);
    setMessage(problem ? { ok: false, text: problem } : { ok: true, text: inOut === "in" ? "Clocked in." : "Clocked out." });
    reload({ requestPolicy: "network-only" });
  };
  const open = me.clockedIn;
  return (
    <>
      {message && (message.ok ? <Notice tone="success">{message.text}</Notice> : <ErrorNote error={message.text} />)}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm text-muted">{me.shiftStart ? `Today: ${me.shift}, ${me.shiftStart} – ${me.shiftEnd}` : "Not a working day for you"}</p>
            {open ? (
              <p className="mt-1 font-display text-3xl text-ink">In since {time(open.clockIn)} · <Elapsed since={open.clockIn} /></p>
            ) : <p className="mt-1 font-display text-3xl text-ink">You are clocked out</p>}
            {open && open.flags.length > 0 && <p className="mt-1 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"><FontAwesomeIcon icon={faTriangleExclamation} />{open.flags.map((f) => FLAG[f] ?? f).join(", ")}</p>}
            {me.geofenced && <p className="mt-1 flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faLocationDot} />Your location is checked when you clock in.</p>}
          </div>
          <Button busy={busy} className="h-14 px-8 text-base" icon={<FontAwesomeIcon icon={open ? faRightFromBracket : faRightToBracket} />}
            onClick={() => run(open ? "out" : "in")}>{open ? "Clock out" : "Clock in"}</Button>
        </div>
      </Card>
      <Card flush title="Last two weeks"><DayRows days={me.days} /></Card>
    </>
  );
}

function EntryDialog({ employeeId, day, onClose, onSaved }: { employeeId: string; day: Day; onClose: () => void; onSaved: () => void }) {
  const local = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  const first = day.entries[0];
  const [start, setStart] = useState(local(first?.clockIn) || `${day.date}T09:00`);
  const [end, setEnd] = useState(local(first?.clockOut) || `${day.date}T17:00`);
  const [note, setNote] = useState(first?.note ?? "");
  const [problem, setProblem] = useState<string>();
  const [, save] = useMutation(SaveEntryDocument);
  const [, remove] = useMutation(DeleteEntryDocument);
  return (
    <Dialog open onClose={onClose} title={`Time on ${formatDate(day.date)}`} description="Changes are marked as edited and recorded in the audit log."
      footer={<>
        {first && <Button variant="ghost" icon={<FontAwesomeIcon icon={faTrash} />} onClick={async () => { await remove({ id: first.id }); onSaved(); }}>Remove</Button>}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={async () => {
          const r = await save({ input: { id: first?.id ?? null, employeeId, date: day.date, clockIn: new Date(start).toISOString(),
            clockOut: end ? new Date(end).toISOString() : null, note } });
          const p = errorMessage(r.error) ?? r.data?.saveTimeEntry.errors[0]?.message;
          if (p) setProblem(p); else onSaved();
        }}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {problem && <div className="sm:col-span-2"><ErrorNote error={problem} /></div>}
        <Field label="In"><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Out" optional><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Why" optional><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Forgot to clock out" /></Field></div>
      </div>
    </Dialog>
  );
}

function Person({ id, name, onBack }: { id: string; name: string; onBack: () => void }) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [start, setStart] = useState(iso(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [end, setEnd] = useState(iso(today));
  const [{ data, error }, reload] = useQuery({ query: PersonDocument, variables: { id, start, end } });
  const [editing, setEditing] = useState<Day | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <Button variant="ghost" onClick={onBack}>← Everyone</Button>
        <h2 className="font-display text-xl text-ink">{name}</h2>
        <div className="ml-auto flex gap-2">
          <Field label="From"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
      </div>
      {error ? <ErrorNote error={errorMessage(error)} /> : !data ? <Loading /> : (
        <Card flush><DayRows days={[...data.attendanceDays].reverse()} onEdit={setEditing} /></Card>
      )}
      {editing && <EntryDialog employeeId={id} day={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ requestPolicy: "network-only" }); }} />}
    </>
  );
}

function Team() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [{ data, error }] = useQuery({ query: BoardDocument, variables: { date }, requestPolicy: "cache-and-network" });
  const [person, setPerson] = useState<{ id: string; name: string } | null>(null);
  const { tenant } = useSession();
  if (!tenant?.attendanceEnabled) return <Notice title="Attendance is off">Switch on clocking in and out in Settings → Attendance to see who is in.</Notice>;
  if (person) return <Person id={person.id} name={person.name} onBack={() => setPerson(null)} />;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const counts = data.attendanceBoard.reduce<Record<string, number>>((n, r) => ({ ...n, [r.status]: (n[r.status] ?? 0) + 1 }), {});
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" aria-label="Day" />
        {Object.entries(counts).map(([k, n]) => <Badge key={k} tone={BOARD[k]?.tone ?? "neutral"} dot>{n} {BOARD[k]?.label.toLowerCase() ?? k}</Badge>)}
      </div>
      <Card flush>
        {data.attendanceBoard.length ? (
          <table className="w-full text-sm">
            <thead className="bg-subtle/70 text-left"><tr>
              <th className="px-4 py-2.5 font-semibold text-ink">Person</th><th className="px-3 py-2.5 font-semibold text-ink">Status</th>
              <th className="px-3 py-2.5 font-semibold text-ink">In</th><th className="px-3 py-2.5 font-semibold text-ink">Out</th>
              <th className="px-3 py-2.5 text-right font-semibold text-ink">Worked</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.attendanceBoard.map((r) => (
                <tr key={r.employeeId} className="cursor-pointer hover:bg-subtle/50" onClick={() => setPerson({ id: r.employeeId, name: r.employeeName })}>
                  <td className="px-4 py-2"><span className="font-medium text-ink">{r.employeeName}</span>{r.department && <span className="block text-xs text-muted">{r.department}</span>}</td>
                  <td className="px-3 py-2"><span className="flex flex-wrap gap-1"><Badge tone={BOARD[r.status]?.tone ?? "neutral"} dot>{BOARD[r.status]?.label ?? r.status}</Badge>
                    {r.flags.map((f) => <Badge key={f} tone="warn">{FLAG[f] ?? f}</Badge>)}</span></td>
                  <td className="px-3 py-2 tabular-nums">{time(r.clockIn)}</td>
                  <td className="px-3 py-2 tabular-nums">{time(r.clockOut)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.worked ? hm(r.worked) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-5 text-sm text-muted">No one reports to you.</p>}
      </Card>
    </>
  );
}

function Approvals() {
  const [{ data, error }, reload] = useQuery({ query: OvertimeDocument, requestPolicy: "cache-and-network" });
  const [, decide] = useMutation(DecideDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  return (
    <Card flush title="Overtime to approve" description="Approved overtime is paid in the next payroll.">
      {data.overtimeToDecide.length ? (
        <ul className="divide-y divide-line">
          {data.overtimeToDecide.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span><span className="font-medium text-ink">{o.employeeName}</span> <span className="text-muted">{hm(o.minutes)} extra on {formatDate(o.date)}</span></span>
              <span className="flex gap-2">
                <Button size="sm" onClick={async () => { await decide({ id: o.id, approve: true }); reload({ requestPolicy: "network-only" }); }}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={async () => { await decide({ id: o.id, approve: false }); reload({ requestPolicy: "network-only" }); }}>Reject</Button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="p-5 text-sm text-muted">Nothing waiting.</p>}
    </Card>
  );
}

type Tab = "mine" | "timesheet" | "team" | "approvals";

function Attendance() {
  const { can, me, tenant } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const manage = can(PERMS.attendanceManage);
  const lead = manage || me?.roles.includes("manager");
  const clocking = Boolean(tenant?.attendanceEnabled);
  const sheets = Boolean(tenant?.timesheetsEnabled);
  const tabs: { key: Tab; label: string }[] = [
    ...(me?.employee && (clocking || !sheets) ? [{ key: "mine" as const, label: "My time" }] : []),
    ...(me?.employee && sheets ? [{ key: "timesheet" as const, label: "Timesheet" }] : []),
    ...(lead ? [{ key: "team" as const, label: "Team" }, { key: "approvals" as const, label: "Approvals" }] : []),
  ];
  const asked = params.get("tab") as Tab | null;
  const tab = tabs.some((t) => t.key === asked) ? asked! : tabs[0]?.key ?? "team";
  return (
    <>
      <PageHeader title="Attendance" subtitle="Clock in and out, log hours against projects, and see the hours you and your team work." />
      <Tabs value={tab} onChange={(t) => router.replace(`${pathname}?tab=${t}`)} tabs={tabs} />
      {tab === "mine" ? <MyTime /> : tab === "timesheet" ? <MyTimesheet initialWeek={params.get("week")} />
        : tab === "team" ? <div className="grid gap-5">{(clocking || !sheets) && <Team />}{sheets && <TeamTimesheets canExport={manage} />}</div>
        : <div className="grid gap-5">{(clocking || !sheets) && <Approvals />}{sheets && <TimesheetApprovals />}</div>}
    </>
  );
}

export default function AttendancePage() {
  return <Suspense fallback={<Loading />}><Attendance /></Suspense>;
}

