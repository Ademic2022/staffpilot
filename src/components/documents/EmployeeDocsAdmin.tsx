"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { ExpiryBadge, useDownload } from "@/components/documents/Documents";
import { IconCheck, IconDownload, IconPlus } from "@/components/icons";
import {
  Badge, Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, Input, Loading, Notice, Select, Table, Tabs, TD, TH,
} from "@/components/ui";
import { graphql } from "@/gql";
import type { DocumentsAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const DocumentsAdminDocument = graphql(`
  query DocumentsAdmin($within: Int!) {
    expiringDocuments(withinDays: $within) {
      id title expiresOn
      employee { id fullName }
      category { id name }
    }
    documentCategories(includeInactive: true) { id name employeeCanView managerCanView requiresExpiry isActive }
  }
`);

const SaveCategoryDocument = graphql(`
  mutation SaveDocumentCategory($input: SaveDocumentCategoryInput!) {
    saveDocumentCategory(input: $input) { category { id } errors { field message } }
  }
`);

type Category = DocumentsAdminQuery["documentCategories"][number];

function CategoryDialog({ row, onClose, onSaved }: { row: Category | null; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveCategoryDocument);
  const [v, setV] = useState({
    name: row?.name ?? "", employeeCanView: row?.employeeCanView ?? true, managerCanView: row?.managerCanView ?? false,
    requiresExpiry: row?.requiresExpiry ?? false, isActive: row?.isActive ?? true,
  });
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(undefined);
    if (!v.name.trim()) return setNameError("Enter a name.");
    setBusy(true);
    const result = await save({ input: { id: row?.id ?? null, ...v, name: v.name.trim() } });
    setBusy(false);
    const failed = reportErrors(result, result.data?.saveDocumentCategory.errors, ["name"] as const, (_f, m) => setNameError(m), setFormError);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title={row ? "Edit category" : "Add category"}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="category-form" busy={busy}>Save</Button>
      </>}>
      <form id="category-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Name" error={nameError}>
          <Input value={v.name} aria-invalid={!!nameError} placeholder="Employment contract" onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div className="space-y-3">
          <Checkbox label="The employee can see these" checked={v.employeeCanView} onChange={(c) => set("employeeCanView", c)} />
          <Checkbox label="Their managers can see these" description="Anyone above them in the reporting line." checked={v.managerCanView} onChange={(c) => set("managerCanView", c)} />
          <Checkbox label="Needs an expiry date" description="For contracts, IDs, permits and certificates that run out." checked={v.requiresExpiry} onChange={(c) => set("requiresExpiry", c)} />
          {row && <Checkbox label="Active" description="Inactive categories cannot take new uploads." checked={v.isActive} onChange={(c) => set("isActive", c)} />}
        </div>
      </form>
    </Dialog>
  );
}

/** Employee documents across the company: what is expiring, and the categories that decide who sees what. */
export function EmployeeDocsAdmin() {
  const { can } = useSession();
  const [within, setWithin] = useState(30);
  const [{ data, error }, reload] = useQuery({ query: DocumentsAdminDocument, variables: { within } });
  const [tab, setTab] = useState<"expiring" | "categories">("expiring");
  const [editing, setEditing] = useState<{ row: Category | null } | null>(null);
  const [saved, setSaved] = useState<string>();
  const { download, busyId, error: downloadError } = useDownload();

  if (!can(PERMS.documentsManage)) return <Notice tone="warning">You do not have permission to manage documents.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const expiring = data.expiringDocuments;

  return (
    <>
      <p className="text-sm text-muted">Files on employee records are uploaded from each person&apos;s profile.</p>
      {saved && <Notice tone="success">{saved}</Notice>}
      {downloadError && <ErrorNote error={downloadError} />}
      <Tabs value={tab} onChange={(t) => { setTab(t); setSaved(undefined); }} tabs={[
        { key: "expiring", label: "Expiring", count: expiring.length },
        { key: "categories", label: "Categories", count: data.documentCategories.length },
      ]} />

      {tab === "expiring" ? (
        <Card flush title="Expired or expiring" actions={
          <Select className="w-auto" value={String(within)} aria-label="Within" onChange={(e) => setWithin(Number(e.target.value))}>
            <option value="7">Within 7 days</option>
            <option value="30">Within 30 days</option>
            <option value="90">Within 90 days</option>
          </Select>
        }>
          {expiring.length ? (
            <Table>
              <thead><tr><TH>Employee</TH><TH>Document</TH><TH>Expiry</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
              <tbody>
                {expiring.map((d) => (
                  <tr key={d.id}>
                    <TD className="font-medium"><Link href={`/employees/${d.employee.id}#documents`} className="hover:underline">{d.employee.fullName}</Link></TD>
                    <TD>{d.title}<span className="block text-xs text-muted">{d.category.name}</span></TD>
                    <TD className="whitespace-nowrap">
                      <ExpiryBadge expiresOn={d.expiresOn} />
                      <span className="block text-xs text-muted tabular-nums">{formatDate(d.expiresOn)}</span>
                    </TD>
                    <TD align="right">
                      <Button size="sm" variant="ghost" icon={<IconDownload size={15} />} disabled={busyId === d.id} onClick={() => download(d.id)}>Download</Button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="p-5"><Empty title="Nothing expiring" icon={<IconCheck size={18} />}>No documents run out in this period.</Empty></div>
          )}
        </Card>
      ) : (
        <Card flush title="Categories" description="Each category decides who besides HR can see its documents."
          actions={<Button size="sm" icon={<IconPlus size={15} />} onClick={() => { setSaved(undefined); setEditing({ row: null }); }}>Add category</Button>}>
          <Table>
            <thead><tr><TH>Category</TH><TH>Employee</TH><TH>Managers</TH><TH>Expiry date</TH><TH>Status</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
            <tbody>
              {data.documentCategories.map((c) => (
                <tr key={c.id} className={c.isActive ? undefined : "text-muted"}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD>{c.employeeCanView ? "Can see" : <span className="text-muted">Hidden</span>}</TD>
                  <TD>{c.managerCanView ? "Can see" : <span className="text-muted">Hidden</span>}</TD>
                  <TD>{c.requiresExpiry ? "Required" : <span className="text-muted">Optional</span>}</TD>
                  <TD>{c.isActive ? <Badge tone="good" dot>Active</Badge> : <Badge>Inactive</Badge>}</TD>
                  <TD align="right"><Button size="sm" variant="ghost" onClick={() => { setSaved(undefined); setEditing({ row: c }); }}>Edit</Button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {editing && (
        <CategoryDialog row={editing.row} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setSaved("Category saved."); reload({ requestPolicy: "network-only" }); }} />
      )}
    </>
  );
}
