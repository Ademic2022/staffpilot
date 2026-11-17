"use client";

import { faChevronDown, faChevronRight, faFileArrowDown, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import { Fragment, useState } from "react";
import { useMutation, useQuery } from "urql";

import { RUN_STATUS } from "@/components/payroll/status";
import { ActionDialog, Badge, Button, Card, ErrorNote, Input, Loading, Notice, PageHeader, Stat, Tabs } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const RunDocument = graphql(`
  query PayrollRunDetail($id: ID!) {
    payrollRun(id: $id) {
      id payGroup currency periodStart periodEnd payDate status offCycle note createdBy submittedBy approvedBy published
      headcount gross deductions net employerCost warnings missingBank bankNameMismatch canApprove
      payslips { id employeeName employeeNumber gross totalDeductions net employerCost lines workings warnings daysPaid daysInPeriod rulePack }
      variance { employeeId employeeName net previous change percent flag }
    }
  }
`);

const ActionDocument = graphql(`
  mutation PayrollRunAction($id: ID!, $recalc: Boolean!, $submit: Boolean!, $approve: Boolean!, $publish: Boolean!, $paid: Boolean!, $cancel: Boolean!) {
    recalculatePayrollRun(id: $id) @include(if: $recalc) { errors { message } }
    submitPayrollRun(id: $id) @include(if: $submit) { errors { message } }
    approvePayrollRun(id: $id) @include(if: $approve) { errors { message } }
    publishPayslips(id: $id) @include(if: $publish) { errors { message } }
    markPayrollPaid(id: $id) @include(if: $paid) { errors { message } }
    cancelPayrollRun(id: $id) @include(if: $cancel) { errors { message } }
  }
`);

const SendBackDocument = graphql(`
  mutation SendBackPayrollRun($id: ID!, $note: String!) { sendBackPayrollRun(id: $id, note: $note) { errors { message } } }
`);

type Line = { code: string; name: string; kind: string; amount: string; note?: string };
const FLAGS: Record<string, string> = { new: "New this period", missing: "Paid last time, not now", big_change: "Changed by 10% or more" };

export default function PayrollRunPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useSession();
  const [{ data, error, fetching }, reload] = useQuery({ query: RunDocument, variables: { id }, requestPolicy: "network-only" });
  const [, act] = useMutation(ActionDocument);
  const [, sendBack] = useMutation(SendBackDocument);
  const [tab, setTab] = useState<"payslips" | "changes" | "files">("payslips");
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const run = data.payrollRun;
  const money = (v: unknown) => formatMoney(String(v), run.currency);
  const manage = can(PERMS.payrollManage);
  const approver = can(PERMS.payrollApprove);

  const run_ = async (which: "recalc" | "submit" | "approve" | "publish" | "paid" | "cancel", done: string) => {
    const flags = { recalc: false, submit: false, approve: false, publish: false, paid: false, cancel: false, [which]: true };
    const r = await act({ id, ...flags });
    const problem = errorMessage(r.error) ?? Object.values(r.data ?? {}).find((x) => x && "errors" in x && x.errors.length)?.errors[0]?.message;
    setMessage(problem ? { ok: false, text: problem } : { ok: true, text: done });
    reload({ requestPolicy: "network-only" });
  };
  const flagged = run.variance.filter((v) => v.flag);
  const file = (kind: string, fmt: string) => `/api/payroll/runs/${id}/${kind}.${fmt}`;

  return (
    <>
      <PageHeader back={{ href: "/payroll", label: "Payroll" }} title={`${run.payGroup}: ${formatDate(run.periodStart)} – ${formatDate(run.periodEnd)}`}
        subtitle={<><Badge tone={RUN_STATUS[run.status]?.tone ?? "neutral"} dot>{RUN_STATUS[run.status]?.label}</Badge>
          <span>Pay day {formatDate(run.payDate)}</span>{run.offCycle && <span>· off-cycle</span>}
          {run.createdBy && <span>· prepared by {run.createdBy}</span>}{run.approvedBy && <span>· approved by {run.approvedBy}</span>}</>}
        actions={<>
          {manage && ["draft", "review"].includes(run.status) && <Button variant="secondary" busy={fetching} onClick={() => run_("recalc", "Worked out again.")}>Work out again</Button>}
          {manage && run.status === "draft" && <Button onClick={() => run_("submit", "Sent for approval.")}>Send for approval</Button>}
          {run.canApprove && <Button onClick={() => run.missingBank.length || run.bankNameMismatch.length
            ? setConfirmApprove(true) : run_("approve", "Approved. Publish payslips and make the bank file next.")}>Approve</Button>}
          {approver && ["approved", "paid"].includes(run.status) && !run.published && <Button onClick={() => run_("publish", "Payslips published; everyone has been told.")}>Publish payslips</Button>}
          {approver && run.status === "approved" && <Button variant="secondary" onClick={() => run_("paid", "Marked as paid.")}>Mark as paid</Button>}
          {manage && ["draft", "review"].includes(run.status) && <Button variant="ghost" onClick={() => run_("cancel", "Payroll cancelled.")}>Cancel</Button>}
        </>} />
      {message && (message.ok ? <Notice tone="success">{message.text}</Notice> : <ErrorNote error={message.text} />)}
      {run.note && <Notice title="Note">{run.note}</Notice>}
      {run.status === "review" && !run.canApprove && <Notice>Waiting for someone with payroll approval, other than whoever prepared it, to approve it.</Notice>}
      {run.canApprove && (
        <div className="flex flex-wrap items-center gap-2">
          <Input className="max-w-md" placeholder="Why it needs changing" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button variant="secondary" disabled={!note.trim()} onClick={async () => { await sendBack({ id, note }); setNote(""); reload({ requestPolicy: "network-only" }); }}>Send back</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
        <Stat label="People" value={run.headcount} />
        <Stat label="Gross pay" value={money(run.gross)} />
        <Stat label="Deductions" value={money(run.deductions)} />
        <Stat label="Net pay" value={money(run.net)} />
        <Stat label="Cost to employer" value={money(run.employerCost)} />
      </div>
      {["draft", "review", "approved"].includes(run.status) && run.missingBank.length > 0 && (
        <Notice tone="warning" title={`${run.missingBank.length} ${run.missingBank.length === 1 ? "person has" : "people have"} no bank account`}>
          They cannot be paid by bank transfer: {run.missingBank.join(", ")}. Add their account on each profile (Personal → Bank and ID details).
          The bank file leaves them out until you do; nothing needs working out again.
        </Notice>
      )}
      {["draft", "review", "approved"].includes(run.status) && run.bankNameMismatch.length > 0 && (
        <Notice tone="warning" title="Account in someone else's name">
          The bank says these accounts belong to someone else: {run.bankNameMismatch.join("; ")}. Make sure that is expected
          (a joint or business account) before paying, since pay sent to the wrong account is hard to get back.
        </Notice>
      )}
      <ActionDialog open={confirmApprove} onClose={() => setConfirmApprove(false)} title="Approve with bank details to check?"
        description={[
          run.missingBank.length ? `No bank account: ${run.missingBank.join(", ")}. The bank file cannot pay them.` : "",
          run.bankNameMismatch.length ? `Account in someone else's name: ${run.bankNameMismatch.join("; ")}.` : "",
          "Approve anyway if you have checked these.",
        ].filter(Boolean).join(" ")}
        confirmLabel="Approve anyway" onConfirm={async () => {
          setConfirmApprove(false);
          await run_("approve", "Approved. Publish payslips and make the bank file next.");
        }} />
      {["draft", "review"].includes(run.status) && (run.warnings > 0 || flagged.length > 0) && (
        <Notice tone="warning" title="Check before approving">
          {run.warnings > 0 && <>{run.warnings} payslip{run.warnings === 1 ? " has" : "s have"} notes (joiners, leavers, unpaid leave or missing pay). </>}
          {flagged.length > 0 && <>{flagged.length} change{flagged.length === 1 ? "" : "s"} since the last payroll — see Changes.</>}
        </Notice>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: "payslips", label: "Payslips", count: run.payslips.length }, { key: "changes", label: "Changes", count: flagged.length },
        { key: "files", label: "Files" },
      ]} />

      {tab === "payslips" && (
        <Card flush>
          <table className="w-full text-sm">
            <thead className="bg-subtle/70 text-left"><tr>
              <th className="w-8" /><th className="px-3 py-2.5 font-semibold text-ink">Employee</th>
              <th className="px-3 py-2.5 text-right font-semibold text-ink">Gross</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Deductions</th>
              <th className="px-3 py-2.5 text-right font-semibold text-ink">Net</th><th className="px-3 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {run.payslips.map((s) => {
                const lines = s.lines as Line[];
                return (
                  <Fragment key={s.id}>
                    <tr className="align-top">
                      <td className="pl-3 pt-3"><button type="button" aria-label="Show lines" onClick={() => setOpen(open === s.id ? null : s.id)} className="text-muted hover:text-ink">
                        <FontAwesomeIcon icon={open === s.id ? faChevronDown : faChevronRight} className="text-xs" /></button></td>
                      <td className="px-3 py-2.5"><span className="font-medium text-ink">{s.employeeName}</span>
                        <span className="block text-xs text-muted">{s.employeeNumber}{s.daysPaid != null && Number(s.daysPaid) < Number(s.daysInPeriod) ? ` · ${Number(s.daysPaid)} of ${Number(s.daysInPeriod)} days` : ""}</span>
                        {s.warnings.map((w) => <span key={w} className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300"><FontAwesomeIcon icon={faTriangleExclamation} />{w}</span>)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(s.gross)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(s.totalDeductions)}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">{money(s.net)}</td>
                      <td className="px-3 py-2.5 text-right"><a href={`/api/payslips/${s.id}.pdf`} className="text-xs font-medium text-brand-ink hover:underline">PDF</a></td>
                    </tr>
                    {open === s.id && (
                      <tr><td /><td colSpan={5} className="px-3 pb-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          {(["earning", "deduction", "employer", "reimbursement"] as const).filter((kind) => kind !== "reimbursement" || lines.some((l) => l.kind === kind)).map((kind) => (
                            <div key={kind}>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{{ earning: "Earnings", deduction: "Deductions", employer: "Employer pays", reimbursement: "Paid back (not taxed)" }[kind]}</p>
                              <ul className="space-y-1">
                                {lines.filter((l) => l.kind === kind).map((l) => (
                                  <li key={l.code} className="flex justify-between gap-3"><span className="text-ink">{l.name}{l.note && <span className="block text-xs text-muted">{l.note}</span>}</span>
                                    <span className="tabular-nums">{money(l.amount)}</span></li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-muted">
                          Chargeable this period {money((s.workings as Record<string, string>).chargeable)} after deductions of {money((s.workings as Record<string, string>).deductible)} and reliefs of {money((s.workings as Record<string, string>).relief)}. {s.rulePack}
                        </p>
                      </td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "changes" && (
        <Card flush title="Net pay against the last payroll" description="New people, people no longer paid, and changes of 10% or more are flagged.">
          <table className="w-full text-sm">
            <thead className="bg-subtle/70 text-left"><tr>
              <th className="px-4 py-2.5 font-semibold text-ink">Employee</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Last time</th>
              <th className="px-3 py-2.5 text-right font-semibold text-ink">Now</th><th className="px-3 py-2.5 text-right font-semibold text-ink">Change</th><th className="px-3 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {run.variance.map((v) => (
                <tr key={v.employeeId} className={v.flag ? "bg-amber-50/60 dark:bg-amber-950/20" : undefined}>
                  <td className="px-4 py-2 text-ink">{v.employeeName}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">{v.previous != null ? money(v.previous) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(v.net)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.change != null ? `${money(v.change)}${v.percent != null ? ` (${Number(v.percent)}%)` : ""}` : "—"}</td>
                  <td className="px-3 py-2 text-xs text-amber-700 dark:text-amber-300">{FLAGS[v.flag] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "files" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Payroll register" description="Every person with every line, for checking and filing.">
            <div className="flex gap-2"><a className="text-sm font-medium text-brand-ink hover:underline" href={file("register", "xlsx")}><FontAwesomeIcon icon={faFileArrowDown} className="mr-1.5" />Excel</a>
              <a className="text-sm font-medium text-brand-ink hover:underline" href={file("register", "csv")}>CSV</a></div>
          </Card>
          <Card title="Bank payment file" description="Who to pay, their account and how much. Showing account numbers is recorded in the audit log.">
            {["approved", "paid"].includes(run.status)
              ? <div className="flex gap-2"><a className="text-sm font-medium text-brand-ink hover:underline" href={file("bank", "csv")}><FontAwesomeIcon icon={faFileArrowDown} className="mr-1.5" />CSV</a>
                <a className="text-sm font-medium text-brand-ink hover:underline" href={file("bank", "xlsx")}>Excel</a></div>
              : <p className="text-sm text-muted">Available once the payroll is approved.</p>}
          </Card>
          <Card title="Statutory schedules" description="What to remit, and for whom.">
            <ul className="space-y-1.5 text-sm">
              {[["paye", "PAYE (income tax)"], ["pension", "Pension"], ["nhf", "National Housing Fund"]].map(([k, label]) => (
                <li key={k} className="flex items-center justify-between gap-3"><span className="text-ink">{label}</span>
                  <span className="flex gap-3"><a className="font-medium text-brand-ink hover:underline" href={file(k, "xlsx")}>Excel</a>
                    <a className="font-medium text-brand-ink hover:underline" href={file(k, "csv")}>CSV</a></span></li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
