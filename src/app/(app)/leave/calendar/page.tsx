"use client";

import { useState } from "react";
import { useQuery } from "urql";

import { IconCalendarCheck, IconChevronLeft, IconChevronRight } from "@/components/icons";
import { Card, Empty, ErrorNote, IconButton, Loading, PageHeader, Select, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { LeaveCalendarQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatRange } from "@/lib/format";
import { today } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const LeaveCalendarDocument = graphql(`
  query LeaveCalendar($start: Date!, $end: Date!, $departmentId: ID) {
    leaveCalendar(start: $start, end: $end, departmentId: $departmentId) {
      absences {
        requestId startDate endDate halfDay status
        employee { id fullName }
        leaveType { id name color }
      }
      holidays { id name date location { name } }
    }
  }
`);

const DepartmentsDocument = graphql(`
  query CalendarDepartments {
    departments { id name isActive }
  }
`);

type Absence = LeaveCalendarQuery["leaveCalendar"]["absences"][number];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const AWAY = "#94a3b8";

export default function LeaveCalendarPage() {
  const { can } = useSession();
  const seesAll = can(PERMS.employeesView, PERMS.leaveManage);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [departmentId, setDepartmentId] = useState("");
  const first = month;
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const [{ data, error }] = useQuery({
    query: LeaveCalendarDocument,
    variables: { start: iso(first), end: iso(last), departmentId: departmentId || null },
  });
  const [{ data: departments }] = useQuery({ query: DepartmentsDocument, pause: !seesAll });

  const days = Array.from({ length: last.getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1));
  const now = today();
  const holidays = new Map((data?.leaveCalendar.holidays ?? []).map((h) => [h.date, h]));

  // One row per person, their absences in date order.
  const rows = new Map<string, { name: string; absences: Absence[] }>();
  for (const a of data?.leaveCalendar.absences ?? []) {
    const row = rows.get(a.employee.id) ?? { name: a.employee.fullName, absences: [] };
    row.absences.push(a);
    rows.set(a.employee.id, row);
  }
  const people = [...rows.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  const types = new Map((data?.leaveCalendar.absences ?? []).flatMap((a) => (a.leaveType ? [[a.leaveType.id, a.leaveType] as const] : [])));
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <>
      <PageHeader title="Leave calendar" subtitle={seesAll ? "Who is away across the company." : "Who is away in your team."}
        actions={
          <div className="flex items-center gap-2">
            {seesAll && (
              <Select className="w-auto" value={departmentId} aria-label="Department" onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">All departments</option>
                {departments?.departments.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            )}
            <div className="flex items-center rounded-lg border border-line-strong bg-surface shadow-sm">
              <IconButton label="Previous month" onClick={() => shift(-1)}><IconChevronLeft size={16} /></IconButton>
              <span className="min-w-32 text-center text-sm font-medium tabular-nums">
                {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <IconButton label="Next month" onClick={() => shift(1)}><IconChevronRight size={16} /></IconButton>
            </div>
          </div>
        } />

      {error ? <ErrorNote error={errorMessage(error)} /> : !data ? <Loading shape="table" /> : (
        <Card flush>
          {people.length === 0 ? (
            <div className="p-5">
              <Empty title="No one is away this month" icon={<IconCalendarCheck size={18} />}>
                {holidays.size ? `Public holidays: ${[...holidays.values()].map((h) => h.name).join(", ")}.` : undefined}
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 min-w-40 border-b border-r border-line bg-surface px-4 py-2 text-left font-medium text-muted">Person</th>
                    {days.map((d) => {
                      const key = iso(d);
                      const weekend = d.getDay() === 0 || d.getDay() === 6;
                      const holiday = holidays.get(key);
                      return (
                        <th key={key} title={holiday?.name}
                          className={cx("min-w-8 border-b border-line px-0 py-1.5 text-center font-medium tabular-nums",
                            weekend || holiday ? "bg-subtle text-muted/70" : "text-muted",
                            key === now && "text-brand-ink")}>
                          <div className="text-[10px] uppercase">{d.toLocaleDateString(undefined, { weekday: "narrow" })}</div>
                          <div className={cx(key === now && "mx-auto grid h-5 w-5 place-items-center rounded-full bg-brand text-white")}>{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {people.map(([id, row]) => (
                    <tr key={id}>
                      <th scope="row" className="sticky left-0 z-10 truncate border-b border-r border-line bg-surface px-4 py-2 text-left text-[13px] font-medium text-ink">{row.name}</th>
                      {days.map((d) => {
                        const key = iso(d);
                        const weekend = d.getDay() === 0 || d.getDay() === 6;
                        const holiday = holidays.has(key);
                        const absence = row.absences.find((a) => a.startDate <= key && key <= a.endDate);
                        const off = absence && !weekend && !holiday;
                        const color = absence?.leaveType?.color ?? AWAY;
                        return (
                          <td key={key} className={cx("h-9 border-b border-line p-0.5", (weekend || holiday) && "bg-subtle")}>
                            {off && (
                              <div
                                title={`${absence.leaveType?.name ?? "Away"}, ${formatRange(absence.startDate, absence.endDate)}${absence.status === "PENDING" ? " (pending)" : ""}`}
                                className={cx("h-full rounded", absence.halfDay && "w-1/2")}
                                style={absence.status === "PENDING"
                                  ? { backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)`, boxShadow: `inset 0 0 0 1.5px ${color}` }
                                  : { backgroundColor: color }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted">
            {[...types.values()].map((t) => (
              <span key={t.id} className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: t.color }} />{t.name}</span>
            ))}
            {data.leaveCalendar.absences.some((a) => !a.leaveType) && (
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: AWAY }} />Away</span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${AWAY} 0 2px, transparent 2px 4px)`, boxShadow: `inset 0 0 0 1px ${AWAY}` }} />
              Waiting for approval
            </span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-subtle ring-1 ring-line" />Weekend or public holiday</span>
          </div>
        </Card>
      )}
    </>
  );
}
