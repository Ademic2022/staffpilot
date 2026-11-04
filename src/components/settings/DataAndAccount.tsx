"use client";

import { faDownload, faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, type BadgeTone, Button, Card, Dialog, ErrorNote, Field, Input, Loading, Notice, PasswordInput, Textarea } from "@/components/ui";
import { graphql } from "@/gql";
import type { AccountDataQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";

const DataDocument = graphql(`
  query AccountData {
    dataExports { id status size summary error requestedBy createdAt finishedAt expiresAt }
    accountClosure { status closesOn requestedAt requestedBy reason graceDays backupDays }
  }
`);
const ExportDocument = graphql(`mutation RequestDataExport { requestDataExport { id status } }`);
const UrlDocument = graphql(`mutation DataExportUrl($id: ID!) { dataExportUrl(id: $id) }`);
const CloseDocument = graphql(`
  mutation RequestAccountClosure($companyName: String!, $password: String!, $reason: String) {
    requestAccountClosure(companyName: $companyName, password: $password, reason: $reason) { closure { status closesOn } errors { field message } }
  }
`);
const CancelDocument = graphql(`mutation CancelAccountClosure { cancelAccountClosure { closure { status } errors { message } } }`);

const EXPORT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Waiting", tone: "warn" }, running: { label: "Being prepared", tone: "warn" }, ready: { label: "Ready", tone: "good" },
  failed: { label: "Failed", tone: "bad" }, expired: { label: "Expired", tone: "neutral" },
};

function bytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function Exports({ data, onChanged }: { data: AccountDataQuery; onChanged: () => void }) {
  const [{ fetching, error }, request] = useMutation(ExportDocument);
  const [, url] = useMutation(UrlDocument);
  const [problem, setProblem] = useState<string>();
  const busy = data.dataExports.some((e) => e.status === "pending" || e.status === "running");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(onChanged, 5000);
    return () => clearInterval(t);
  }, [busy, onChanged]);
  const download = async (id: string) => {
    setProblem(undefined);
    const res = await url({ id });
    if (res.error) return setProblem(errorMessage(res.error));
    window.location.assign(res.data!.dataExportUrl);
  };
  return (
    <Card title="Export all company data" description="One ZIP file with everything your company keeps in StaffPilot. Only owners can make and download it."
      actions={<Button size="sm" busy={fetching || busy} icon={<FontAwesomeIcon icon={faFileZipper} />} onClick={async () => { await request({}); onChanged(); }}>
        {busy ? "Preparing…" : "Export all data"}</Button>}>
      <div className="grid gap-4 text-sm">
        <ul className="grid list-disc gap-1 pl-5 text-muted">
          <li>A spreadsheet (CSV) for every kind of record: people, job and pay history, leave, payroll, attendance, reviews, goals, expenses, documents and the audit log.</li>
          <li>Every stored file: documents, receipts, photos and company files, plus a PDF of every approved payslip.</li>
          <li>A README explaining the files. Passwords, sign-in secrets and API keys are never included.</li>
        </ul>
        <p className="text-muted">It is prepared in the background; we email you when it is ready. Each download link works for 10 minutes and is recorded in the audit log; the file is deleted after 7 days.</p>
        {(error || problem) && <ErrorNote error={problem ?? errorMessage(error)} />}
        {data.dataExports.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {data.dataExports.map((e) => {
              const s = EXPORT_STATUS[e.status] ?? { label: e.status, tone: "neutral" as BadgeTone };
              const summary = e.summary as { rows?: number; files?: number; payslips?: number };
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    <span className="block text-ink">{formatDate(e.createdAt)}{e.requestedBy && ` · ${e.requestedBy}`}</span>
                    <span className="block text-xs text-muted">
                      {e.status === "ready" ? `${bytes(e.size)} · ${summary.rows?.toLocaleString() ?? 0} records, ${summary.files ?? 0} files, ${summary.payslips ?? 0} payslips · until ${formatDate(e.expiresAt)}`
                        : e.status === "failed" ? e.error || "Something went wrong. Try again." : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={s.tone} dot>{s.label}</Badge>
                    {e.status === "ready" && <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faDownload} />} onClick={() => download(e.id)}>Download</Button>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function CloseDialog({ companyName, graceDays, onClose, onDone }: { companyName: string; graceDays: number; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ name: "", password: "", reason: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, close] = useMutation(CloseDocument);
  const submit = async () => {
    const res = await close({ companyName: v.name, password: v.password, reason: v.reason });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Could not close the account." });
    const errs = res.data?.requestAccountClosure.errors ?? [];
    if (errs.length) return setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    onDone();
  };
  return (
    <Dialog open onClose={onClose} title={`Close ${companyName}'s account?`} footer={<>
      <Button variant="secondary" onClick={onClose}>Keep the account</Button>
      <Button variant="danger" busy={fetching} disabled={!v.name || !v.password} onClick={submit}>Close the account</Button>
    </>}>
      <div className="grid gap-4 text-sm">
        <Notice tone="warning" title="Nobody can use the account after it closes">
          StaffPilot becomes read-only for everyone straight away. After {graceDays} days the account closes and nobody can sign in. Its data is
          then kept, hidden, for a year in case you come back, and after that every record, payslip and document is deleted for good. Export your data first.
        </Notice>
        {errors[""] && <ErrorNote error={errors[""]} />}
        <Field label={`Type the company name (${companyName}) to confirm`} error={errors.companyName}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Your password" error={errors.password}>
          <PasswordInput value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="current-password" />
        </Field>
        <Field label="Why are you leaving?" optional hint="It helps us improve.">
          <Textarea rows={2} value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}

function Closure({ data, onChanged }: { data: AccountDataQuery; onChanged: () => void }) {
  const { tenant, reset } = useSession();
  const [open, setOpen] = useState(false);
  const [{ fetching, error }, cancel] = useMutation(CancelDocument);
  const c = data.accountClosure;
  const done = () => { setOpen(false); reset(); onChanged(); };
  if (c.status === "closing") {
    return (
      <Card title="Closing the account">
        <div className="grid gap-3 text-sm">
          <Notice tone="warning" title={`Closes on ${formatDate(c.closesOn)}`}>
            {c.requestedBy ?? "An owner"} asked to close the account on {formatDate(c.requestedAt)}. StaffPilot is read-only until then; on that day
            nobody can sign in any more. The data is kept, hidden, for a year so the account can be restored, then deleted for good, and the
            owners get a written confirmation. Backup copies age out within {c.backupDays} days after that.
          </Notice>
          {error && <ErrorNote error={errorMessage(error)} />}
          <div><Button variant="secondary" busy={fetching} onClick={async () => { await cancel({}); done(); }}>Cancel the closure</Button></div>
        </div>
      </Card>
    );
  }
  return (
    <Card title="Close the account" description="For when your company stops using StaffPilot.">
      <div className="grid gap-3 text-sm">
        <p className="text-muted">
          Closing makes StaffPilot read-only for {c.graceDays} days, so you can export what you need, and any owner can cancel. Then the account closes
          and nobody can sign in. Its data is kept, hidden, for a year in case you want it back (ask us to restore it); after that every record and
          stored file is deleted, logins used only for {tenant?.name ?? "your company"} are removed, and you get a written confirmation.
        </p>
        <div><Button variant="danger" onClick={() => setOpen(true)}>Close the account…</Button></div>
      </div>
      {open && <CloseDialog companyName={tenant?.name ?? ""} graceDays={c.graceDays} onClose={() => setOpen(false)} onDone={done} />}
    </Card>
  );
}

export function DataAndAccount() {
  const [{ data, error }, reload] = useQuery({ query: DataDocument, requestPolicy: "cache-and-network" });
  const refresh = useCallback(() => reload({ requestPolicy: "network-only" }), [reload]);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  return (
    <div className="grid gap-5">
      <Exports data={data} onChanged={refresh} />
      <Closure data={data} onChanged={refresh} />
    </div>
  );
}
