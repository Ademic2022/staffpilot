"use client";

import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment, useState } from "react";
import { useQuery } from "urql";

import { MyLoans } from "@/components/payroll/Loans";
import { Card, ErrorNote, Loading, PageHeader, Stat } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

const MyPayslipsDocument = graphql(`
  query MyPayslips {
    myPayslips { id periodStart periodEnd payDate currency gross totalDeductions net lines }
  }
`);

type Line = { code: string; name: string; kind: string; amount: string };

/** Your payslips once payroll publishes them (ESS-02). */
export default function PayslipsPage() {
  const [{ data, error }] = useQuery({ query: MyPayslipsDocument });
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const slips = data.myPayslips;
  const latest = slips[0];
  return (
    <>
      <PageHeader title="My payslips" subtitle="Each one is published here when payroll is approved." />
      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`Net pay, ${new Date(`${latest.periodEnd}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
            value={formatMoney(String(latest.net), latest.currency)} />
          <Stat label="Gross pay" value={formatMoney(String(latest.gross), latest.currency)} />
          <Stat label="Deductions" value={formatMoney(String(latest.totalDeductions), latest.currency)} />
          <Stat label="Paid on" value={formatDate(latest.payDate)} />
        </div>
      )}
      <MyLoans />
      <Card flush>
        {slips.length ? (
          <table className="w-full text-sm">
            <thead className="bg-subtle/70 text-left"><tr>
              <th className="px-4 py-2.5 font-semibold text-ink">Period</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Gross</th>
              <th className="px-3 py-2.5 text-right font-semibold text-ink">Net</th><th className="px-3 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {slips.map((s) => (
                <Fragment key={s.id}>
                  <tr className="cursor-pointer hover:bg-subtle/50" onClick={() => setOpen(open === s.id ? null : s.id)}>
                    <td className="px-4 py-2.5"><span className="font-medium text-ink">{formatDate(s.periodStart)} – {formatDate(s.periodEnd)}</span>
                      <span className="block text-xs text-muted">Paid {formatDate(s.payDate)}</span></td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(String(s.gross), s.currency)}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMoney(String(s.net), s.currency)}</td>
                    <td className="px-3 py-2.5 text-right"><a href={`/api/payslips/${s.id}.pdf`} onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-ink hover:underline"><FontAwesomeIcon icon={faFilePdf} />PDF</a></td>
                  </tr>
                  {open === s.id && (
                    <tr><td colSpan={4} className="px-4 pb-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(["earning", "deduction", "reimbursement"] as const).filter((kind) => kind !== "reimbursement" || (s.lines as Line[]).some((l) => l.kind === kind)).map((kind) => (
                          <ul key={kind} className="space-y-1">
                            <li className="text-xs font-semibold uppercase tracking-wide text-muted">{{ earning: "Earnings", deduction: "Deductions", reimbursement: "Expenses paid back" }[kind]}</li>
                            {(s.lines as Line[]).filter((l) => l.kind === kind).map((l) => (
                              <li key={l.code} className="flex justify-between"><span>{l.name}</span><span className="tabular-nums">{formatMoney(l.amount, s.currency)}</span></li>
                            ))}
                          </ul>
                        ))}
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : <p className="p-5 text-sm text-muted">No payslips yet. They appear here once payroll publishes them.</p>}
      </Card>
    </>
  );
}
