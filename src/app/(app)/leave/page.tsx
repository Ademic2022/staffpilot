"use client";

import { useState } from "react";
import { useQuery } from "urql";

import { IconCalendarCheck, IconPlus } from "@/components/icons";
import { BalanceCards, EmployeeLeaveDocument, LedgerTable, RequestLeaveDialog, RequestsTable } from "@/components/leave/Leave";
import { Button, Card, Empty, ErrorNote, Loading, Notice, PageHeader, Tabs } from "@/components/ui";
import { graphql } from "@/gql";
import { errorCode, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { today } from "@/lib/forms";

const HolidaysDocument = graphql(`
  query UpcomingHolidays($year: Int!, $next: Int!) {
    thisYear: publicHolidays(year: $year) { id name date location { name } }
    nextYear: publicHolidays(year: $next) { id name date location { name } }
  }
`);

export default function LeavePage() {
  const [{ data, error }, reload] = useQuery({ query: EmployeeLeaveDocument, variables: {} });
  const year = new Date().getFullYear();
  const [{ data: holidayData }] = useQuery({ query: HolidaysDocument, variables: { year, next: year + 1 } });
  const [requesting, setRequesting] = useState(false);
  const [tab, setTab] = useState<"requests" | "ledger">("requests");
  const [saved, setSaved] = useState<string>();

  if (error) {
    return errorCode(error) === "no_employee"
      ? <Notice tone="info" title="No employee record">Your account is not linked to an employee record, so there is no leave to show. If you work here, add yourself from Home.</Notice>
      : <ErrorNote error={errorMessage(error)} />;
  }
  if (!data) return <Loading />;
  const { balances, requests, ledger } = data.employeeLeave;
  const refresh = () => reload({ requestPolicy: "network-only" });
  const upcoming = [...(holidayData?.thisYear ?? []), ...(holidayData?.nextYear ?? [])]
    .filter((h) => h.date >= today())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Time off"
        subtitle="Your balances, requests and the public holidays ahead."
        actions={balances.length ? <Button icon={<IconPlus size={16} />} onClick={() => { setSaved(undefined); setRequesting(true); }}>Request time off</Button> : null}
      />
      {saved && <Notice tone="success">{saved}</Notice>}

      {balances.length ? (
        <BalanceCards balances={balances} />
      ) : (
        <Notice tone="info">No leave types apply to you yet. HR sets up leave policies.</Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-3">
          <Tabs value={tab} onChange={setTab} tabs={[
            { key: "requests", label: "Requests", count: requests.length },
            { key: "ledger", label: "Balance history" },
          ]} />
          <Card flush>
            {tab === "requests" ? (
              requests.length ? (
                <RequestsTable requests={requests} onChanged={() => { setSaved("Leave cancelled."); refresh(); }} />
              ) : (
                <div className="p-5">
                  <Empty title="No requests yet" icon={<IconCalendarCheck size={18} />}>Requests you make appear here with their approval progress.</Empty>
                </div>
              )
            ) : ledger.length ? (
              <LedgerTable ledger={ledger} />
            ) : (
              <div className="p-5"><Empty title="Nothing on the ledger yet" /></div>
            )}
          </Card>
        </div>

        <Card title="Public holidays" description="Coming up where you work">
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((h) => (
                <li key={h.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{h.name}</span>
                    {h.location && <span className="block text-xs text-muted">{h.location.name} only</span>}
                  </span>
                  <span className="flex-none tabular-nums text-muted">{formatDate(h.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">None set up yet.</p>
          )}
        </Card>
      </div>

      {requesting && (
        <RequestLeaveDialog
          balances={balances}
          onClose={() => setRequesting(false)}
          onSaved={(status) => {
            setRequesting(false);
            setSaved(status === "APPROVED" ? "Leave booked. No approval was needed." : "Request sent. Your manager has been asked to approve it.");
            refresh();
          }}
        />
      )}
    </>
  );
}
