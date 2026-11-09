"use client";

import {
  faBriefcase, faBuilding, faCaretDown, faCirclePlus, faHeartPulse, faPeopleGroup, faPlus, faTableCellsLarge,
  faVenusMars, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import {
  AllAnnouncementsDialog, AnnouncementDialog, BreakdownWidget, CelebrationsWidget, CertificationsWidget, CompanyLinksWidget, HappeningWidget,
  HolidaysWidget, HomeDataDocument, MyStuffWidget, OnboardingWidget, PeopleWidget, Photo, ReadAnnouncementDialog, TimeOffWidget,
  WelcomeWidget, WhosOutWidget, WIDGETS, type HomeData,
} from "@/components/home/Widgets";
import { LocationWidget, PayRaiseWidget, TimeOffRequestsWidget, TimeOffUsedWidget } from "@/components/home/Expandable";
import { EmployeeLeaveDocument, RequestLeaveDialog } from "@/components/leave/Leave";
import { ClockPill } from "@/components/attendance/ClockPill";
import { CompletenessCard, DataGapsCard } from "@/components/profile/Completeness";
import { Button, ErrorNote, Loading, Notice, cx } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const ExpiringDocument = graphql(`
  query HomeExpiring {
    expiringDocuments(withinDays: 30) { id }
  }
`);

const MyPhotoDocument = graphql(`
  query HomeMyPhoto($id: ID!) {
    employee(id: $id) { id photoUrl }
  }
`);

const SaveLayoutDocument = graphql(`
  mutation SaveHomeLayout($widgets: JSON!) {
    saveHomeLayout(widgets: $widgets) { key hidden }
  }
`);

type Announcement = HomeData["announcements"][number];
type Slot = { key: string; hidden: boolean };

// Where each widget sits on the three-column grid; the feed beside the two personal cards, as on BambooHR.
// An expanded widget takes two columns.
const SPAN: Record<string, string> = { happening: "lg:col-span-2 lg:row-span-2", people: "lg:col-span-3" };
const EXPANDABLE = new Set(["time_off_requests", "time_off_used", "location", "pay_raise"]);

/** The "New…" dropdown beside the greeting. */
function NewMenu({ children }: { children: (close: () => void) => ReactNode }) {
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
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu"
        className={cx("inline-flex h-10 items-center gap-2 rounded-full border bg-surface px-4 text-[15px] font-medium text-ink transition",
          open ? "border-brand-ink ring-2 ring-brand/20" : "border-line-strong hover:bg-subtle")}>
        <FontAwesomeIcon icon={faCirclePlus} className="text-muted" /> New… <FontAwesomeIcon icon={faCaretDown} className="text-xs" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-lg">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function NewItem({ onClick, href, children }: { onClick?: () => void; href?: string; children: ReactNode }) {
  const className = "block w-full px-4 py-2.5 text-left text-[15px] text-brand-ink hover:bg-subtle hover:underline";
  return href ? <Link role="menuitem" href={href} className={className}>{children}</Link>
    : <button role="menuitem" type="button" onClick={onClick} className={className}>{children}</button>;
}

const AddMeDocument = graphql(`
  mutation AddMeAsEmployee { addMeAsEmployee { employee { id } errors { message } } }
`);

export default function HomePage() {
  const { me, can, tenant, reset: refreshSession } = useSession();
  const [, addMe] = useMutation(AddMeDocument);
  const [addingMe, setAddingMe] = useState(false);
  const [addMeError, setAddMeError] = useState<string>();
  const employeeId = me?.employee?.id;
  const manage = can(PERMS.employeesManage);

  const [{ data, error }, reload] = useQuery({ query: HomeDataDocument });
  const [{ data: leaveData }, reloadLeave] = useQuery({ query: EmployeeLeaveDocument, variables: {}, pause: !employeeId });
  const [{ data: expiring }] = useQuery({ query: ExpiringDocument, pause: !can(PERMS.documentsManage) });
  const [{ data: photo }] = useQuery({ query: MyPhotoDocument, variables: { id: employeeId ?? "" }, pause: !employeeId });
  const [, saveLayout] = useMutation(SaveLayoutDocument);
  const [dialog, setDialog] = useState<"request" | "post" | "all" | null>(null);
  const [reading, setReading] = useState<Announcement | null>(null);
  const [editingPost, setEditingPost] = useState<Announcement | null>(null);
  const [notice, setNotice] = useState<string>();
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Expanded widgets and where they sit: the grid line they start on and their row.
  const [expanded, setExpanded] = useState<Record<string, { column: number; row: number }>>({});
  const [added, setAdded] = useState<string | null>(null);

  // A widget added in edit mode lands at the end of the page: bring it into view and mark it briefly.
  useEffect(() => {
    if (!added) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`widget-${added}`);
      if (!el) return;
      // Centre it in the part of the window the edit drawer leaves visible.
      const drawer = document.getElementById("widget-drawer")?.offsetHeight ?? 0;
      const box = el.getBoundingClientRect();
      const room = window.innerHeight - drawer;
      window.scrollTo({ top: window.scrollY + box.top - Math.max(16, (room - box.height) / 2), behavior: "smooth" });
    });
    const done = window.setTimeout(() => setAdded(null), 2200);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(done); };
  }, [added]);

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!me || !data) return <Loading />;
  const home = data.home;
  const insights = home.insights;
  const balances = leaveData?.employeeLeave.balances ?? [];
  const company = tenant?.name ?? "the company";
  const firstName = me.user.fullName.split(" ")[0];
  const done = (message: string) => {
    setDialog(null);
    setNotice(message);
    reload({ requestPolicy: "network-only" });
  };

  // Grow towards the side with room, as BambooHR does: a card in the last column widens to its
  // left, any other to its right, and it keeps its row so the cards around it reflow.
  function placeFor(key: string) {
    const el = document.getElementById(`widget-${key}`);
    const box = document.getElementById("home-grid");
    if (!el || !box) return { column: 1, row: 1 };
    const area = box.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(box).columnGap) || 0;
    const width = (area.width - gap * 2 - parseFloat(getComputedStyle(box).paddingLeft) * 2) / 3;
    const left = el.getBoundingClientRect().left - area.left - parseFloat(getComputedStyle(box).paddingLeft);
    const column = Math.min(3, Math.max(1, Math.round(left / (width + gap)) + 1));
    const tops = [...new Set([...box.children].map((c) => Math.round(c.getBoundingClientRect().top)))].sort((a, b) => a - b);
    const row = tops.indexOf(Math.round(el.getBoundingClientRect().top)) + 1;
    return { column: column === 3 ? 2 : column, row: Math.max(1, row) };
  }
  const expandProps = (key: string) => ({
    expanded: key in expanded,
    onExpand: () => {
      if (key in expanded) {
        setExpanded((all) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== key)));
        return;
      }
      const place = placeFor(key);
      setExpanded((all) => ({ ...all, [key]: place }));
    },
  });

  // Each widget this person can have. Order and hiding come from their saved layout.
  const widgets: Record<string, ReactNode | null> = {
    time_off: employeeId && balances.length ? <TimeOffWidget balances={balances} employeeId={employeeId} onRequest={() => setDialog("request")} /> : null,
    my_stuff: employeeId && home.myStuff ? <MyStuffWidget stuff={home.myStuff} employeeId={employeeId} /> : null,
    happening: (
      <HappeningWidget company={company} announcements={data.announcements} newHires={home.newHires} dismissed={data.dismissedFeed}
        canPost={manage} canSeeChanges={manage} onChanged={done} onOpen={setReading} onAll={() => setDialog("all")}
        onPost={() => { setEditingPost(null); setDialog("post"); }} />
    ),
    people: insights || home.directReports.length ? <PeopleWidget insights={insights} reports={home.directReports} /> : null,
    celebrations: <CelebrationsWidget celebrations={home.celebrations} />,
    whos_out: <WhosOutWidget />,
    company_links: data.companyLinks.length || manage ? <CompanyLinksWidget links={data.companyLinks} canEdit={manage} onSaved={done} /> : null,
    welcome: <WelcomeWidget hires={home.newHires} company={company} />,
    time_off_used: insights ? <TimeOffUsedWidget {...expandProps("time_off_used")} /> : null,
    pay_raise: insights && insights.withoutPayRaise !== null && insights.withoutPayRaise !== undefined ? <PayRaiseWidget {...expandProps("pay_raise")} /> : null,
    certifications: insights ? <CertificationsWidget certifications={insights.expiringCertifications} /> : null,
    location: insights ? <LocationWidget {...expandProps("location")} /> : null,
    onboarding: insights?.onboarding ? <OnboardingWidget summary={insights.onboarding} company={company} /> : null,
    time_off_requests: insights ? <TimeOffRequestsWidget {...expandProps("time_off_requests")} /> : null,
    department: insights ? <BreakdownWidget title="Department" icon={faBuilding} items={insights.byDepartment} href="/reports/headcount" empty="No departments yet." /> : null,
    employment_type: insights ? <BreakdownWidget title="Employment type" icon={faBriefcase} items={insights.byEmploymentType} href="/reports/demographics" empty="No one yet." /> : null,
    gender: insights ? <BreakdownWidget title="Gender" icon={faVenusMars} items={insights.byGender} href="/reports/demographics" empty="No one yet." /> : null,
    age: insights ? <BreakdownWidget title="Age" icon={faPeopleGroup} items={insights.byAge} href="/reports/demographics" empty="No one yet." /> : null,
    benefit_enrollments: insights ? <BreakdownWidget title="Benefit enrollments" icon={faHeartPulse} items={insights.benefitEnrollments} href="/settings/benefits" empty="No one enrolled yet." /> : null,
    holidays: <HolidaysWidget />,
  };
  const available = (key: string) => widgets[key] !== null && widgets[key] !== undefined;
  const slots = (draft ?? data.homeLayout).filter((w) => available(w.key));
  const shown = slots.filter((w) => !w.hidden);
  const addable = slots.filter((w) => w.hidden);
  const editing = draft !== null;

  function move(key: string, before: string) {
    if (!draft || key === before) return;
    const next = draft.filter((w) => w.key !== key);
    const at = next.findIndex((w) => w.key === before);
    next.splice(at, 0, draft.find((w) => w.key === key)!);
    setDraft(next);
  }
  const setHidden = (key: string, hidden: boolean) => {
    if (!draft) return;
    const rest = draft.filter((w) => w.key !== key);
    // A widget brought back goes to the end, where the person can drag it into place.
    setDraft(hidden ? draft.map((w) => (w.key === key ? { ...w, hidden } : w)) : [...rest, { key, hidden: false }]);
    if (!hidden) setAdded(key);
  };
  async function save() {
    if (!draft) return;
    setSaving(true);
    await saveLayout({ widgets: draft });
    setSaving(false);
    setDraft(null);
    done("Home page saved.");
  }

  return (
    <div className={editing ? "pb-56" : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Photo name={me.user.fullName} src={photo?.employee?.photoUrl} size={96} className="hidden sm:block" />
          <h1 className="font-display text-[40px] font-medium leading-tight text-brand-ink sm:text-[46px]">Hi, {firstName}</h1>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            {employeeId && <span data-tour="clock"><ClockPill /></span>}
            {manage && (
              <span data-tour="new"><NewMenu>
                {(close) => (
                  <>
                    <NewItem href="/employees/new">New employee</NewItem>
                    <NewItem href="/reports">New report</NewItem>
                    <NewItem onClick={() => { close(); setEditingPost(null); setDialog("post"); }}>New announcement</NewItem>
                  </>
                )}
              </NewMenu></span>
            )}
            <button type="button" data-tour="home-edit" onClick={() => { setNotice(undefined); setDraft(data.homeLayout.map((w) => ({ key: w.key, hidden: w.hidden }))); }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[15px] font-medium text-ink hover:bg-subtle">
              <FontAwesomeIcon icon={faTableCellsLarge} className="text-[14px]" /> Edit
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {notice && <Notice tone="success">{notice}</Notice>}
        {!editing && (data?.home.myProfile?.missing.length || data?.home.dataGaps.length) ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {employeeId && data?.home.myProfile && <div data-tour="profile-card"><CompletenessCard data={data.home.myProfile} employeeId={employeeId} self compact /></div>}
            {data?.home.dataGaps && <div data-tour="gaps"><DataGapsCard gaps={data.home.dataGaps} /></div>}
          </div>
        ) : null}
        {expiring && expiring.expiringDocuments.length > 0 && !editing && (
          <Notice tone="warning" title={`${expiring.expiringDocuments.length} ${expiring.expiringDocuments.length === 1 ? "document has" : "documents have"} expired or expire within 30 days`}>
            <Link href="/files?view=employee" className="font-semibold underline-offset-2 hover:underline">See which ones</Link>
          </Notice>
        )}
        {!employeeId && (
          <Notice tone="info" title="You do not have an employee record yet">
            {manage ? <>
              Add yourself to get your own time off, profile and place in the org chart. If you are not on the staff, you can leave this.
              {addMeError && <div className="mt-2"><ErrorNote error={addMeError} /></div>}
              <div className="mt-3">
                <Button size="sm" busy={addingMe} onClick={async () => {
                  setAddingMe(true);
                  setAddMeError(undefined);
                  const result = await addMe({});
                  setAddingMe(false);
                  const failure = result.error ? errorMessage(result.error) : result.data?.addMeAsEmployee.errors[0]?.message;
                  if (failure) return setAddMeError(failure);
                  refreshSession();
                }}>Add me as an employee</Button>
              </div>
            </> : "Ask HR to link your account to your employee record to see your time off and team."}
          </Notice>
        )}
      </div>

      <div id="home-grid" className={cx("mt-5 grid grid-flow-row-dense gap-5 lg:grid-cols-3", editing && "rounded-3xl bg-line/40 p-4 sm:p-6")}>
        {shown.map((w) => (
          <div key={w.key} id={`widget-${w.key}`}
            style={EXPANDABLE.has(w.key) && expanded[w.key] && !editing
              ? { "--gc": `${expanded[w.key].column} / span 2`, "--gr": `${expanded[w.key].row}` } as CSSProperties : undefined}
            className={cx("relative min-w-0 scroll-mt-24 rounded-2xl transition-shadow duration-500 [&>section]:h-full",
              SPAN[w.key] ?? (EXPANDABLE.has(w.key) && expanded[w.key]
                ? (editing ? "lg:col-span-2" : "lg:[grid-column:var(--gc)] lg:[grid-row:var(--gr)]") : undefined),
              editing && "cursor-grab", dragging === w.key && "opacity-40", added === w.key && "ring-4 ring-brand/40")}
            draggable={editing}
            onDragStart={(e: DragEvent) => { setDragging(w.key); e.dataTransfer.effectAllowed = "move"; }}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e: DragEvent) => { if (editing) e.preventDefault(); }}
            onDrop={(e: DragEvent) => { e.preventDefault(); if (dragging) move(dragging, w.key); setDragging(null); }}>
            {editing ? <div className="pointer-events-none h-full select-none [&>section]:h-full [&_header>div:last-child]:invisible">{widgets[w.key]}</div> : widgets[w.key]}
            {editing && (
              <button type="button" onClick={() => setHidden(w.key, true)} aria-label={`Remove ${WIDGETS[w.key]?.name ?? w.key}`}
                className="absolute right-3 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-sm hover:bg-subtle">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        ))}
      </div>
      {shown.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center text-sm text-muted">
          Every widget is hidden. Use Edit to add some back.
        </div>
      )}

      {editing && (
        <div id="widget-drawer" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 px-4 pb-5 pt-4 shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur sm:px-8 lg:left-64">
          <h2 className="flex items-center gap-2.5 font-display text-[22px] text-brand-ink"><FontAwesomeIcon icon={faTableCellsLarge} className="text-[18px]" /> Add widgets</h2>
          <p className="text-[13px] text-muted">Drag widgets on the page to reorder them. Only you see this layout.</p>
          {addable.length ? (
            <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {addable.map((w) => (
                <li key={w.key} className="flex-none">
                  <button type="button" onClick={() => setHidden(w.key, false)}
                    className="flex h-[64px] w-60 items-center gap-3 rounded-xl border border-line bg-surface px-3 text-left text-[15px] font-semibold text-brand-ink shadow-sm hover:border-brand-ink">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-subtle"><FontAwesomeIcon icon={WIDGETS[w.key]?.icon ?? faPlus} /></span>
                    <span className="truncate">{WIDGETS[w.key]?.name ?? w.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">Every widget is on your page.</p>}
          <div className="mt-4 flex gap-2">
            <Button busy={saving} onClick={() => void save()} className="rounded-full px-6">Save</Button>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={saving} className="rounded-full px-6">Cancel</Button>
          </div>
        </div>
      )}

      {dialog === "request" && leaveData && (
        <RequestLeaveDialog balances={leaveData.employeeLeave.balances} onClose={() => setDialog(null)}
          onSaved={(status) => { reloadLeave({ requestPolicy: "network-only" }); done(status === "APPROVED" ? "Leave booked." : "Request sent to your manager."); }} />
      )}
      {dialog === "post" && <AnnouncementDialog announcement={editingPost} onClose={() => setDialog(null)} onSaved={done} />}
      {dialog === "all" && (
        <AllAnnouncementsDialog announcements={data.announcements} canEdit={manage} onClose={() => setDialog(null)}
          onOpen={(a) => { setDialog(null); setReading(a); }} />
      )}
      {reading && (
        <ReadAnnouncementDialog announcement={reading} canEdit={manage} onClose={() => setReading(null)}
          onEdit={() => { setEditingPost(reading); setReading(null); setDialog("post"); }}
          onDeleted={() => { setReading(null); done("Announcement deleted."); }} />
      )}
    </div>
  );
}
