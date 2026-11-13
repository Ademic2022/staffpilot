"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconDownload, IconFile, IconUpload } from "@/components/icons";
import { ActionDialog, Badge, Button, Dialog, cardFrame, FrameSlot, type Frame, ErrorNote, Field, Input, Select, Spinner, Textarea, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { EmployeeDocumentsQuery } from "@/gql/graphql";
import { errorMessage, postForm } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors, today } from "@/lib/forms";

export const EmployeeDocumentsDocument = graphql(`
  query EmployeeDocuments($employeeId: ID!) {
    employeeDocuments(employeeId: $employeeId) {
      id title originalName contentType size expiresOn notes uploadedBy createdAt
      category { id name requiresExpiry employeeCanView managerCanView }
    }
  }
`);

const CategoriesDocument = graphql(`
  query DocumentCategoryOptions {
    documentCategories { id name requiresExpiry employeeCanView managerCanView isActive }
  }
`);

const DownloadDocument = graphql(`
  mutation DocumentDownloadUrl($id: ID!) {
    documentDownloadUrl(id: $id)
  }
`);

const UpdateDocument = graphql(`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) { document { id } errors { field message } }
  }
`);

const RemoveDocument = graphql(`
  mutation RemoveDocument($id: ID!) {
    removeDocument(id: $id)
  }
`);

export type DocumentRow = EmployeeDocumentsQuery["employeeDocuments"][number];

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt";

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntil(iso: string) {
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86_400_000);
}

export function ExpiryBadge({ expiresOn }: { expiresOn: string | null | undefined }) {
  if (!expiresOn) return null;
  const days = daysUntil(expiresOn);
  if (days < 0) return <Badge tone="bad" dot>Expired {formatDate(expiresOn)}</Badge>;
  if (days <= 30) return <Badge tone="warn" dot>{days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`}</Badge>;
  return <span className="text-xs text-muted">Expires {formatDate(expiresOn)}</span>;
}

/** Ask for a ten-minute link (logged in the audit trail) and open it. */
export function useDownload() {
  const [, getUrl] = useMutation(DownloadDocument);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  async function download(id: string) {
    setBusyId(id);
    setError(undefined);
    const result = await getUrl({ id });
    setBusyId(null);
    const url = result.data?.documentDownloadUrl;
    if (!url) return setError(errorMessage(result.error) ?? "The document could not be opened.");
    window.location.assign(url);
  }
  return { download, busyId, error };
}

/* ------------------------------------------------------------------ Upload */

/** own: the employee adding to their own record; the file goes to Employee uploads, so no category is asked. */
function UploadDialog({ employeeId, employeeName, own, onClose, onSaved }: {
  employeeId: string; employeeName: string; own?: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [{ data }] = useQuery({ query: CategoriesDocument, pause: own });
  const categories = data?.documentCategories.filter((c) => c.isActive) ?? [];
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const chosen = categories.find((c) => c.id === (categoryId || categories[0]?.id));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!file) missing.file = "Choose a file.";
    else if (file.size > 15 * 1024 * 1024) missing.file = "Files can be at most 15 MB.";
    if (!own && chosen?.requiresExpiry && !expiresOn) missing.expiresOn = `${chosen.name} documents need an expiry date.`;
    setErrors(missing);
    if (Object.keys(missing).length || !file || (!chosen && !own)) return;
    const form = new FormData();
    form.set("employee", employeeId);
    if (chosen && !own) form.set("category", chosen.id);
    form.set("title", title.trim());
    form.set("notes", notes.trim());
    if (expiresOn) form.set("expiresOn", expiresOn);
    form.set("file", file);
    setBusy(true);
    const body = await postForm<{ document?: { id: string } }>("/api/documents/upload/", form);
    setBusy(false);
    if (body.errors?.length) {
      const found: Record<string, string> = {};
      for (const e of body.errors) {
        if (e.field === "file" || e.field === "expiresOn") found[e.field] = e.message;
        else setFormError(e.message);
      }
      return setErrors(found);
    }
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} title="Upload a document" description={own ? "Saved under Employee uploads, where you and HR can see it." : `For ${employeeName}. Who can see it depends on the category.`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="upload-form" busy={busy} icon={<IconUpload size={16} />}>Upload</Button>
      </>}>
      <form id="upload-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field group label="File" error={errors.file} hint="PDF, image, Word, Excel or text, up to 15 MB.">
          <label className={cx("flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition hover:bg-subtle/60",
            errors.file ? "border-red-500" : "border-line-strong")}>
            <IconFile size={20} className="flex-none text-muted" />
            <span className="min-w-0 flex-1 truncate">{file ? <>{file.name} <span className="text-muted">({formatSize(file.size)})</span></> : <span className="text-muted">Choose a file…</span>}</span>
            <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
            }} />
          </label>
        </Field>
        {!own && <Field label="Category">
          <Select value={chosen?.id ?? ""} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>}
        {chosen && !own && (
          <p className="-mt-2 text-xs text-muted">
            {[chosen.employeeCanView ? "The employee can see it" : "Hidden from the employee",
              chosen.managerCanView ? "their managers can see it" : "hidden from managers"].join("; ")}. HR always can.
          </p>
        )}
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Employment contract 2026" />
        </Field>
        {!own && <Field label="Expires on" optional={!chosen?.requiresExpiry} error={errors.expiresOn} hint="HR is reminded 30 and 7 days before, and on the day.">
          <Input type="date" value={expiresOn} aria-invalid={!!errors.expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
        </Field>}
        <Field label="Notes" optional>
          <Textarea rows={2} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- Edit */

function EditDialog({ doc, onClose, onSaved }: { doc: DocumentRow; onClose: () => void; onSaved: () => void }) {
  const [{ data }] = useQuery({ query: CategoriesDocument });
  const [, update] = useMutation(UpdateDocument);
  const [title, setTitle] = useState(doc.title);
  const [categoryId, setCategoryId] = useState(doc.category.id);
  const [expiresOn, setExpiresOn] = useState(doc.expiresOn ?? "");
  const [notes, setNotes] = useState(doc.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    if (!title.trim()) return setErrors({ title: "Give the document a title." });
    setBusy(true);
    const result = await update({ input: { id: doc.id, title: title.trim(), categoryId, expiresOn: expiresOn || null, notes: notes.trim() } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.updateDocument.errors, ["title", "expiresOn", "category"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title="Edit document" description={doc.originalName}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="doc-form" busy={busy}>Save</Button>
      </>}>
      <form id="doc-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Title" error={errors.title}>
          <Input value={title} aria-invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Category" error={errors.category}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {(data?.documentCategories ?? []).filter((c) => c.isActive || c.id === doc.category.id)
              .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Expires on" optional error={errors.expiresOn} hint="A new date starts the reminders again.">
          <Input type="date" value={expiresOn} aria-invalid={!!errors.expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
        </Field>
        <Field label="Notes" optional>
          <Textarea rows={2} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- Card */

/** The documents on an employee's profile. Renders nothing for viewers who may see none. */
export function DocumentsCard({ employeeId, employeeName, canManage, canUploadOwn = false, frame = cardFrame("Documents") }: {
  employeeId: string; employeeName: string; canManage: boolean; canUploadOwn?: boolean; frame?: Frame;
}) {
  const [{ data, error }, reload] = useQuery({ query: EmployeeDocumentsDocument, variables: { employeeId } });
  const [open, setOpen] = useState<"upload" | DocumentRow | null>(null);
  const [removing, setRemoving] = useState<DocumentRow | null>(null);
  const [, remove] = useMutation(RemoveDocument);
  const { download, busyId, error: downloadError } = useDownload();
  const card = useRef<HTMLDivElement>(null);
  const refresh = () => reload({ requestPolicy: "network-only" });
  const docs = data?.employeeDocuments;

  // Reminder emails link to #documents: bring the card into view once it has loaded.
  useEffect(() => {
    if (docs && window.location.hash === "#documents") card.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [docs]);

  if (error || !docs || (!docs.length && !canManage && !canUploadOwn)) return null;

  return (
    <div id="documents" ref={card} className="scroll-mt-20">
      <FrameSlot frame={frame} flush description={docs.length ? `${docs.length} on file` : undefined}
        actions={canManage || canUploadOwn ? <Button size="sm" variant="secondary" icon={<IconUpload size={15} />} onClick={() => setOpen("upload")}>Upload</Button> : undefined}>
        {downloadError && <div className="p-4 pb-0"><ErrorNote error={downloadError} /></div>}
        {docs.length ? (
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-subtle text-muted"><IconFile size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{d.title}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{d.category.name}</span>
                    <span aria-hidden>·</span>
                    <span>{formatSize(d.size)}</span>
                    <span aria-hidden>·</span>
                    <span>Added {formatDate(d.createdAt)}{d.uploadedBy ? ` by ${d.uploadedBy}` : ""}</span>
                    <ExpiryBadge expiresOn={d.expiresOn} />
                  </div>
                  {d.notes && <div className="mt-0.5 text-xs text-muted">{d.notes}</div>}
                </div>
                <div className="flex flex-none items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => download(d.id)} disabled={busyId === d.id}
                    icon={busyId === d.id ? <Spinner small /> : <IconDownload size={15} />}>Download</Button>
                  {canManage && <Button size="sm" variant="ghost" onClick={() => setOpen(d)}>Edit</Button>}
                  {canManage && <Button size="sm" variant="ghost" onClick={() => setRemoving(d)}>Remove</Button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">No documents yet. Upload contracts, IDs, certificates and permits here.</p>
        )}
      </FrameSlot>

      {open === "upload" && (
        <UploadDialog employeeId={employeeId} employeeName={employeeName} own={!canManage} onClose={() => setOpen(null)}
          onSaved={() => { setOpen(null); refresh(); }} />
      )}
      {open && open !== "upload" && (
        <EditDialog doc={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); refresh(); }} />
      )}
      <ActionDialog open={removing !== null} onClose={() => setRemoving(null)} title={`Remove ${removing?.title ?? "document"}?`}
        description="It is no longer listed or downloadable. The file is kept for the records." confirmLabel="Remove" tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          const result = await remove({ id: removing.id });
          if (result.error) throw new Error(errorMessage(result.error));
          refresh();
        }} />
    </div>
  );
}
