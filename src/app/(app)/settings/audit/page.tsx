"use client";

import { faChevronDown, faChevronRight, faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Fragment, useDeferredValue, useState } from "react";
import { useQuery } from "urql";

import { SettingsIntro } from "@/components/settings/Intro";
import { Button, Card, ErrorNote, Field, Input, Loading, SearchInput, Select } from "@/components/ui";
import { graphql } from "@/gql";
import type { AuditLogQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const AuditDocument = graphql(`
  query AuditLog($search: String, $action: String, $from: String, $to: String, $offset: Int!) {
    auditLog(search: $search, action: $action, dateFrom: $from, dateTo: $to, offset: $offset, limit: 50) {
      hasMore
      entries { id at actor action objectType objectId summary changes ipAddress }
    }
  }
`);

type Entry = AuditLogQuery["auditLog"]["entries"][number];

const AREAS = [
  ["", "Everything"], ["auth.", "Sign-ins and view-as"], ["employee.", "Employee records"], ["approval.", "Approvals"],
  ["report.", "Reports and exports"], ["document.", "Documents"], ["company_file.", "Company files"], ["role.", "Access levels"],
  ["tenant.", "Company settings"], ["leave", "Time off"], ["api_key.", "API keys"],
] as const;

function time(iso: string) {
  return `${formatDate(iso)} ${new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function exportCsv(rows: Entry[]) {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const lines = [["When", "Who", "Action", "Summary", "IP address"], ...rows.map((r) => [r.at, r.actor ?? "System", r.action, r.summary, r.ipAddress ?? ""])];
  const url = URL.createObjectURL(new Blob(["﻿" + lines.map((l) => l.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Settings → Audit log: who viewed, changed or exported what (ADM-04). Read-only. */
export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const q = useDeferredValue(search.trim());
  const [{ data, error, fetching }] = useQuery({
    query: AuditDocument, variables: { search: q || null, action: action || null, from: from || null, to: to || null, offset },
  });
  const page = data?.auditLog;
  const reset = () => setOffset(0);

  return (
    <>
      <SettingsIntro actions={page?.entries.length ? <Button variant="secondary" icon={<FontAwesomeIcon icon={faFileArrowDown} />} onClick={() => exportCsv(page.entries)}>Export this page</Button> : undefined}>
        Every change, sensitive view, export and sign-in, newest first. Entries cannot be edited or deleted.
      </SettingsIntro>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search"><SearchInput aria-label="Search the audit log" placeholder="Name, email or summary" value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} /></Field>
        <Field label="Area">
          <Select value={action} onChange={(e) => { setAction(e.target.value); reset(); }}>
            {AREAS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </Select>
        </Field>
        <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); reset(); }} /></Field>
        <Field label="To"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); reset(); }} /></Field>
      </div>
      {error ? <ErrorNote error={errorMessage(error)} /> : !page ? <Loading shape="table" /> : (
        <Card flush>
          <div className={fetching ? "opacity-60" : undefined}>
            <table className="w-full text-sm">
              <thead className="bg-subtle/70 text-left">
                <tr>
                  <th className="w-8" />
                  <th className="px-3 py-2.5 font-semibold text-ink">When</th>
                  <th className="px-3 py-2.5 font-semibold text-ink">Who</th>
                  <th className="px-3 py-2.5 font-semibold text-ink">What</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {page.entries.map((r) => {
                  const changes = Object.keys((r.changes as Record<string, unknown>) ?? {}).length > 0;
                  return (
                    <Fragment key={r.id}>
                      <tr className="align-top">
                        <td className="pl-3 pt-3">
                          {changes && (
                            <button type="button" aria-label={open === r.id ? "Hide details" : "Show details"} onClick={() => setOpen(open === r.id ? null : r.id)}
                              className="text-muted hover:text-ink"><FontAwesomeIcon icon={open === r.id ? faChevronDown : faChevronRight} className="text-xs" /></button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{time(r.at)}</td>
                        <td className="px-3 py-2.5 text-ink">{r.actor ?? "System"}{r.ipAddress && <span className="block text-xs text-muted">{r.ipAddress}</span>}</td>
                        <td className="px-3 py-2.5">
                          <span className="block text-ink">{r.summary || r.action}</span>
                          <span className="block text-xs text-muted">
                            {r.action}
                            {r.objectType === "core_hr.employee" && r.objectId && <> · <Link href={`/employees/${r.objectId}`} className="hover:underline">open record</Link></>}
                          </span>
                        </td>
                      </tr>
                      {open === r.id && (
                        <tr><td /><td colSpan={3} className="px-3 pb-3">
                          <pre className="max-h-64 overflow-auto rounded-lg bg-subtle p-3 text-xs text-ink">{JSON.stringify(r.changes, null, 2)}</pre>
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
                {!page.entries.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Nothing matches.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>Showing {offset + 1}–{offset + page.entries.length}</span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Newer</Button>
              <Button size="sm" variant="secondary" disabled={!page.hasMore} onClick={() => setOffset(offset + 50)}>Older</Button>
            </span>
          </div>
        </Card>
      )}
    </>
  );
}
