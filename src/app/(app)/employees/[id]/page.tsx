"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import { DocumentsCard } from "@/components/documents/Documents";
import { TrainingDue } from "@/components/profile/TrainingDue";
import { ChangeJobDialog, ChangePayDialog, ChangeStatusDialog, canChangeStatus } from "@/components/employees/EmployeeDialogs";
import { EmergencyContactsCard, PrivateDetailsCard } from "@/components/employees/RecordCards";
import { MyChangeNotice } from "@/components/employees/SelfService";
import {
  faArrowTrendUp, faBoxArchive, faBriefcase, faCaretDown, faEllipsis, faKey, faLaptop, faLock, faMoneyBillWave,
  faTableColumns, faTrashCan, faUserCheck, type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import {
  JobHistoryBlock, JobSummaryBlock, LeaveBlock, LeaveHistoryBlock, LeaveUpcomingBlock, NotesBlock, PayBlock, StatusHistoryBlock,
} from "@/components/profile/Blocks";
import { CustomizeLayout, CustomizeTabs } from "@/components/profile/Customize";
import { FieldsSection, rowsFor } from "@/components/profile/FieldsSection";
import { ProfileHeader } from "@/components/profile/Header";
import { EmployeeProfileDocument, ProfileLayoutDocument, type LayoutSection, type Profile } from "@/components/profile/query";
import { SECTION_ICONS, sectionFrame } from "@/components/profile/Section";
import { BenefitsBlock } from "@/components/profile/BenefitsBlock";
import { ChecklistBlock } from "@/components/profile/ChecklistBlock";
import { RowDialog, TableSection } from "@/components/profile/TableSection";
import { Vitals } from "@/components/profile/Vitals";
import { ActionDialog, Button, ErrorNote, Loading, Notice, cx } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const ArchiveDocument = graphql(`
  mutation ArchiveEmployee($id: ID!) {
    archiveEmployee(id: $id) { employee { id } errors { field message } }
  }
`);

const SendResetDocument = graphql(`
  mutation SendEmployeePasswordReset($employeeId: ID!) {
    sendEmployeePasswordReset(employeeId: $employeeId)
  }
`);

const EmployeeAccessDocument = graphql(`
  query EmployeeAccess($id: ID!) {
    employee(id: $id) { id access { email roles isActive invitePending } }
  }
`);

const RemovePhotoDocument = graphql(`
  mutation RemoveEmployeePhoto($employeeId: ID!) {
    removeEmployeePhoto(employeeId: $employeeId)
  }
`);

/** A dropdown of actions under a button on the header band. */
function Menu({ label, icon, children, width = "w-64" }: { label: string; icon?: IconDefinition; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label={icon ? label : undefined}
        className={cx("inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold text-[var(--brand)] shadow-sm transition",
          open ? "bg-[color-mix(in_srgb,var(--brand)_12%,white)]" : "bg-white hover:bg-[color-mix(in_srgb,var(--brand)_7%,white)]", icon ? "w-10" : "px-5")}>
        {icon ? <FontAwesomeIcon icon={icon} className="text-[15px]" /> : <>{label}<FontAwesomeIcon icon={faCaretDown} className="text-[13px]" /></>}
      </button>
      {open && (
        <div role="menu" className={cx("absolute right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-surface py-1.5 text-ink shadow-lg", width)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, href, icon, children, hint }: { onClick?: () => void; href?: string; icon?: IconDefinition; children: ReactNode; hint?: ReactNode }) {
  const body = (
    <>
      {icon && <FontAwesomeIcon icon={icon} fixedWidth className="mt-0.5 text-[15px] text-muted" />}
      <span className="min-w-0">
        <span className="block">{children}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </>
  );
  const className = "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-subtle";
  return href
    ? <Link role="menuitem" href={href} className={className}>{body}</Link>
    : <button role="menuitem" type="button" onClick={onClick} className={className}>{body}</button>;
}

function MenuDivider() {
  return <div role="separator" className="my-1.5 border-t border-line" />;
}

function TabIcon({ icon }: { icon: string }) {
  const Icon = SECTION_ICONS[icon] ?? SECTION_ICONS.list;
  return <Icon size={24} />;
}

type Dialog = "job" | "promotion" | "status" | "pay" | "asset" | "archive" | "reset" | "layout" | "tabs"
  | "ask-job" | "ask-promotion" | "ask-pay" | null;

function EmployeeRecord() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { can, tenant, me } = useSession();
  const [{ data, error }, reload] = useQuery({ query: EmployeeProfileDocument, variables: { id } });
  const [{ data: layoutData }, reloadLayout] = useQuery({ query: ProfileLayoutDocument });
  const [, archive] = useMutation(ArchiveDocument);
  const [, removePhoto] = useMutation(RemovePhotoDocument);
  const [, sendReset] = useMutation(SendResetDocument);
  const usersManage = can(PERMS.usersManage);
  const [{ data: accessData }] = useQuery({ query: EmployeeAccessDocument, variables: { id }, pause: !usersManage });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string }>();

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data || !layoutData) return <Loading />;
  const e: Profile = data.employee;
  if (!e) return <ErrorNote error="This employee could not be found." />;

  const layout = layoutData.profileLayout;
  const tables = layoutData.customTables;
  // Links from reminder emails still use #documents; tab=… is the record's own address for a tab.
  const wanted = params.get("tab") ?? (typeof window !== "undefined" && window.location.hash === "#documents" ? "documents" : null);
  const tab = layout.tabs.find((t) => t.key === wanted) ?? layout.tabs[0];
  const select = (key: string) => router.replace(`${pathname}?tab=${key}`, { scroll: false });

  const manage = can(PERMS.employeesManage);
  const self = me?.employee?.id === e.id;
  const left = e.status === "TERMINATED";
  const saved = (text: string) => {
    setDialog(null);
    setNotice({ tone: "success", text });
    reload({ requestPolicy: "network-only" });
  };
  const layoutSaved = () => {
    setDialog(null);
    setNotice({ tone: "success", text: "Layout saved for every employee's record." });
    reloadLayout({ requestPolicy: "network-only" });
    reload({ requestPolicy: "network-only" });
  };

  function renderSection(section: LayoutSection) {
    // Consecutive fields share one card; tables and built-in blocks get a card each.
    const runs: { kind: "fields" | "item"; items: LayoutSection["items"] }[] = [];
    for (const item of section.items) {
      const isField = item.kind === "field" || item.kind === "group" || item.kind === "custom";
      const last = runs[runs.length - 1];
      if (isField && last?.kind === "fields") last.items.push(item);
      else runs.push({ kind: isField ? "fields" : "item", items: [item] });
    }
    const sole = section.items.length === 1;
    return runs.map((run, index): ReactNode => {
      const key = `${section.key}-${index}`;
      if (run.kind === "fields") {
        return <FieldsSection key={key} title={section.title} icon={section.icon} rows={rowsFor(run.items, e, Boolean(tenant?.expandedGender))}
          employee={e} canManage={manage} isSelf={self} onSaved={saved} />;
      }
      const item = run.items[0];
      const title = sole ? section.title : item.label;
      if (item.kind === "table") {
        const table = tables.find((t) => t.key === item.key && t.isActive);
        if (!table || (table.hrOnly && !manage)) return null;
        // Pay tables (bonus, commission, equity) show only to those the API gives pay to.
        if (table.pay && !e.bonusTarget) return null;
        const tableCard = <TableSection key={key} table={table} employee={e} canManage={table.pay ? can(PERMS.compensationManage) : manage}
          title={title} icon={section.icon} onSaved={saved} />;
        return table.key === "training" ? <Fragment key={key}><TrainingDue employeeId={e.id} />{tableCard}</Fragment> : tableCard;
      }
      const common = { e, title, icon: section.icon, onSaved: saved };
      switch (item.key) {
        case "job_summary": return <JobSummaryBlock key={key} {...common} canManage={manage} />;
        case "job_history": return <JobHistoryBlock key={key} {...common} canManage={manage} />;
        case "status_history": return <StatusHistoryBlock key={key} {...common} canManage={manage} />;
        case "notes": return <NotesBlock key={key} {...common} canManage={manage} />;
        case "benefits": return <BenefitsBlock key={key} {...common} canManage={manage} />;
        case "onboarding": return <ChecklistBlock key={key} {...common} kind="ONBOARDING" canManage={manage} />;
        case "offboarding": return <ChecklistBlock key={key} {...common} kind="OFFBOARDING" canManage={manage} />;
        case "compensation": return <PayBlock key={key} {...common} canManagePay={can(PERMS.compensationManage)} currency={tenant?.currency ?? ""} />;
        case "leave": return <LeaveBlock key={key} {...common} isSelf={self} canManageLeave={can(PERMS.leaveManage)} />;
        case "leave_upcoming": return <LeaveUpcomingBlock key={key} {...common} />;
        case "leave_history": return <LeaveHistoryBlock key={key} {...common} isSelf={self} />;
        case "private_details":
          return <PrivateDetailsCard key={key} employee={e} canEdit={manage && (e.fieldAccess as Record<string, string>).private === "edit"} frame={sectionFrame(title, section.icon)} onChanged={() => saved("Bank and ID details saved.")} />;
        case "emergency_contacts":
          return <EmergencyContactsCard key={key} employee={e} canEdit={(manage || self) && (e.fieldAccess as Record<string, string>).emergency === "edit"} frame={sectionFrame(title, section.icon)} onChanged={() => saved("Emergency contacts saved.")} />;
        case "documents":
          return <DocumentsCard key={key} employeeId={e.id} employeeName={e.fullName} canManage={can(PERMS.documentsManage)}
            canUploadOwn={self && Boolean(tenant?.employeeUploads)} frame={sectionFrame(title, section.icon)} />;
        default:
          return null;
      }
    });
  }

  const sections = tab.sections.flatMap(renderSection).filter(Boolean);
  const assets = tables.find((t) => t.key === "assets" && t.isActive);

  return (
    <>
      <ProfileHeader e={e} tabs={layout.tabs} active={tab.key} onSelect={select}
        onCustomizeTabs={manage ? () => setDialog("tabs") : undefined}
        canChangePhoto={(self && Boolean(tenant?.employeesEditOwnPhoto)) || manage} onPhoto={() => saved("Photo updated.")}
        actions={!manage && !self && can(PERMS.employeesView) && e.status !== "TERMINATED" ? (
          // Managers ask for changes for their reports; HR approves them (Settings → Approvals).
          <Menu label="Request a Change">
            {(close) => (
              <>
                <MenuItem icon={faArrowTrendUp} onClick={() => { close(); setDialog("ask-promotion"); }}>Promotion…</MenuItem>
                <MenuItem icon={faBriefcase} onClick={() => { close(); setDialog("ask-job"); }}>Job information…</MenuItem>
                <MenuItem icon={faMoneyBillWave} onClick={() => { close(); setDialog("ask-pay"); }}>Compensation…</MenuItem>
              </>
            )}
          </Menu>
        ) : manage ? (
          <>
            <Menu label="Request a Change">
              {(close) => {
                const open = (d: Dialog) => { close(); setDialog(d); };
                return (
                  <>
                    {assets && !left && <MenuItem icon={faLaptop} onClick={() => open("asset")}>Asset request…</MenuItem>}
                    {can(PERMS.compensationManage) && !left && <MenuItem icon={faMoneyBillWave} onClick={() => open("pay")}>Compensation…</MenuItem>}
                    {canChangeStatus(e.status) && <MenuItem icon={faUserCheck} onClick={() => open("status")}>Employment status…</MenuItem>}
                    {!left && <MenuItem icon={faBriefcase} onClick={() => open("job")}>Job information…</MenuItem>}
                    {!left && <MenuItem icon={faArrowTrendUp} onClick={() => open("promotion")}>Promotion…</MenuItem>}
                  </>
                );
              }}
            </Menu>
            <Menu label="More actions" icon={faEllipsis}>
              {(close) => {
                const access = accessData?.employee?.access;
                return (
                  <>
                    {e.photoUrl && (
                      <MenuItem icon={faTrashCan} onClick={async () => { close(); await removePhoto({ employeeId: e.id }); saved("Photo removed."); }}>Remove photo</MenuItem>
                    )}
                    {access && (
                      <>
                        {e.photoUrl && <MenuDivider />}
                        <MenuItem icon={faLock} href="/settings/users"
                          hint={access.invitePending ? "Invited, not signed in yet" : access.isActive ? access.roles.join(", ") || "No roles" : "Access turned off"}>
                          Access level
                        </MenuItem>
                        {access.isActive && <MenuItem icon={faKey} onClick={() => { close(); setDialog("reset"); }}>Reset user&rsquo;s password</MenuItem>}
                      </>
                    )}
                    {left && !e.archivedAt && (
                      <>
                        {(e.photoUrl || access) && <MenuDivider />}
                        <MenuItem icon={faBoxArchive} onClick={() => { close(); setDialog("archive"); }}>Archive record</MenuItem>
                      </>
                    )}
                  </>
                );
              }}
            </Menu>
          </>
        ) : null} />

      <div className="grid gap-x-8 lg:grid-cols-[230px_1fr]">
        <div className="hidden lg:block"><Vitals e={e} /></div>
        <div className="min-w-0 space-y-5 pt-20 lg:pt-6">
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
          {e.archivedAt && <Notice tone="info" title="Archived">This record is hidden from the employee list but kept for reporting and audit.</Notice>}
          {self && <MyChangeNotice key={notice?.text ?? ""} onChanged={() => saved("Change withdrawn.")} />}
          <div className="flex items-center justify-between gap-3 pb-1">
            <h2 className="flex items-center gap-2.5 font-display text-[26px] font-medium text-brand-ink">
              <TabIcon icon={tab.sections[0]?.icon ?? "list"} />
              {tab.name}
            </h2>
            {manage && (
              <Button size="sm" variant="ghost" icon={<FontAwesomeIcon icon={faTableColumns} className="text-[13px]" />}
                onClick={() => setDialog("layout")}>
                Customize layout
              </Button>
            )}
          </div>
          {sections.length ? sections : (
            <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center text-sm text-muted">
              Nothing on this tab yet.{manage && " Use Customize layout to add sections and fields."}
            </div>
          )}
          <div className="lg:hidden"><Vitals e={e} /></div>
        </div>
      </div>

      {dialog === "job" && <ChangeJobDialog employee={e} changeType="CHANGE" onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Job change recorded.")} />}
      {dialog === "promotion" && <ChangeJobDialog employee={e} changeType="PROMOTION" onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Promotion recorded.")} />}
      {dialog === "ask-job" && <ChangeJobDialog request employee={e} changeType="CHANGE" onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Request sent.")} />}
      {dialog === "ask-promotion" && <ChangeJobDialog request employee={e} changeType="PROMOTION" onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Request sent.")} />}
      {dialog === "ask-pay" && <ChangePayDialog request employee={e} currency={tenant?.currency ?? ""} onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Request sent.")} />}
      {dialog === "asset" && assets && (
        <RowDialog table={assets} employeeId={e.id} row={null} onClose={() => setDialog(null)} onSaved={() => saved("Asset added.")} />
      )}
      <ActionDialog open={dialog === "reset"} onClose={() => setDialog(null)} title={`Reset ${e.fullName}'s password?`}
        description={`We'll email ${accessData?.employee?.access?.email ?? "them"} a link to choose a new password. Their current password keeps working until they do.`}
        confirmLabel="Send reset link"
        onConfirm={async () => {
          const result = await sendReset({ employeeId: e.id });
          if (result.error) throw new Error(errorMessage(result.error));
          setDialog(null);
          setNotice({ tone: "success", text: "Password reset link sent." });
        }} />
      {dialog === "pay" && <ChangePayDialog employee={e} currency={tenant?.currency ?? ""} onClose={() => setDialog(null)} onSaved={(m) => saved(m ?? "Pay change recorded.")} />}
      {dialog === "status" && <ChangeStatusDialog employee={e} onClose={() => setDialog(null)} onSaved={() => saved("Status updated.")} />}
      {dialog === "layout" && (
        <CustomizeLayout layout={layout} tables={tables} fields={layoutData.customFields} tabKey={tab.key} onClose={() => setDialog(null)} onSaved={layoutSaved} />
      )}
      {dialog === "tabs" && <CustomizeTabs layout={layout} onClose={() => setDialog(null)} onSaved={layoutSaved} />}
      <ActionDialog open={dialog === "archive"} onClose={() => setDialog(null)} title={`Archive ${e.fullName}?`}
        description="The record leaves the employee list. History, pay and audit entries are kept." confirmLabel="Archive"
        onConfirm={async () => {
          const result = await archive({ id: e.id });
          const problem = errorMessage(result.error) ?? result.data?.archiveEmployee.errors[0]?.message;
          if (problem) throw new Error(problem);
          saved("Employee archived.");
        }} />
    </>
  );
}

export default function EmployeePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EmployeeRecord />
    </Suspense>
  );
}
