"use client";

import { useState } from "react";
import { useQuery } from "urql";

import { RequestsTable, type LeaveBalanceRow, type LeaveRequestRow } from "@/components/leave/Leave";
import { Badge, Select, Table, TD, TH, cx, Loading } from "@/components/ui";
import { graphql } from "@/gql";
import { formatDate, formatDays, formatRange } from "@/lib/format";
import { today } from "@/lib/forms";

import { ProfileSection } from "./Section";

const LeaveHistoryDocument = graphql(`
  query LeaveHistory($employeeId: ID, $leaveTypeId: ID!, $year: Int) {
    leaveHistory(employeeId: $employeeId, leaveTypeId: $leaveTypeId, year: $year) {
      years
      rows { id date kind description detail used earned balance }
    }
  }
`);

const days = (value: string | null | undefined) => (value === null || value === undefined ? "" : Number(value).toFixed(2));

/** Approved and pending time off that has not finished yet, soonest first. */
export function UpcomingLeave({ requests, title = "Upcoming time off", icon = "calendar" }: { requests: LeaveRequestRow[]; title?: string; icon?: string }) {
  const now = today();
  const upcoming = requests
    .filter((r) => (r.status === "APPROVED" || r.status === "PENDING") && r.endDate >= now)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return (
    <ProfileSection title={title} icon={icon}>
      {upcoming.length ? (
        <ul className="divide-y divide-line">
          {upcoming.map((r) => (
            <li key={r.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="h-9 w-1 flex-none rounded-full" style={{ background: r.leaveType.color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink">{formatRange(r.startDate, r.endDate)}</p>
                <p className="text-xs text-muted">{r.leaveType.name} · {formatDays(r.days)}{r.reason ? ` · ${r.reason}` : ""}</p>
              </div>
              {r.status === "PENDING" ? <Badge tone="warn">Pending</Badge> : <Badge tone="good">Approved</Badge>}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">No time off coming up.</p>}
    </ProfileSection>
  );
}

/** Balance history per leave type with a running balance, or the full list of requests. */
export function LeaveHistory({ employeeId, balances, requests, showEmployee, onChanged, title = "History", icon = "history" }: {
  employeeId?: string; balances: LeaveBalanceRow[]; requests: LeaveRequestRow[]; showEmployee?: string; onChanged: () => void;
  title?: string; icon?: string;
}) {
  const tracked = balances.filter((b) => b.leaveType.tracksBalance);
  const [view, setView] = useState<"balance" | "requests">(tracked.length ? "balance" : "requests");
  const [typeId, setTypeId] = useState(tracked[0]?.leaveType.id ?? "");
  const [year, setYear] = useState<number | null>(null);
  const [{ data }] = useQuery({
    query: LeaveHistoryDocument, variables: { employeeId, leaveTypeId: typeId, year }, pause: view !== "balance" || !typeId,
  });
  const history = data?.leaveHistory;
  const shownRequests = requests.filter((r) => !year || r.startDate.startsWith(String(year)));

  return (
    <ProfileSection title={title} icon={icon} flush
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {view === "balance" && (
            <Select aria-label="Leave type" value={typeId} onChange={(e) => { setTypeId(e.target.value); setYear(null); }} className="h-9 w-auto">
              {tracked.map((b) => <option key={b.leaveType.id} value={b.leaveType.id}>{b.leaveType.name}</option>)}
            </Select>
          )}
          <Select aria-label="Year" value={year ?? ""} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)} className="h-9 w-auto">
            <option value="">All years</option>
            {(view === "balance" ? history?.years ?? [] : [...new Set(requests.map((r) => Number(r.startDate.slice(0, 4))))].sort((a, b) => b - a))
              .map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <div className="inline-flex rounded-lg border border-line-strong p-0.5 text-sm" role="tablist">
            {tracked.length > 0 && (
              <button type="button" role="tab" aria-selected={view === "balance"} onClick={() => setView("balance")}
                className={cx("rounded-md px-3 py-1.5 font-medium", view === "balance" ? "bg-subtle text-ink" : "text-muted hover:text-ink")}>
                Balance history
              </button>
            )}
            <button type="button" role="tab" aria-selected={view === "requests"} onClick={() => setView("requests")}
              className={cx("rounded-md px-3 py-1.5 font-medium", view === "requests" ? "bg-subtle text-ink" : "text-muted hover:text-ink")}>
              Requests
            </button>
          </div>
        </div>
      }>
      {view === "balance" ? (
        !history ? <div className="px-5 pb-5 sm:px-6"><Loading shape="inline" label="Loading history" /></div>
          : history.rows.length ? (
            <Table>
              <thead>
                <tr><TH>Date</TH><TH>Description</TH><TH align="right">Used days (−)</TH><TH align="right">Earned days (+)</TH><TH align="right">Balance</TH></tr>
              </thead>
              <tbody>
                {history.rows.map((r) => (
                  <tr key={r.id}>
                    <TD className="whitespace-nowrap tabular-nums text-muted">{formatDate(r.date)}</TD>
                    <TD>
                      <span className="text-ink">{r.description}</span>
                      {r.detail && <span className="block max-w-md truncate text-xs text-muted" title={r.detail}>{r.detail}</span>}
                    </TD>
                    <TD align="right" className="tabular-nums">{r.used ? `−${days(r.used)}` : ""}</TD>
                    <TD align="right" className="tabular-nums text-emerald-700 dark:text-emerald-300">{days(r.earned)}</TD>
                    <TD align="right" className={cx("tabular-nums font-medium", Number(r.balance) < 0 && "text-red-600")}>{days(r.balance)}</TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <p className="px-5 pb-5 text-sm text-muted sm:px-6">Nothing on the ledger{year ? ` in ${year}` : ""} yet.</p>
      ) : shownRequests.length ? (
        <RequestsTable requests={shownRequests} showEmployee={showEmployee} onChanged={onChanged} />
      ) : <p className="px-5 pb-5 text-sm text-muted sm:px-6">No requests{year ? ` in ${year}` : ""}.</p>}
    </ProfileSection>
  );
}
