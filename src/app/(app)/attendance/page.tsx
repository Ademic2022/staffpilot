"use client";

import { faLocationDot, faPen, faRightFromBracket, faRightToBracket, faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { ActionDialog, Badge, type BadgeTone, Button, Card, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, PageHeader, Tabs } from "@/components/ui";
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
  mutation DecideOvertime($id: ID!, $approve: Boolean!, $note: String!) { decideOvertime(id: $id, approve: $approve, note: $note) { id status } }
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

/** "Fri 13 Nov": fits a phone's table column on one line. */
function shortDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function DayBadges({ d, flags }: { d: Day; flags: string[] }) {
  return (
    <>
      {d.absent && <Badge tone="bad">Absent</Badge>}
      {d.onLeave && <Badge tone="brand">On leave</Badge>}
      {flags.map((f) => <Badge key={f} tone={f === "late" || f === "off_site" ? "warn" : "neutral"}>{FLAG[f] ?? f}</Badge>)}
      {d.overtime && <Badge tone={d.overtime.status === "approved" ? "good" : d.overtime.status === "rejected" ? "neutral" : "warn"}>
        Overtime {hm(d.overtime.minutes)} · {d.overtime.status === "pending" ? "waiting" : d.overtime.status}</Badge>}
    </>
  );
}

function DayRows({ days, onEdit }: { days: Day[]; onEdit?: (d: Day) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-subtle/70 text-left"><tr>
        <th className="px-4 py-2.5 font-semibold text-ink">Day</th><th className="px-3 py-2.5 font-semibold text-ink">In</th>
        <th className="px-3 py-2.5 font-semibold text-ink">Out</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Worked</th>
        <th className="hidden px-3 py-2.5 font-semibold text-ink sm:table-cell" /><th className="w-10" />
      </tr></thead>
      <tbody className="divide-y divide-line">
        {days.map((d) => {
          const flags = [...new Set(d.entries.flatMap((e) => e.flags))];
          return (
            <tr key={d.date}>
              <td className="px-4 py-2">
                <span className="whitespace-nowrap text-ink"><span className="sm:hidden">{shortDay(d.date)}</span><span className="hidden sm:inline">{formatDate(d.date)}</span></span>
                <span className="block text-xs text-muted">{d.holiday ? "Public holiday" : d.scheduled ? d.shift : "Not a working day"}
                  {d.entries.length > 1 && ` · ${d.entries.length} clock-ins`}</span>
                <span className="mt-1 flex flex-wrap gap-1 sm:hidden"><DayBadges d={d} flags={flags} /></span></td>
              <td className="px-3 py-2 tabular-nums">{time(d.entries[0]?.clockIn)}</td>
              <td className="px-3 py-2 tabular-nums">{d.entries.length ? time(d.entries[d.entries.length - 1].clockOut) : "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{d.worked ? hm(d.worked) : "—"}</td>
              <td className="hidden px-3 py-2 sm:table-cell">
                <span className="flex flex-wrap gap-1"><DayBadges d={d} flags={flags} /></span>
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
  if (!data) return <Loading shape="table" />;
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
            {me.geofenced && <p className="mt-1 flex items-center gap-2 text-xs text-muted"><FontAwesomeIcon icon={faLocationDot} />{open ? "Your location was checked when you clocked in." : "Your location is checked when you clock in."}</p>}
          </div>
          <Button busy={busy} className="h-14 px-8 text-base" icon={<FontAwesomeIcon icon={open ? faRightFromBracket : faRightToBracket} />}
            onClick={() => run(open ? "out" : "in")}>{open ? "Clock out" : "Clock in"}</Button>
        </div>
      </Card>
      <Card flush title="Last two weeks"><DayRows days={me.days} /></Card>
    </>
  );
}

type Row = { id: string | null; start: string; end: string; note: string; minutes?: number | null; gone?: boolean };

/**
 * Correct a day's time. A day can hold several clock-ins (in, out, in again), so every entry is
 * listed with its own times: fixing a forgotten clock-out means fixing that entry, not the first.
 */
function EntryDialog({ employeeId, day, onClose, onSaved }: { employeeId: string; day: Day; onClose: () => void; onSaved: () => void }) {
  const local = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  const [rows, setRows] = useState<Row[]>(() => day.entries.length
    ? day.entries.map((e) => ({ id: e.id, start: local(e.clockIn), end: local(e.clockOut), note: e.note ?? "", minutes: e.minutes }))
    : [{ id: null, start: `${day.date}T09:00`, end: `${day.date}T17:00`, note: "" }]);
  const [problem, setProblem] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, save] = useMutation(SaveEntryDocument);
  const [, remove] = useMutation(DeleteEntryDocument);
  const change = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const shown = rows.filter((r) => !r.gone);

  async function saveAll() {
    setBusy(true);
    setProblem(undefined);
    for (const r of rows) {
      const result = r.gone
        ? (r.id ? await remove({ id: r.id }) : null)
        : await save({ input: { id: r.id, employeeId, date: day.date, clockIn: new Date(r.start).toISOString(),
          clockOut: r.end ? new Date(r.end).toISOString() : null, note: r.note } });
      const failed = result && (errorMessage(result.error) ?? (result.data && "saveTimeEntry" in result.data ? result.data.saveTimeEntry.errors[0]?.message : undefined));
      if (failed) { setBusy(false); return setProblem(failed); }
    }
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title={`Time on ${formatDate(day.date)}`}
      description={shown.length > 1
        ? `${shown.length} clock-ins this day. Correct the one that is wrong, for example a forgotten clock-out. Changes are marked as edited and recorded in the audit log.`
        : "Changes are marked as edited and recorded in the audit log."}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button busy={busy} onClick={() => void saveAll()}>Save</Button></>}>
      <div className="space-y-4">
        {problem && <ErrorNote error={problem} />}
        {shown.length === 0 && <p className="text-sm text-muted">No time left for this day. Save to remove it all, or add time.</p>}
        {rows.map((r, i) => r.gone ? null : (
          <div key={r.id ?? `new-${i}`} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                {r.id ? `Entry ${shown.indexOf(r) + 1}` : "New time"}{r.minutes != null && r.id ? ` · ${hm(r.minutes)}` : ""}
              </span>
              <button type="button" className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
                onClick={() => change(i, { gone: true })}><FontAwesomeIcon icon={faTrash} /> Remove</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="In"><Input type="datetime-local" value={r.start} onChange={(e) => change(i, { start: e.target.value })} /></Field>
              <Field label="Out" optional><Input type="datetime-local" value={r.end} onChange={(e) => change(i, { end: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Why" optional>
                <Input value={r.note} onChange={(e) => change(i, { note: e.target.value })} placeholder="Forgot to clock out" />
              </Field></div>
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" icon={<IconPlus size={14} />}
          onClick={() => setRows((rs) => [...rs, { id: null, start: `${day.date}T09:00`, end: `${day.date}T17:00`, note: "" }])}>
          Add time
        </Button>
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
      {error ? <ErrorNote error={errorMessage(error)} /> : !data ? <Loading shape="table" /> : (
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
  if (!data) return <Loading shape="table" />;
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
  const [rejecting, setRejecting] = useState<{ id: string; name: string; amount: string } | null>(null);
  // Approved here: hidden at once and the button locked, so a second click cannot approve it again.
  const [busy, setBusy] = useState<string>();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [problem, setProblem] = useState<string>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const waiting = data.overtimeToDecide.filter((o) => !gone.has(o.id));

  async function approve(id: string) {
    if (busy) return;
    setBusy(id);
    setProblem(undefined);
    const r = await decide({ id, approve: true, note: "" });
    setBusy(undefined);
    if (r.error) return setProblem(errorMessage(r.error));
    setGone((g) => new Set(g).add(id));
    reload({ requestPolicy: "network-only" });
  }

  return (
    <Card flush title="Overtime to approve" description="Approved overtime is paid in the next payroll.">
      {problem && <div className="px-5 pt-4"><ErrorNote error={problem} /></div>}
      {waiting.length ? (
        <ul className="divide-y divide-line">
          {waiting.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span><span className="font-medium text-ink">{o.employeeName}</span> <span className="text-muted">{hm(o.minutes)} extra on {formatDate(o.date)}</span></span>
              <span className="flex gap-2">
                <Button size="sm" busy={busy === o.id} disabled={!!busy} onClick={() => approve(o.id)}>Approve</Button>
                <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => setRejecting({ id: o.id, name: o.employeeName, amount: `${hm(o.minutes)} on ${formatDate(o.date)}` })}>Reject</Button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="p-5 text-sm text-muted">Nothing waiting.</p>}
      {rejecting && (
        <ActionDialog open onClose={() => setRejecting(null)} title={`Reject ${rejecting.name}'s overtime?`}
          description={`${rejecting.amount}. ${rejecting.name.split(" ")[0]} is told, with your reason. If the time itself is wrong, correct it instead.`}
          confirmLabel="Reject" tone="danger"
          input={{ label: "Reason", placeholder: "Not agreed in advance", required: true }}
          onConfirm={async (note) => {
            if (!note) throw new Error("Say why, so they know.");
            const r = await decide({ id: rejecting.id, approve: false, note });
            if (r.error) throw new Error(errorMessage(r.error));
            setGone((g) => new Set(g).add(rejecting.id));
            reload({ requestPolicy: "network-only" });
          }} />
      )}
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
  return <Suspense fallback={<Loading shape="table" />}><Attendance /></Suspense>;
}

