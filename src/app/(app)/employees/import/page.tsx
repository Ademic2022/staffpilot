"use client";

import { useMemo, useState, type FormEvent } from "react";

import { IconCheck, IconDownload, IconFile, IconUpload } from "@/components/icons";
import { Button, ButtonLink, Card, ErrorNote, Field, Notice, PageHeader, Table, TD, TH, cx } from "@/components/ui";
import { postForm } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

interface ImportError { row: number; column: string; message: string }

/** The problems as a CSV, so HR can work through them next to the spreadsheet. */
function errorReport(errors: ImportError[]) {
  const quote = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [["Row", "Column", "Problem"], ...errors.map((e) => [e.row, e.column, e.message])].map((r) => r.map(quote).join(","));
  return URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

export default function ImportEmployeesPage() {
  const { can } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [created, setCreated] = useState<number | null>(null);
  const [examples, setExamples] = useState(0);
  const reportUrl = useMemo(() => (errors.length ? errorReport(errors) : null), [errors]);

  if (!can(PERMS.employeesManage)) return <Notice tone="warning">You do not have permission to import employees.</Notice>;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!file) return setProblem("Choose a file.");
    setBusy(true);
    setProblem(undefined);
    setErrors([]);
    setCreated(null);
    const form = new FormData();
    form.set("file", file);
    const body = await postForm<{ created?: number; errors?: ImportError[]; skippedExamples?: number }>("/api/employees/import/", form);
    setBusy(false);
    setExamples(body.skippedExamples ?? 0);
    const rows = (body.errors ?? []) as (ImportError & { field?: string | null })[];
    if (rows.length && rows[0].row === undefined) return setProblem(rows[0].message);
    if (rows.length) return setErrors(rows);
    setCreated(body.created ?? 0);
    setFile(null);
  }

  return (
    <>
      <PageHeader back={{ href: "/employees", label: "Employees" }} title="Import employees"
        subtitle="Add many people at once from Excel or CSV." />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {created !== null && (
            <Notice tone="success" title={`Imported ${created} ${created === 1 ? "employee" : "employees"}`}>
              They are on the employee list now, with their first job record and audit entries.
              {examples > 0 && ` The ${examples} example ${examples === 1 ? "row" : "rows"} from the template ${examples === 1 ? "was" : "were"} left out.`}
            </Notice>
          )}
          <Card title="Upload the file">
            <form onSubmit={submit} noValidate className="space-y-4">
              {problem && <ErrorNote error={problem} />}
              <Field group label="File" hint=".xlsx or .csv, up to 2,000 rows.">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line-strong px-4 py-6 text-sm transition hover:bg-subtle/60">
                  <IconFile size={22} className="flex-none text-muted" />
                  <span className="min-w-0 flex-1 truncate">{file ? file.name : <span className="text-muted">Choose a file…</span>}</span>
                  <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErrors([]); setCreated(null); }} />
                </label>
              </Field>
              <Button type="submit" busy={busy} icon={<IconUpload size={16} />}>Check and import</Button>
            </form>
          </Card>

          {errors.length > 0 && (
            <Card flush title={`${errors.length} ${errors.length === 1 ? "problem" : "problems"} to fix`}
              description="Nothing was imported. Fix these in the file and upload it again."
              actions={reportUrl && <a href={reportUrl} download="import-problems.csv" className="text-sm font-medium text-brand-ink hover:underline">Download as CSV</a>}>
              <Table>
                <thead><tr><TH align="right">Row</TH><TH>Column</TH><TH>Problem</TH></tr></thead>
                <tbody>
                  {errors.slice(0, 200).map((e, i) => (
                    <tr key={i}>
                      <TD align="right" className="tabular-nums text-muted">{e.row}</TD>
                      <TD className="whitespace-nowrap font-medium">{e.column}</TD>
                      <TD>{e.message}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {errors.length > 200 && <p className="px-4 py-3 text-xs text-muted">Showing the first 200. Download the CSV for all of them.</p>}
            </Card>
          )}
        </div>

        <Card title="How it works">
          <ol className="space-y-4 text-sm">
            {[
              <>Download the template. It has a column for every field, with notes on what each expects, and three grey example rows numbered EXAMPLE to show the format. Example rows are never imported.</>,
              <>Fill in one row per person. Legal entity, departments and job titles must match the names under Organization.</>,
              <>Upload it. Every row is checked first: if any row has a problem, nothing is imported and you get a list to fix.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className={cx("grid h-6 w-6 flex-none place-items-center rounded-full bg-subtle text-xs font-semibold text-ink")}>{i + 1}</span>
                <span className="text-muted">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-col gap-2">
            <ButtonLink href="/api/employees/template.xlsx" download variant="secondary" icon={<IconDownload size={16} />}>Download template</ButtonLink>
            <p className="flex items-center gap-1.5 text-xs text-muted"><IconCheck size={13} />An export from the employee list also works as a template.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
