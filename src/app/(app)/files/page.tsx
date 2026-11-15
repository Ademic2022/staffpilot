"use client";

import {
  faCircleCheck, faDownload, faEllipsis, faFile, faFileExcel, faFileImage, faFilePdf, faFileWord, faFolder, faFolderOpen, faFolderPlus,
  faIdCard, faLayerGroup, faPen, faTrash, faUpload, faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { EmployeeDocsAdmin } from "@/components/documents/EmployeeDocsAdmin";
import { Menu } from "@/components/people/PeopleList";
import { Badge, Button, Checkbox, Dialog, ErrorNote, Field, Input, Loading, SearchInput, Select, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { CompanyFilesQuery } from "@/gql/graphql";
import { errorMessage, postForm } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const FoldersDocument = graphql(`
  query CompanyFolders {
    companyFolders { id name fileCount }
  }
`);

const FilesDocument = graphql(`
  query CompanyFiles($folderId: ID, $search: String) {
    companyFiles(folderId: $folderId, search: $search) {
      id title originalName contentType size shared folderId uploadedBy createdAt requiresAcknowledgement acknowledgedByMe acknowledgedCount
    }
  }
`);

const SaveFolderDocument = graphql(`
  mutation SaveCompanyFolder($name: String!, $id: ID) {
    saveCompanyFolder(name: $name, id: $id) { folder { id name } errors { field message } }
  }
`);

const DeleteFolderDocument = graphql(`
  mutation DeleteCompanyFolder($id: ID!) {
    deleteCompanyFolder(id: $id)
  }
`);

const UpdateFileDocument = graphql(`
  mutation UpdateCompanyFile($input: UpdateCompanyFileInput!) {
    updateCompanyFile(input: $input) { file { id } errors { field message } }
  }
`);

const RemoveFilesDocument = graphql(`
  mutation RemoveCompanyFiles($ids: [ID!]!) {
    removeCompanyFiles(ids: $ids)
  }
`);

const AcknowledgeDocument = graphql(`
  mutation AcknowledgeCompanyFile($id: ID!) { acknowledgeCompanyFile(id: $id) { id acknowledgedByMe } }
`);

const ReadersDocument = graphql(`
  query FileAcknowledgements($id: ID!) { fileAcknowledgements(id: $id) { name email acknowledgedAt } }
`);

function ReadersDialog({ file, onClose }: { file: { id: string; title: string }; onClose: () => void }) {
  const [{ data, error }] = useQuery({ query: ReadersDocument, variables: { id: file.id } });
  const rows = data?.fileAcknowledgements ?? [];
  const done = rows.filter((r) => r.acknowledgedAt).length;
  return (
    <Dialog open onClose={onClose} title={`Who has read ${file.title}`} description={data ? `${done} of ${rows.length} people` : undefined}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {error ? <ErrorNote error={errorMessage(error)} /> : !data ? <Loading shape="list" /> : (
        <ul className="max-h-96 divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {rows.map((r) => (
            <li key={r.email} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-ink">{r.name}</span>
              {r.acknowledgedAt ? <Badge tone="good" dot>Read {formatDate(r.acknowledgedAt)}</Badge> : <Badge tone="warn" dot>Not yet</Badge>}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

const DownloadDocument = graphql(`
  mutation CompanyFileDownloadUrl($id: ID!) {
    companyFileDownloadUrl(id: $id)
  }
`);

type CompanyFile = CompanyFilesQuery["companyFiles"][number];
type Folder = { id: string; name: string; fileCount: number };
type Sort = "nameA" | "nameZ" | "newest" | "oldest";

function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: faFilePdf, tone: "text-red-600 dark:text-red-400" };
  if (["doc", "docx"].includes(ext)) return { icon: faFileWord, tone: "text-blue-600 dark:text-blue-400" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: faFileExcel, tone: "text-emerald-600 dark:text-emerald-400" };
  if (["png", "jpg", "jpeg", "webp", "heic"].includes(ext)) return { icon: faFileImage, tone: "text-violet-600 dark:text-violet-400" };
  return { icon: faFile, tone: "text-muted" };
}

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function UploadDialog({ folders, folderId, onClose, onDone }: { folders: Folder[]; folderId: string; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState(folderId);
  const [shared, setShared] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!file) return setErrors({ file: "Choose a file to upload." });
    const form = new FormData();
    form.set("file", file);
    form.set("title", title);
    form.set("folder", folder);
    form.set("shared", shared ? "true" : "false");
    setBusy(true);
    const body = await postForm<{ file?: { id: string } }>("/api/company-files/upload/", form);
    setBusy(false);
    if (body.errors?.length) return setErrors(Object.fromEntries(body.errors.map((e) => [e.field ?? "", e.message])));
    onDone();
  }

  return (
    <Dialog open onClose={onClose} title="Upload a file" description="A PDF, Word, Excel, image or text file."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="company-upload" busy={busy}>Upload</Button></>}>
      <form id="company-upload" onSubmit={submit} className="space-y-4">
        {errors[""] && <ErrorNote error={errors[""]} />}
        <Field label="File" error={errors.file}>
          <Input type="file" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, "")); }} />
        </Field>
        <Field label="Name" error={errors.title}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Employee handbook" /></Field>
        <Field label="Folder" error={errors.folder}>
          <Select value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">No folder</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Checkbox label="Share with employees" description="Everyone in the company can see and download it. Otherwise only HR can." checked={shared} onChange={setShared} />
      </form>
    </Dialog>
  );
}

function NameDialog({ title, label, initial, onClose, onSave }: {
  title: string; label: string; initial: string; onClose: () => void; onSave: (name: string) => Promise<string | undefined>;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button busy={busy} onClick={async () => { setBusy(true); const problem = await onSave(name); setBusy(false); if (problem) setError(problem); }}>Save</Button></>}>
      <Field label={label} error={error}><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
    </Dialog>
  );
}

function Files() {
  const { can } = useSession();
  const manage = can(PERMS.documentsManage);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "employee" && manage ? "employee" : "files";
  const folderId = params.get("folder") ?? "";
  const go = (q: Record<string, string>) => router.replace(`${pathname}?${new URLSearchParams(q)}`, { scroll: false });

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("nameA");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<null | { kind: "upload" } | { kind: "folder"; folder?: Folder } | { kind: "rename"; file: CompanyFile }
    | { kind: "readers"; file: CompanyFile }>(null);
  const [, acknowledge] = useMutation(AcknowledgeDocument);
  const [notice, setNotice] = useState<string>();
  const [{ data: folderData }, refetchFolders] = useQuery({ query: FoldersDocument });
  const [{ data, error, fetching }, refetchFiles] = useQuery({
    query: FilesDocument, variables: { folderId: folderId || null, search: search.trim() || null }, pause: view !== "files",
  });
  const [, saveFolder] = useMutation(SaveFolderDocument);
  const [, deleteFolder] = useMutation(DeleteFolderDocument);
  const [, updateFile] = useMutation(UpdateFileDocument);
  const [, removeFiles] = useMutation(RemoveFilesDocument);
  const [, getUrl] = useMutation(DownloadDocument);

  const folders = folderData?.companyFolders ?? [];
  const folder = folders.find((f) => f.id === folderId);
  const refresh = () => { refetchFolders({ requestPolicy: "network-only" }); refetchFiles({ requestPolicy: "network-only" }); setPicked(new Set()); };
  const files = [...(data?.companyFiles ?? [])].sort((a, b) =>
    sort === "nameA" ? a.title.localeCompare(b.title) : sort === "nameZ" ? b.title.localeCompare(a.title)
      : sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));

  const download = async (f: CompanyFile) => {
    const result = await getUrl({ id: f.id });
    const url = result.data?.companyFileDownloadUrl;
    if (url) window.location.assign(url);
    else setNotice(errorMessage(result.error) ?? "The file could not be opened.");
  };
  const update = async (input: Parameters<typeof updateFile>[0]["input"]) => {
    const result = await updateFile({ input });
    const problem = errorMessage(result.error) ?? result.data?.updateCompanyFile.errors[0]?.message;
    if (problem) return problem;
    refresh();
  };
  const remove = async (ids: string[]) => {
    const result = await removeFiles({ ids });
    if (result.error) return setNotice(errorMessage(result.error));
    setNotice(`${ids.length} ${ids.length === 1 ? "file" : "files"} removed.`);
    refresh();
  };

  const navItem = (active: boolean) => cx("flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition",
    active ? "bg-brand text-white" : "text-ink hover:bg-subtle");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.01em] text-ink sm:text-[30px]">Files</h1>
        {manage && view === "files" && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setDialog({ kind: "upload" })} icon={<FontAwesomeIcon icon={faUpload} />}>Upload file</Button>
            <Button variant="secondary" onClick={() => setDialog({ kind: "folder" })} icon={<FontAwesomeIcon icon={faFolderPlus} />}>New folder</Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav aria-label="Folders" className="space-y-1 lg:w-60 lg:flex-none">
          <button type="button" className={navItem(view === "files" && !folderId)} onClick={() => go({})}>
            <FontAwesomeIcon icon={faLayerGroup} fixedWidth className={view === "files" && !folderId ? "text-white" : "text-muted"} />All files
          </button>
          {manage && (
            <button type="button" className={navItem(view === "employee")} onClick={() => go({ view: "employee" })}>
              <FontAwesomeIcon icon={faIdCard} fixedWidth className={view === "employee" ? "text-white" : "text-muted"} />Employee documents
            </button>
          )}
          {folders.length > 0 && <div className="!my-3 border-t border-line" />}
          {folders.map((f) => {
            const active = view === "files" && folderId === f.id;
            return (
              <button key={f.id} type="button" className={navItem(active)} onClick={() => go({ folder: f.id })}>
                <FontAwesomeIcon icon={active ? faFolderOpen : faFolder} fixedWidth className={active ? "text-white" : "text-muted"} />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className={cx("text-xs tabular-nums", active ? "text-white/80" : "text-muted")}>{f.fileCount}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {view === "employee" ? <EmployeeDocsAdmin /> : (
            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
                <h2 className="text-lg font-semibold text-brand-ink">{folder?.name ?? "All files"}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {manage && folder && (
                    <Menu width="w-48" trigger={(open, toggle) => (
                      <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={open} aria-label="Folder options"><FontAwesomeIcon icon={faEllipsis} /></Button>
                    )}>
                      {(close) => (
                        <>
                          <button type="button" role="menuitem" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-subtle"
                            onClick={() => { close(); setDialog({ kind: "folder", folder }); }}><FontAwesomeIcon icon={faPen} fixedWidth className="text-muted" />Rename folder</button>
                          <button type="button" role="menuitem" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-subtle"
                            onClick={async () => {
                              close();
                              const result = await deleteFolder({ id: folder.id });
                              if (result.error) setNotice(errorMessage(result.error));
                              else { go({}); refresh(); }
                            }}><FontAwesomeIcon icon={faTrash} fixedWidth className="text-muted" />Delete folder</button>
                        </>
                      )}
                    </Menu>
                  )}
                  <div className="w-56"><SearchInput aria-label="Search files" placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                  <label className="flex items-center gap-2 text-sm text-muted">Sort by
                    <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 w-40 rounded-full">
                      <option value="nameA">Name: A–Z</option>
                      <option value="nameZ">Name: Z–A</option>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </Select>
                  </label>
                </div>
              </header>
              {notice && <div className="px-5 pb-3"><p className="rounded-lg bg-subtle px-3 py-2 text-sm text-ink">{notice}</p></div>}
              {manage && files.length > 0 && (
                <div className="flex items-center gap-3 border-y border-line bg-subtle/60 px-5 py-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2.5 text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={picked.size === files.length}
                      onChange={() => setPicked(picked.size === files.length ? new Set() : new Set(files.map((f) => f.id)))} />
                    Select all ({files.length})
                  </label>
                  {picked.size > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => remove([...picked])} icon={<FontAwesomeIcon icon={faTrash} />}>Remove {picked.size}</Button>
                  )}
                </div>
              )}
              {error ? <div className="p-5"><ErrorNote error={errorMessage(error)} /></div> : !data ? <div className="p-5"><Loading shape="list" /></div> : files.length ? (
                <ul className={cx("divide-y divide-line transition-opacity", fetching && "opacity-60")}>
                  {files.map((f) => {
                    const { icon, tone } = iconFor(f.originalName);
                    return (
                      <li key={f.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-subtle/50">
                        {manage && (
                          <input type="checkbox" aria-label={`Select ${f.title}`} className="h-4 w-4 accent-[var(--brand)]" checked={picked.has(f.id)}
                            onChange={() => { const next = new Set(picked); if (next.has(f.id)) next.delete(f.id); else next.add(f.id); setPicked(next); }} />
                        )}
                        <FontAwesomeIcon icon={icon} className={cx("text-2xl", tone)} fixedWidth />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => download(f)} className="block max-w-full truncate text-left font-medium text-brand-ink hover:underline">{f.title}</button>
                          <p className="truncate text-xs text-muted">
                            Added {formatDate(f.createdAt.slice(0, 10))}{f.uploadedBy ? ` by ${f.uploadedBy}` : ""} ({size(f.size)})
                            {!folderId && f.folderId && ` · ${folders.find((x) => x.id === f.folderId)?.name ?? ""}`}
                          </p>
                        </div>
                        {f.requiresAcknowledgement && (manage
                          ? <button type="button" onClick={() => setDialog({ kind: "readers", file: f })} className="text-xs font-medium text-brand-ink hover:underline">Read by {f.acknowledgedCount}</button>
                          : f.acknowledgedByMe ? <Badge tone="good" dot>You have read this</Badge> : (
                            <Button size="sm" onClick={async () => { await acknowledge({ id: f.id }); refresh(); }}>I have read it</Button>
                          ))}
                        {manage && (f.shared
                          ? <Badge tone="good"><FontAwesomeIcon icon={faUsers} className="mr-1" />Shared</Badge>
                          : <Badge>HR only</Badge>)}
                        <button type="button" onClick={() => download(f)} aria-label={`Download ${f.title}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink"><FontAwesomeIcon icon={faDownload} /></button>
                        {manage && (
                          <Menu width="w-56" trigger={(open, toggle) => (
                            <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Options for ${f.title}`}
                              className="grid h-8 w-8 place-items-center rounded-full border border-line-strong text-ink hover:bg-subtle"><FontAwesomeIcon icon={faEllipsis} /></button>
                          )}>
                            {(close) => {
                              const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-subtle";
                              return (
                                <>
                                  <button type="button" role="menuitem" className={item} onClick={() => { close(); void update({ id: f.id, shared: !f.shared }); }}>
                                    <FontAwesomeIcon icon={faUsers} fixedWidth className="text-muted" />{f.shared ? "Stop sharing with employees" : "Share with employees"}
                                  </button>
                                  <button type="button" role="menuitem" className={item} onClick={() => { close(); void update({ id: f.id, requiresAcknowledgement: !f.requiresAcknowledgement }); }}>
                                    <FontAwesomeIcon icon={faCircleCheck} fixedWidth className="text-muted" />{f.requiresAcknowledgement ? "Stop asking people to confirm" : "Ask everyone to confirm they read it"}
                                  </button>
                                  <button type="button" role="menuitem" className={item} onClick={() => { close(); setDialog({ kind: "rename", file: f }); }}>
                                    <FontAwesomeIcon icon={faPen} fixedWidth className="text-muted" />Rename
                                  </button>
                                  {(folders.length > 0) && <p className="px-4 pb-1 pt-2 text-xs font-medium text-muted">Move to</p>}
                                  {f.folderId && (
                                    <button type="button" role="menuitem" className={item} onClick={() => { close(); void update({ id: f.id, toTopLevel: true }); }}>
                                      <FontAwesomeIcon icon={faLayerGroup} fixedWidth className="text-muted" />No folder
                                    </button>
                                  )}
                                  {folders.filter((x) => x.id !== f.folderId).map((x) => (
                                    <button key={x.id} type="button" role="menuitem" className={item} onClick={() => { close(); void update({ id: f.id, folderId: x.id }); }}>
                                      <FontAwesomeIcon icon={faFolder} fixedWidth className="text-muted" />{x.name}
                                    </button>
                                  ))}
                                  <div className="my-1.5 border-t border-line" />
                                  <button type="button" role="menuitem" className={item} onClick={() => { close(); void remove([f.id]); }}>
                                    <FontAwesomeIcon icon={faTrash} fixedWidth className="text-muted" />Remove
                                  </button>
                                </>
                              );
                            }}
                          </Menu>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-14 text-center">
                  <p className="font-display text-xl text-ink">{search ? "No files match" : "No files here yet"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {search ? "Try another name." : manage ? "Upload handbooks, policies and forms for the whole company." : "HR has not shared any files yet."}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {dialog?.kind === "upload" && (
        <UploadDialog folders={folders} folderId={folderId} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setNotice("File uploaded."); refresh(); }} />
      )}
      {dialog?.kind === "folder" && (
        <NameDialog title={dialog.folder ? "Rename folder" : "New folder"} label="Folder name" initial={dialog.folder?.name ?? ""} onClose={() => setDialog(null)}
          onSave={async (name) => {
            const result = await saveFolder({ name, id: dialog.folder?.id ?? null });
            const problem = errorMessage(result.error) ?? result.data?.saveCompanyFolder.errors[0]?.message;
            if (problem) return problem;
            setDialog(null);
            refresh();
            const id = result.data?.saveCompanyFolder.folder?.id;
            if (id && !dialog.folder) go({ folder: id });
          }} />
      )}
      {dialog?.kind === "readers" && <ReadersDialog file={dialog.file} onClose={() => setDialog(null)} />}
      {dialog?.kind === "rename" && (
        <NameDialog title="Rename file" label="Name" initial={dialog.file.title} onClose={() => setDialog(null)}
          onSave={async (title) => { const problem = await update({ id: dialog.file.id, title }); if (!problem) setDialog(null); return problem; }} />
      )}
    </>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<Loading shape="list" />}>
      <Files />
    </Suspense>
  );
}
