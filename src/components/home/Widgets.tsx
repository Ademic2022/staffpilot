"use client";

import {
  faArrowsRotate, faAward, faBoxOpen, faBriefcase, faBuilding, faBullhorn, faCakeCandles, faCalculator, faCalendarDay,
  faCalendarDays, faCalendarPlus, faCertificate, faChartSimple, faChevronRight, faClipboardCheck, faFaceFrown,
  faGraduationCap, faHandsClapping, faHeartPulse, faIdCard, faLink, faListCheck, faLocationDot, faPeopleGroup, faPen,
  faBell, faPlaneDeparture, faSitemap, faThumbtack, faClipboardList, faChampagneGlasses, faEllipsisVertical, faEnvelope, faIdBadge, faPhone, faUser, faUmbrellaBeach, faUserCheck, faUserMinus, faUserPen, faUserPlus,
  faUsers, faVenusMars, faXmark, type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import { EmptyArt, type ArtKind } from "@/components/home/EmptyArt";
import { useSnapshot } from "@/components/snapshot/Snapshot";
import { BarList, ChartTable, DivergingStrip, Legend, MonthColumns, SERIES, TipRow, type Column, type Series } from "@/components/home/Charts";
import type { LeaveBalanceRow } from "@/components/leave/Leave";
import { ActionDialog, Button, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Select, Textarea, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { HomeDataQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate, formatDays, formatRange } from "@/lib/format";
import { reportErrors, today } from "@/lib/forms";

export const HomeDataDocument = graphql(`
  query HomeData {
    home {
      setup { percent steps { key label why href done group } }
      myProfile { percent missing { key label tab critical why } }
      dataGaps { key label why count people { id fullName jobTitle photoUrl } }
      celebrations { kind date years person { id fullName jobTitle photoUrl } }
      newHires { hireDate person { id fullName jobTitle photoUrl } }
      myStuff { trainings certifications certificationsExpiring benefits openTasks }
      directReports {
        notes outToday department location timezone workEmail workPhone workPhoneExt
        events { kind label date }
        person { id fullName jobTitle photoUrl }
      }
      insights {
        months { month headcount additions terminations voluntary involuntary other turnoverRate }
        headcount change changePercent additions terminations turnoverRate
        byLocation { label value } byDepartment { label value } byEmploymentType { label value }
        byGender { label value } byAge { label value } benefitEnrollments { label value }
        expiringCertifications { name people soonest }
        pendingUrgent pendingOther withoutPayRaise
        onboarding { inProgress withOverdue starting { date people { id fullName jobTitle photoUrl } } }
      }
    }
    announcements(limit: 20) { id title body authorName publishedAt pinned }
    companyLinks { id group label url }
    homeLayout { key hidden }
    dismissedFeed
  }
`);

export type HomeData = HomeDataQuery;
type Announcement = HomeData["announcements"][number];
type CompanyLink = HomeData["companyLinks"][number];
type Insights = NonNullable<HomeData["home"]["insights"]>;

const initialsOf = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** A square photo with rounded corners, or initials on a tint. */
export function Photo({ name, src, size = 40, faded, className }: { name: string; src?: string | null; size?: number; faded?: boolean; className?: string }) {
  const radius = size >= 80 ? "rounded-2xl" : size >= 48 ? "rounded-xl" : "rounded-lg";
  return (
    <span className={cx("block flex-none overflow-hidden bg-subtle ring-1 ring-line", radius, faded && "opacity-50", className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center font-display text-muted" style={{ fontSize: size * 0.34 }} aria-hidden>{initialsOf(name)}</span>
      )}
    </span>
  );
}

/** A home widget: a tinted header bar with a brand icon and title, then the content. */
export function Widget({ title, icon, actions, tools, children, className, flush, bodyClassName }: {
  title: string; icon: IconDefinition; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean; bodyClassName?: string;
  /** Filter and expand buttons: shown on hover, as on BambooHR (WidgetTools keeps them up while in use). */
  tools?: ReactNode;
}) {
  return (
    // No overflow clipping, so hover cards, menus and chart tooltips can extend past the card.
    <section className={cx("group/widget flex min-w-0 flex-col rounded-2xl border border-line bg-surface shadow-sm", className)}>
      <header className="flex min-h-[56px] items-center justify-between gap-3 rounded-t-2xl border-b border-line bg-subtle/60 px-4">
        <h2 className="flex min-w-0 items-center gap-2.5 text-[18px] font-semibold text-brand-ink">
          <FontAwesomeIcon icon={icon} className="text-[16px]" fixedWidth />
          <span className="truncate">{title}</span>
        </h2>
        {(actions || tools) && <div className="flex flex-none items-center gap-3 text-sm">{actions}{tools}</div>}
      </header>
      <div className={cx("flex flex-1 flex-col", flush ? "" : "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** A widget with nothing to show: a small drawing, a title, one helpful line and maybe an action. */
export function Empty({ children, title, art, action }: { children: ReactNode; title?: string; art?: ArtKind; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
      {art && <EmptyArt kind={art} className="mb-3 h-20 w-auto" />}
      {title && <p className="text-[15px] font-semibold text-ink">{title}</p>}
      <p className={cx("max-w-xs text-sm text-muted", title && "mt-1")}>{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const monthName = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).toLocaleDateString(undefined, { month: "short" });
export const longDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, opts);

/* ------------------------------------------------------------------ Time off */

const ProjectedDocument = graphql(`
  query ProjectedLeave($leaveTypeId: ID!, $on: Date!) {
    projectedLeaveBalance(leaveTypeId: $leaveTypeId, on: $on) { balance pending available }
  }
`);

function CalculatorDialog({ balances, initial, onClose }: { balances: LeaveBalanceRow[]; initial: string; onClose: () => void }) {
  const tracked = balances.filter((b) => b.leaveType.tracksBalance);
  const [typeId, setTypeId] = useState(initial);
  const [on, setOn] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [{ data, error, fetching }] = useQuery({ query: ProjectedDocument, variables: { leaveTypeId: typeId, on }, pause: !typeId || !on || on < today() });
  const result = data?.projectedLeaveBalance;
  return (
    <Dialog open onClose={onClose} title="Calculate future time off" description="See what you will have on a date, with the days you will earn by then."
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Leave type">
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {tracked.map((b) => <option key={b.leaveType.id} value={b.leaveType.id}>{b.leaveType.name}</option>)}
          </Select>
        </Field>
        <Field label="As of"><Input type="date" min={today()} value={on} onChange={(e) => setOn(e.target.value)} /></Field>
      </div>
      <div className="mt-5 rounded-xl bg-subtle px-5 py-4 text-center">
        {error ? <ErrorNote error={errorMessage(error)} /> : !result || fetching ? <p className="text-sm text-muted">Working it out…</p> : (
          <>
            <p className="font-display text-4xl text-brand-ink">{Number(result.available ?? result.balance ?? 0)}</p>
            <p className="text-sm text-brand-ink">days available on {formatDate(on)}</p>
            {Number(result.pending) > 0 && <p className="mt-1 text-xs text-muted">After {formatDays(result.pending)} waiting for approval</p>}
          </>
        )}
      </div>
    </Dialog>
  );
}

export function TimeOffWidget({ balances, employeeId, onRequest }: { balances: LeaveBalanceRow[]; employeeId: string; onRequest: () => void }) {
  const tracked = balances.filter((b) => b.available !== null && b.available !== undefined);
  const [index, setIndex] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const current = tracked[index % Math.max(1, tracked.length)];
  const href = `/employees/${employeeId}?tab=time_off`;
  return (
    <Widget title="Time off" icon={faCalendarDays} bodyClassName="justify-center px-6 py-6">
      {current ? (
        <div className="relative text-center">
          <p className="text-[15px] font-medium text-ink">{current.leaveType.name}</p>
          <Link href={href} className="group mt-1 inline-flex flex-col items-center text-brand-ink">
            <span className="flex items-center gap-3">
              <FontAwesomeIcon icon={faUmbrellaBeach} className="text-[30px]" />
              <span className="font-display text-[40px] leading-none group-hover:underline">{Number(current.available)}</span>
            </span>
            <span className="mt-1 text-[15px] group-hover:underline">days available</span>
          </Link>
          {tracked.length > 1 && (
            <button type="button" onClick={() => setIndex((i) => (i + 1) % tracked.length)} aria-label="Next leave type"
              className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-surface text-ink hover:bg-subtle">
              <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
            </button>
          )}
        </div>
      ) : <Empty>No leave balance to show.</Empty>}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" onClick={onRequest}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full border border-brand-ink px-5 text-[16px] font-semibold text-brand-ink hover:bg-subtle">
          <FontAwesomeIcon icon={faCalendarPlus} /> Request time off
        </button>
        {current && (
          <button type="button" onClick={() => setCalculating(true)} aria-label="Calculate future time off"
            className="grid h-12 w-14 flex-none place-items-center rounded-full border border-brand-ink text-brand-ink hover:bg-subtle">
            <FontAwesomeIcon icon={faCalculator} />
          </button>
        )}
      </div>
      {calculating && current && <CalculatorDialog balances={balances} initial={current.leaveType.id} onClose={() => setCalculating(false)} />}
    </Widget>
  );
}

/* ------------------------------------------------------------------ My stuff */

function StuffRow({ href, icon, title, detail }: { href: string; icon: IconDefinition; title: string; detail: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3.5 py-3">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-subtle text-[17px] text-brand-ink"><FontAwesomeIcon icon={icon} /></span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-ink group-hover:text-brand-ink group-hover:underline">{title}</span>
        <span className="block text-[13px] text-muted">{detail}</span>
      </span>
    </Link>
  );
}

export function MyStuffWidget({ stuff, employeeId }: { stuff: NonNullable<HomeData["home"]["myStuff"]>; employeeId: string }) {
  const base = `/employees/${employeeId}?tab=`;
  return (
    <Widget title="My stuff" icon={faBoxOpen} bodyClassName="py-1">
      <div className="divide-y divide-line">
        <StuffRow href={`${base}onboarding`} icon={faListCheck} title="Tasks" detail={stuff.openTasks ? `${plural(stuff.openTasks, "task")} to do` : "Nothing to do"} />
        <StuffRow href={`${base}training`} icon={faGraduationCap} title="Training" detail={stuff.trainings ? `${plural(stuff.trainings, "course")} completed` : "No training recorded"} />
        <StuffRow href={`${base}certifications`} icon={faCertificate} title="Certifications"
          detail={stuff.certificationsExpiring ? <span className="text-red-600 dark:text-red-400">{plural(stuff.certificationsExpiring, "certification")} expiring soon</span>
            : stuff.certifications ? `${plural(stuff.certifications, "certification")}, none expiring soon` : "None recorded"} />
        <StuffRow href={`${base}benefits`} icon={faHeartPulse} title="Benefits"
          detail={stuff.benefits ? `You are enrolled in ${plural(stuff.benefits, "benefit plan")}` : "Not enrolled yet"} />
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------ What's happening */

const ApprovalsDocument = graphql(`
  query HomeApprovals {
    leaveApprovals { id startDate endDate days createdAt canDecide employee { id fullName photoUrl } leaveType { name color } }
  }
`);

const ChangesDocument = graphql(`
  query HomeChanges {
    pendingChangeRequests { id employeeId employeeName createdAt canDecide }
  }
`);

const DecideDocument = graphql(`
  mutation HomeDecideLeave($input: DecideLeaveInput!) {
    decideLeave(input: $input) { request { id status } errors { field message } }
  }
`);

const DismissDocument = graphql(`
  mutation DismissFeedItem($key: String!) {
    dismissFeedItem(key: $key)
  }
`);

type FeedItem = {
  key: string; at: string; when: string; body: ReactNode; href?: string; onOpen?: () => void;
  avatar?: { name: string; src?: string | null }; icon?: IconDefinition; actions?: ReactNode;
};

export function ago(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 0) return days === -1 ? "Tomorrow" : `In ${-days} days`;
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? "month" : "months"} ago`;
  return formatDate(iso.slice(0, 10));
}

export function HappeningWidget({ company, announcements, newHires, dismissed, canPost, canSeeChanges, onChanged, onOpen, onPost, onAll }: {
  company: string; announcements: Announcement[]; newHires: HomeData["home"]["newHires"]; dismissed: string[]; canPost: boolean;
  canSeeChanges: boolean; onChanged: (message: string) => void; onOpen: (a: Announcement) => void; onPost: () => void; onAll: () => void;
}) {
  const [{ data: approvals }, reloadApprovals] = useQuery({ query: ApprovalsDocument });
  const [{ data: changes }] = useQuery({ query: ChangesDocument, pause: !canSeeChanges });
  const [, decide] = useMutation(DecideDocument);
  const [, dismiss] = useMutation(DismissDocument);
  const [hidden, setHidden] = useState<string[]>(dismissed);
  const [denying, setDenying] = useState<{ id: string; name: string } | null>(null);
  const [problem, setProblem] = useState<string>();

  async function approve(id: string) {
    const result = await decide({ input: { id, approve: true } });
    const message = errorMessage(result.error) ?? result.data?.decideLeave.errors[0]?.message;
    if (message) return setProblem(message);
    setProblem(undefined);
    reloadApprovals({ requestPolicy: "network-only" });
    onChanged("Leave approved.");
  }
  function clear(key: string) {
    setHidden((h) => [...h, key]);
    void dismiss({ key });
  }

  const now = new Date().toISOString();
  const items: FeedItem[] = [
    ...announcements.filter((a) => a.publishedAt <= now).map((a): FeedItem => ({
      key: `a${a.id}`, at: a.publishedAt, when: ago(a.publishedAt), icon: a.pinned ? faThumbtack : faBullhorn, onOpen: () => onOpen(a),
      body: <>{a.authorName} posted an announcement <strong className="font-semibold">{a.title}</strong></>,
      actions: <Button size="sm" variant="secondary" className="rounded-full" onClick={() => onOpen(a)}>View announcement</Button>,
    })),
    ...(approvals?.leaveApprovals ?? []).filter((r) => r.canDecide).map((r): FeedItem => ({
      key: `l${r.id}`, at: r.createdAt, when: ago(r.createdAt), avatar: { name: r.employee.fullName, src: r.employee.photoUrl },
      href: "/leave/approvals",
      body: <>{r.employee.fullName} requested <strong className="font-semibold">{formatRange(r.startDate, r.endDate)}</strong> off – {formatDays(r.days)} of {r.leaveType.name}</>,
      actions: (
        <>
          <Button size="sm" className="rounded-full" onClick={() => void approve(r.id)}>Approve</Button>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setDenying({ id: r.id, name: r.employee.fullName })}>Deny</Button>
        </>
      ),
    })),
    ...(changes?.pendingChangeRequests ?? []).filter((c) => c.canDecide).map((c): FeedItem => ({
      key: `c${c.id}`, at: c.createdAt, when: ago(c.createdAt), icon: faUserPen, href: "/employees/requests",
      body: <>{c.employeeName} is requesting an update to their personal information.</>,
      actions: <Link href="/employees/requests" className="inline-flex h-8 items-center rounded-full border border-line-strong px-3 text-sm font-medium text-ink hover:bg-subtle">Review</Link>,
    })),
    ...newHires.filter((h) => h.hireDate <= now.slice(0, 10)).map((h): FeedItem => ({
      key: `h${h.person.id}`, at: `${h.hireDate}T08:00:00`, when: ago(`${h.hireDate}T08:00:00`), avatar: { name: h.person.fullName, src: h.person.photoUrl },
      href: `/employees/${h.person.id}`,
      body: <>{h.person.fullName} joined{h.person.jobTitle ? <> as <strong className="font-semibold">{h.person.jobTitle}</strong></> : null}.</>,
    })),
  ].filter((i) => !hidden.includes(i.key)).sort((a, b) => b.at.localeCompare(a.at));

  const published = announcements.filter((a) => a.publishedAt <= now).length;
  return (
    <Widget title={`What's happening at ${company}`} icon={faBullhorn} flush className="[&_h2]:text-[16px]"
      actions={<>
        {canPost && <button type="button" onClick={onPost} className="font-medium text-brand-ink hover:underline">Post</button>}
        {published > 0 && <button type="button" onClick={onAll} className="font-medium text-brand-ink hover:underline">Announcements ({published})</button>}
      </>}>
      {problem && <div className="px-5 pt-4"><ErrorNote error={problem} /></div>}
      <div className="relative min-h-[380px] flex-1">
        <ul className="absolute inset-0 overflow-y-auto px-5">
          {items.map((i) => {
            const text = <span className="text-[15px] leading-snug text-ink group-hover:text-brand-ink group-hover:underline">{i.body}</span>;
            return (
              <li key={i.key} className="group flex items-center gap-3.5 border-b border-line py-3.5 last:border-0">
                {i.avatar ? <Photo name={i.avatar.name} src={i.avatar.src} size={42} /> : (
                  <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-lg bg-subtle text-muted"><FontAwesomeIcon icon={i.icon ?? faBullhorn} /></span>
                )}
                <div className="min-w-0 flex-1">
                  {i.onOpen ? <button type="button" onClick={i.onOpen} className="text-left">{text}</button>
                    : i.href ? <Link href={i.href}>{text}</Link> : text}
                  <p className="mt-0.5 text-[13px] text-muted">{i.when}</p>
                </div>
                <div className="hidden flex-none items-center gap-2 group-hover:flex group-focus-within:flex max-lg:flex">
                  {i.actions}
                  <IconButton label="Clear from feed" className="rounded-full border border-line-strong" onClick={() => clear(i.key)}>
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
        {!items.length && (
          <div className="absolute inset-0 flex">
            <Empty art="feed" title={announcements.length || hidden.length ? "You are all caught up" : "Nothing new yet"}
              action={canPost ? <Button size="sm" variant="secondary" className="rounded-full" onClick={onPost}>Post an announcement</Button> : undefined}>
              Announcements, leave requests to approve and new starters show up here.
            </Empty>
          </div>
        )}
      </div>
      {denying && <DenyDialog {...denying} onClose={() => setDenying(null)}
        onDone={() => { setDenying(null); reloadApprovals({ requestPolicy: "network-only" }); onChanged("Leave declined."); }} />}
    </Widget>
  );
}

function DenyDialog({ id, name, onClose, onDone }: { id: string; name: string; onClose: () => void; onDone: () => void }) {
  const [, decide] = useMutation(DecideDocument);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!note.trim()) return setError(`Tell ${name.split(" ")[0]} why. They will see this note.`);
    setBusy(true);
    const result = await decide({ input: { id, approve: false, note } });
    setBusy(false);
    const message = errorMessage(result.error) ?? result.data?.decideLeave.errors[0]?.message;
    if (message) setError(message);
    else onDone();
  }
  return (
    <Dialog open onClose={onClose} title={`Deny ${name}'s request?`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="deny-form" variant="danger" busy={busy}>Deny request</Button>
      </>}>
      <form id="deny-form" onSubmit={submit} noValidate>
        <Field label="Reason" error={error}><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </form>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- Announcements */

const SaveAnnouncementDocument = graphql(`
  mutation SaveAnnouncement($input: AnnouncementInput!) {
    saveAnnouncement(input: $input) { announcement { id } errors { field message } }
  }
`);

const DeleteAnnouncementDocument = graphql(`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`);

export function AnnouncementDialog({ announcement, onClose, onSaved }: { announcement: Announcement | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [, save] = useMutation(SaveAnnouncementDocument);
  const [v, setV] = useState({
    title: announcement?.title ?? "", body: announcement?.body ?? "", pinned: announcement?.pinned ?? false,
    publishAt: announcement && new Date(announcement.publishedAt) > new Date() ? announcement.publishedAt.slice(0, 16) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    const result = await save({ input: {
      id: announcement?.id ?? null, title: v.title, body: v.body, pinned: v.pinned,
      publishedAt: v.publishAt ? new Date(v.publishAt).toISOString() : null,
    } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.saveAnnouncement.errors, ["title", "body", "publishedAt"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) onSaved(announcement ? "Announcement updated." : v.publishAt ? "Announcement scheduled." : "Announcement posted.");
  }

  return (
    <Dialog open wide onClose={onClose} title={announcement ? "Edit announcement" : "New announcement"}
      description="Everyone sees it in What's happening on their home page."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="announcement-form" busy={busy}>{announcement ? "Save" : v.publishAt ? "Schedule" : "Post"}</Button>
      </>}>
      <form id="announcement-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="Title" error={errors.title}><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
        <Field label="Message" error={errors.body}><Textarea rows={6} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publish at" optional hint="Leave empty to post now." error={errors.publishedAt}>
            <Input type="datetime-local" value={v.publishAt} onChange={(e) => setV({ ...v, publishAt: e.target.value })} />
          </Field>
          <div className="pt-7"><Checkbox label="Pin to the top" checked={v.pinned} onChange={(c) => setV({ ...v, pinned: c })} /></div>
        </div>
      </form>
    </Dialog>
  );
}

export function ReadAnnouncementDialog({ announcement, canEdit, onClose, onEdit, onDeleted }: {
  announcement: Announcement; canEdit: boolean; onClose: () => void; onEdit: () => void; onDeleted: () => void;
}) {
  const [, remove] = useMutation(DeleteAnnouncementDocument);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Dialog open wide onClose={onClose} title={announcement.title}
        description={`${announcement.authorName} · ${new Date(announcement.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`}
        footer={canEdit ? <>
          <Button variant="ghost" onClick={() => setConfirming(true)}>Delete</Button>
          <Button variant="secondary" icon={<FontAwesomeIcon icon={faPen} className="text-xs" />} onClick={onEdit}>Edit</Button>
        </> : <Button variant="secondary" onClick={onClose}>Close</Button>}>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{announcement.body}</p>
      </Dialog>
      <ActionDialog open={confirming} onClose={() => setConfirming(false)} title="Delete this announcement?" confirmLabel="Delete" tone="danger"
        description="It disappears from everyone's home page."
        onConfirm={async () => {
          const result = await remove({ id: announcement.id });
          if (result.error) throw new Error(errorMessage(result.error));
          onDeleted();
        }} />
    </>
  );
}

export function AllAnnouncementsDialog({ announcements, canEdit, onClose, onOpen }: {
  announcements: Announcement[]; canEdit: boolean; onClose: () => void; onOpen: (a: Announcement) => void;
}) {
  const now = new Date().toISOString();
  const shown = announcements.filter((a) => canEdit || a.publishedAt <= now);
  return (
    <Dialog open wide onClose={onClose} title="Announcements" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <ul className="-my-2 divide-y divide-line">
        {shown.map((a) => (
          <li key={a.id}>
            <button type="button" onClick={() => onOpen(a)} className="group block w-full py-3 text-left">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-ink group-hover:text-brand-ink group-hover:underline">
                {a.pinned && <FontAwesomeIcon icon={faThumbtack} className="text-xs text-muted" />}{a.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {a.authorName} · {a.publishedAt > now ? `Scheduled for ${formatDate(a.publishedAt.slice(0, 10))}` : ago(a.publishedAt)}
              </span>
              <span className="mt-1 line-clamp-2 block text-sm text-muted">{a.body}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

/* ----------------------------------------- People: headcount, direct reports, turnover */

type Report = HomeData["home"]["directReports"][number];

const EVENT_ICONS: Record<string, IconDefinition> = {
  out: faUmbrellaBeach, pending: faClipboardList, holiday: faChampagneGlasses, birthday: faCakeCandles,
  anniversary: faAward, onboarding: faListCheck,
};

/** Shows `content` while the pointer is over the trigger or the card (or it has keyboard focus), as BambooHR's hover cards do. */
function HoverCard({ trigger, children, className }: { trigger: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const show = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(true), 150); };
  const hide = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), 120); };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {trigger}
      {open && (
        <span role="dialog" className={cx("absolute top-full z-30 mt-1.5 block rounded-xl border border-line bg-surface p-4 text-left shadow-lg", className)}>
          {children}
        </span>
      )}
    </span>
  );
}

function localTime(zone: string | null | undefined) {
  if (!zone) return null;
  try {
    return new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: zone });
  } catch {
    return null;
  }
}

function ContactCard({ report }: { report: Report }) {
  const snapshot = useSnapshot();
  const time = localTime(report.timezone);
  const role = [report.person.jobTitle, report.department].filter(Boolean).join(" | ");
  return (
    <span className="block w-72">
      <span className="flex items-center gap-3">
        <Photo name={report.person.fullName} src={report.person.photoUrl} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[19px] text-ink">{report.person.fullName}</span>
          {role && <span className="block truncate text-[13px] text-muted">{role}</span>}
        </span>
      </span>
      <span className="mt-3 block space-y-1.5 text-[13px] text-ink">
        {report.location && (
          <span className="flex items-center gap-2.5"><FontAwesomeIcon icon={faLocationDot} fixedWidth className="text-muted" />{report.location}{time ? ` · ${time} local time` : ""}</span>
        )}
        {report.workEmail && (
          <a href={`mailto:${report.workEmail}`} className="flex items-center gap-2.5 hover:underline"><FontAwesomeIcon icon={faEnvelope} fixedWidth className="text-muted" />{report.workEmail}</a>
        )}
        {report.workPhone && (
          <a href={`tel:${report.workPhone}`} className="flex items-center gap-2.5 hover:underline">
            <FontAwesomeIcon icon={faPhone} fixedWidth className="text-muted" />{report.workPhone}{report.workPhoneExt ? ` ext. ${report.workPhoneExt}` : ""}
          </a>
        )}
      </span>
      <span className="mt-3 flex items-center gap-4">
        <button type="button" onClick={() => snapshot.open(report.person.id)} className="flex items-center gap-2 text-sm font-medium text-brand-ink hover:underline">
          <FontAwesomeIcon icon={faIdBadge} className="text-xs" /> Open snapshot view
        </button>
        <Link href={`/employees/${report.person.id}`} className="flex items-center gap-2 text-sm text-muted hover:text-ink hover:underline">
          <FontAwesomeIcon icon={faUser} className="text-xs" /> Profile
        </Link>
      </span>
    </span>
  );
}

function TileMenu({ report }: { report: Report }) {
  const snapshot = useSnapshot();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const item = "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-ink hover:bg-subtle";
  return (
    <span ref={box} className={cx("absolute -right-2 -top-2 z-10 transition", open ? "opacity-100" : "opacity-0 group-hover/tile:opacity-100 has-[:focus-visible]:opacity-100")}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label={`Actions for ${report.person.fullName}`}
        className="grid h-7 w-7 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-sm hover:bg-subtle">
        <FontAwesomeIcon icon={faEllipsisVertical} className="text-xs" />
      </button>
      {open && (
        <span role="menu" className="absolute right-0 top-full z-30 mt-1 block w-48 rounded-xl border border-line bg-surface py-1.5 shadow-lg">
          <button role="menuitem" type="button" onClick={() => { setOpen(false); snapshot.open(report.person.id); }} className={item}>
            <FontAwesomeIcon icon={faIdBadge} fixedWidth className="text-muted" />Snapshot view
          </button>
          <Link role="menuitem" href={`/employees/${report.person.id}`} className={item}><FontAwesomeIcon icon={faUser} fixedWidth className="text-muted" />View profile</Link>
          <Link role="menuitem" href={`/employees/${report.person.id}?tab=time_off`} className={item}><FontAwesomeIcon icon={faUmbrellaBeach} fixedWidth className="text-muted" />Time off</Link>
          {report.workEmail && <a role="menuitem" href={`mailto:${report.workEmail}`} className={item}><FontAwesomeIcon icon={faEnvelope} fixedWidth className="text-muted" />Send email</a>}
        </span>
      )}
    </span>
  );
}

function ReportTile({ report }: { report: Report }) {
  const [first, ...more] = report.events;
  return (
    <li className="flex flex-col items-center text-center">
      <span className="group/tile relative">
        <Link href={`/employees/${report.person.id}`} aria-label={report.person.fullName}>
          <Photo name={report.person.fullName} src={report.person.photoUrl} size={96} faded={report.outToday} />
        </Link>
        <TileMenu report={report} />
      </span>
      <HoverCard className="left-1/2 -translate-x-1/2" trigger={
        <Link href={`/employees/${report.person.id}`}
          className={cx("mt-2.5 text-[15px] font-medium hover:text-brand-ink hover:underline focus-visible:text-brand-ink", report.outToday ? "text-muted" : "text-ink")}>
          {report.person.fullName}
        </Link>
      }>
        <ContactCard report={report} />
      </HoverCard>
      {first && (
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
          <FontAwesomeIcon icon={EVENT_ICONS[first.kind] ?? faCalendarDay} className="text-[11px]" />{first.label}
        </span>
      )}
      {more.length > 0 && (
        <HoverCard className="left-full top-0 ml-2 mt-0 w-64" trigger={
          <button type="button" className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />+{more.length} more
          </button>
        }>
          <span className="block font-semibold text-ink">{report.person.fullName}</span>
          {report.person.jobTitle && <span className="block text-sm text-muted">{report.person.jobTitle}</span>}
          <span className="mt-3 block space-y-2">
            {report.events.map((ev) => (
              <span key={ev.kind + ev.label} className="flex items-center gap-2.5 text-sm text-ink">
                <FontAwesomeIcon icon={EVENT_ICONS[ev.kind] ?? faCalendarDay} fixedWidth className="text-muted" />{ev.label}
              </span>
            ))}
          </span>
        </HoverCard>
      )}
    </li>
  );
}

const toColumns = (insights: Insights, pick: (m: Insights["months"][number]) => Record<string, number>): Column[] =>
  insights.months.map((m) => ({ month: m.month, label: monthName(m.month), year: Number(m.month.slice(0, 4)), values: pick(m) }));

function Delta({ value, percent }: { value: number; percent: string | null | undefined }) {
  const tone = value > 0 ? "text-[#006300] dark:text-[#0ca30c]" : value < 0 ? "text-red-700 dark:text-red-400" : "text-muted";
  return (
    <span className="block text-sm">
      <span className={cx("font-semibold", tone)}>{value > 0 ? "+" : ""}{value}</span>
      {percent !== null && percent !== undefined && <span className="text-muted"> ({Number(percent) > 0 ? "+" : ""}{Number(percent)}%)</span>}
    </span>
  );
}

function HeadcountView({ insights }: { insights: Insights }) {
  const [table, setTable] = useState(false);
  const head: Series = { key: "headcount", label: "Headcount", color: SERIES[0] };
  const adds: Series = { key: "additions", label: "Additions", color: SERIES[0] };
  const terms: Series = { key: "terminations", label: "Terminations", color: SERIES[1] };
  const columns = toColumns(insights, (m) => ({ headcount: m.headcount, additions: m.additions, terminations: m.terminations }));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_190px]">
      <div className="min-w-0">
        {table ? <ChartTable columns={columns} series={[head, adds, terms]} /> : (
          <>
            <MonthColumns columns={columns} series={[head]} tip={(c) => {
              const i = columns.indexOf(c);
              const before = i > 0 ? columns[i - 1].values.headcount : null;
              const change = before === null ? null : c.values.headcount - before;
              return (
                <>
                  <TipRow color={head.color} value={c.values.headcount} label="people" />
                  {change !== null && <span className="block text-muted">{change >= 0 ? "+" : ""}{change}{before ? ` (${((change / before) * 100).toFixed(1)}%)` : ""} on {columns[i - 1].label}</span>}
                  <span className="block text-muted">{plural(c.values.additions, "addition")}, {plural(c.values.terminations, "termination")}</span>
                </>
              );
            }} />
            <div className="mt-3"><DivergingStrip columns={columns} up={adds} down={terms} /></div>
            <div className="mt-2"><Legend series={[adds, terms]} /></div>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href="/reports/headcount" className="font-medium text-brand-ink hover:underline">Headcount report »</Link>
          <Link href="/reports/joiners-leavers" className="font-medium text-brand-ink hover:underline">Additions and terminations report »</Link>
          <button type="button" onClick={() => setTable(!table)} className="text-muted hover:text-ink">{table ? "Show chart" : "Show table"}</button>
        </div>
      </div>
      <dl className="space-y-4 lg:border-l lg:border-line lg:pl-5">
        <div>
          <dt className="text-sm font-semibold text-ink">Total employees</dt>
          <dd className="mt-1 flex items-center gap-2.5 text-muted"><FontAwesomeIcon icon={faUsers} className="text-xl" /><span className="font-display text-[34px] leading-none text-ink">{insights.headcount}</span></dd>
          <dd className="mt-1"><Delta value={insights.change} percent={insights.changePercent} /><span className="text-sm text-muted">Last 12 months</span></dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-sm font-semibold text-ink">Additions</dt>
          <dd className="mt-1 flex items-center gap-2.5"><FontAwesomeIcon icon={faUserPlus} className="text-muted" /><span className="font-display text-2xl text-ink">{insights.additions}</span></dd>
          <dt className="mt-3 text-sm font-semibold text-ink">Terminations</dt>
          <dd className="mt-1 flex items-center gap-2.5"><FontAwesomeIcon icon={faUserMinus} className="text-muted" /><span className="font-display text-2xl text-ink">{insights.terminations}</span></dd>
        </div>
      </dl>
    </div>
  );
}

function TurnoverView({ insights }: { insights: Insights }) {
  const [table, setTable] = useState(false);
  const series: Series[] = [
    { key: "voluntary", label: "Voluntary", color: SERIES[0] },
    { key: "involuntary", label: "Involuntary", color: SERIES[1] },
    { key: "other", label: "Other", color: SERIES[2] },
  ];
  // Each column is the month's turnover rate, split by the share of leavers of each kind.
  const columns = toColumns(insights, (m) => {
    const rate = Number(m.turnoverRate);
    const share = (n: number) => (m.terminations ? (rate * n) / m.terminations : 0);
    return { voluntary: share(m.voluntary), involuntary: share(m.involuntary), other: share(m.other), rate, leavers: m.terminations,
      voluntaryCount: m.voluntary, involuntaryCount: m.involuntary, otherCount: m.other };
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_190px]">
      <div className="min-w-0">
        {table ? (
          <ChartTable columns={columns} format={(n) => (Number.isInteger(n) ? String(n) : `${n.toFixed(1)}%`)}
            series={[{ key: "rate", label: "Turnover", color: "" }, { key: "voluntaryCount", label: "Voluntary", color: "" },
              { key: "involuntaryCount", label: "Involuntary", color: "" }, { key: "otherCount", label: "Other", color: "" }]} />
        ) : (
          <MonthColumns columns={columns} series={series} stacked labelOf={(c) => `${c.values.rate.toFixed(1)}%`} tip={(c) => (
            <>
              <span className="block font-semibold text-ink">{c.values.rate.toFixed(1)}% turnover</span>
              {series.map((s) => <TipRow key={s.key} color={s.color} value={c.values[`${s.key}Count`]} label={s.label.toLowerCase()} />)}
            </>
          )} />
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href="/reports/attrition" className="font-medium text-brand-ink hover:underline">Turnover report »</Link>
          <button type="button" onClick={() => setTable(!table)} className="text-muted hover:text-ink">{table ? "Show chart" : "Show table"}</button>
        </div>
      </div>
      <div className="space-y-4 lg:border-l lg:border-line lg:pl-5">
        <div>
          <p className="text-sm font-semibold text-ink">Last 12 months</p>
          <p className="mt-1 font-display text-[34px] leading-none text-ink">{Number(insights.turnoverRate)}%</p>
          <p className="mt-1 text-sm text-muted">{plural(insights.terminations, "leaver")}</p>
        </div>
        <div className="border-t border-line pt-4"><Legend series={series} /></div>
      </div>
    </div>
  );
}

type PeopleTab = "headcount" | "reports" | "turnover";

export function PeopleWidget({ insights, reports }: { insights: Insights | null | undefined; reports: HomeData["home"]["directReports"] }) {
  const tabs = ([
    insights && { key: "headcount", label: "Headcount", icon: faChartSimple },
    reports.length > 0 && { key: "reports", label: "My direct reports", icon: faSitemap },
    insights && { key: "turnover", label: "Turnover", icon: faArrowsRotate },
  ].filter(Boolean)) as { key: PeopleTab; label: string; icon: IconDefinition }[];
  const [tab, setTab] = useState<PeopleTab>(reports.length ? "reports" : "headcount");
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];
  if (!current) return null;
  return (
    <Widget title={current.label} icon={current.icon}>
      <div className="flex flex-col-reverse gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          {current.key === "headcount" && insights && <HeadcountView insights={insights} />}
          {current.key === "turnover" && insights && <TurnoverView insights={insights} />}
          {current.key === "reports" && (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
              {reports.map((r) => <ReportTile key={r.person.id} report={r} />)}
            </ul>
          )}
        </div>
        {tabs.length > 1 && (
          <div role="tablist" className="flex flex-none gap-1 lg:w-[200px] lg:flex-col">
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={t.key === current.key} onClick={() => setTab(t.key)}
                className={cx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[15px] transition",
                  t.key === current.key ? "bg-brand font-semibold text-white" : "text-ink hover:bg-subtle")}>
                <FontAwesomeIcon icon={t.icon} fixedWidth className="text-[13px]" />{t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

/* --------------------------------------------------------------- Celebrations */

const CONFETTI_COLORS = ["#f2b84b", "#7cc4a4", "#e88aa8", "#8fb4ec", "#b79ce8", "#f08f6c"];

/** Pieces placed from a seed, so a row's confetti does not jump about between renders. */
function confettiPieces(seed: string) {
  let n = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const next = () => (n = (n * 1103515245 + 12345) >>> 0) / 2 ** 32;
  return Array.from({ length: 14 }, (_, i) => ({
    left: `${8 + next() * 84}%`, size: 4 + Math.round(next() * 3), round: next() > 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    style: { "--delay": `${(next() * 2.8).toFixed(2)}s`, "--fall": `${(2.2 + next() * 1.6).toFixed(2)}s`,
      "--drift": `${Math.round(next() * 24 - 12)}px`, "--spin": `${Math.round(180 + next() * 360)}deg` },
  }));
}

/** Confetti drifting over a celebration row. */
function Confetti({ seed }: { seed: string }) {
  const pieces = confettiPieces(seed);
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} className={cx("confetti-piece", p.round && "rounded-full")}
          style={{ left: p.left, width: p.size, height: p.round ? p.size : p.size + 3, background: p.color, ...p.style } as CSSProperties} />
      ))}
    </span>
  );
}

export function CelebrationsWidget({ celebrations }: { celebrations: HomeData["home"]["celebrations"] }) {
  const now = today();
  return (
    <Widget title="Celebrations" icon={faCakeCandles}>
      {celebrations.length ? (
        <ul className="-my-1 space-y-1">
          {celebrations.slice(0, 7).map((c) => (
            <li key={c.kind + c.person.id} className={cx("relative flex items-center gap-3 rounded-lg px-1 py-1.5", c.date === now && "bg-subtle")}>
              <Confetti seed={c.kind + c.person.id} />
              <Link href={`/employees/${c.person.id}`}><Photo name={c.person.fullName} src={c.person.photoUrl} size={40} /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/employees/${c.person.id}`} className="block truncate text-[15px] font-semibold text-ink hover:underline">{c.person.fullName}</Link>
                <p className="text-[13px] text-muted">
                  {longDate(c.date)} – {c.kind === "birthday" ? "Happy birthday!" : plural(c.years ?? 0, "year")}
                </p>
              </div>
              <FontAwesomeIcon icon={c.kind === "birthday" ? faCakeCandles : faAward} className={cx("text-lg", c.date === now ? "text-brand-ink" : "text-muted/70")} />
            </li>
          ))}
        </ul>
      ) : <Empty art="cake" title="No celebrations coming up">Birthdays and work anniversaries in the next 30 days appear here. Add dates of birth to profiles so none are missed.</Empty>}
    </Widget>
  );
}

/* ------------------------------------------------------------------ Who's out */

const WhosOutDocument = graphql(`
  query HomeWhosOut($day: Date!) {
    leaveCalendar(start: $day, end: $day) { absences { requestId status employee { id fullName photoUrl } leaveType { name } } }
  }
`);

export function WhosOutWidget() {
  const [{ data }] = useQuery({ query: WhosOutDocument, variables: { day: today() } });
  const out = (data?.leaveCalendar.absences ?? []).filter((a) => a.status === "APPROVED");
  return (
    <Widget title="Who's out" icon={faPlaneDeparture}>
      {out.length ? <>
        <p className="text-[16px] font-semibold text-brand-ink">{plural(out.length, "person is", "people are")} out today</p>
        <p className="text-sm text-muted">On approved leave</p>
      </> : <Empty art="sun" title="Everyone is in today">No one is on approved leave.</Empty>}
      {out.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {out.map((a) => (
            <li key={a.requestId}>
              <Link href={`/employees/${a.employee.id}`} title={`${a.employee.fullName}${a.leaveType ? ` · ${a.leaveType.name}` : ""}`}>
                <Photo name={a.employee.fullName} src={a.employee.photoUrl} size={56} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/leave/calendar" className="mt-auto pt-4 text-sm font-medium text-brand-ink hover:underline">Full calendar</Link>
    </Widget>
  );
}

/* ------------------------------------------------------------- Company links */

const SaveLinksDocument = graphql(`
  mutation SaveCompanyLinks($links: [CompanyLinkInput!]!) {
    saveCompanyLinks(links: $links) { links { id } errors { field message } }
  }
`);

export function CompanyLinksWidget({ links, canEdit, onSaved }: { links: CompanyLink[]; canEdit: boolean; onSaved: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [all, setAll] = useState(false);
  const limit = 8;
  const shown = all ? links : links.slice(0, limit);
  const groups = new Map<string, CompanyLink[]>();
  for (const l of shown) groups.set(l.group || "Links", [...(groups.get(l.group || "Links") ?? []), l]);
  return (
    <Widget title="Company links" icon={faLink}
      actions={canEdit ? <button type="button" onClick={() => setEditing(true)} className="font-medium text-brand-ink hover:underline">Edit</button> : undefined}>
      {links.length ? (
        <div className="space-y-4">
          {[...groups].map(([group, items]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-brand-ink">{group}</h3>
              <ul className="mt-1.5 space-y-1">
                {items.map((l) => <li key={l.id}><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-ink hover:underline">{l.label}</a></li>)}
              </ul>
            </div>
          ))}
          {links.length > limit && (
            <button type="button" onClick={() => setAll(!all)} className="text-sm text-muted hover:text-ink">{all ? "Fewer links" : `${links.length - limit} more links…`}</button>
          )}
        </div>
      ) : <Empty art="links">{canEdit ? "Add the links people use most: the company website, HMO portal, PFA, IT help." : "No links yet."}</Empty>}
      {editing && <LinksDialog links={links} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved("Links saved."); }} />}
    </Widget>
  );
}

function LinksDialog({ links, onClose, onSaved }: { links: CompanyLink[]; onClose: () => void; onSaved: () => void }) {
  const [, save] = useMutation(SaveLinksDocument);
  const [rows, setRows] = useState(links.length ? links.map(({ group, label, url }) => ({ group, label, url })) : [{ group: "Company", label: "", url: "https://" }]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    const result = await save({ links: rows.filter((r) => r.label.trim() || r.url.trim() !== "https://") });
    setBusy(false);
    const message = errorMessage(result.error) ?? result.data?.saveCompanyLinks.errors[0]?.message;
    if (message) setError(message);
    else onSaved();
  }

  return (
    <Dialog open wide onClose={onClose} title="Company links" description="Shown on everyone's home page, grouped under their heading."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="links-form" busy={busy}>Save links</Button>
      </>}>
      <form id="links-form" onSubmit={submit} noValidate className="space-y-3">
        {error && <ErrorNote error={error} />}
        <div className="hidden grid-cols-[1fr_1.3fr_2fr_72px] gap-2 text-[13px] font-medium text-ink sm:grid"><span>Heading</span><span>Name</span><span>Address</span><span /></div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.3fr_2fr_72px]">
            <Input aria-label="Heading" value={r.group} placeholder="Benefits" onChange={(e) => set(i, { group: e.target.value })} />
            <Input aria-label="Name" value={r.label} placeholder="HMO portal" onChange={(e) => set(i, { label: e.target.value })} />
            <Input aria-label="Address" type="url" value={r.url} onChange={(e) => set(i, { url: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setRows([...rows, { group: rows[rows.length - 1]?.group ?? "", label: "", url: "https://" }])}>Add link</Button>
      </form>
    </Dialog>
  );
}

/* --------------------------------------------------------------------- Welcome */

export function WelcomeWidget({ hires, company }: { hires: HomeData["home"]["newHires"]; company: string }) {
  const now = today();
  const started = hires.filter((h) => h.hireDate <= now);
  const coming = hires.filter((h) => h.hireDate > now);
  const latest = started[0];
  return (
    <Widget title={`Welcome to ${company}`} icon={faIdCard} bodyClassName="items-center justify-center text-center">
      {hires.length ? (
        <>
          <FontAwesomeIcon icon={faHandsClapping} className="text-[34px] text-brand-ink" />
          <p className="mt-3 font-display text-[21px] text-ink">
            {started.length ? `Welcome ${plural(started.length, "new team member")}!` : `${plural(coming.length, "person", "people")} starting soon`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {latest ? `Started ${longDate(latest.hireDate, { weekday: "long", month: "short", day: "numeric" })}` : `First day ${longDate(coming[0].hireDate, { weekday: "long", month: "short", day: "numeric" })}`}
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {(started.length ? started : coming).slice(0, 6).map((h) => (
              <li key={h.person.id}>
                <Link href={`/employees/${h.person.id}`} title={`${h.person.fullName}${h.person.jobTitle ? ` · ${h.person.jobTitle}` : ""}`}>
                  <Photo name={h.person.fullName} src={h.person.photoUrl} size={56} />
                </Link>
              </li>
            ))}
          </ul>
          {started.length > 0 && coming.length > 0 && <p className="mt-3 text-xs text-muted">{plural(coming.length, "more person", "more people")} starting soon</p>}
        </>
      ) : <Empty art="people">No one new in the last 30 days.</Empty>}
    </Widget>
  );
}

/* ------------------------------------------------------------- HR summary cards */

export function BigFigure({ icon, value, label, sub, href }: { icon: IconDefinition; value: number; label: string; sub?: string; href?: string }) {
  const body = (
    <span className="flex flex-col items-center py-3 text-center">
      <span className="flex items-center gap-3">
        <FontAwesomeIcon icon={icon} className="text-[34px] text-muted" />
        <span className="font-display text-[40px] leading-none text-ink">{value}</span>
      </span>
      <span className="mt-1.5 text-[15px] text-ink">{label}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </span>
  );
  return href ? <Link href={href} className="block rounded-xl hover:bg-subtle">{body}</Link> : body;
}

function Row({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-subtle px-4 py-3">
      <FontAwesomeIcon icon={faUserCheck} className="mt-1 text-muted" />
      <div><p className="text-[16px] font-semibold text-ink">{title}</p>{sub && <p className="text-[13px] text-muted">{sub}</p>}</div>
    </div>
  );
}

export function OnboardingWidget({ summary, company }: { summary: NonNullable<Insights["onboarding"]>; company: string }) {
  const [next, ...later] = summary.starting;
  return (
    <Widget title={`Onboarding at ${company}`} icon={faClipboardCheck}>
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-brand-ink">Already started</h3>
          {summary.inProgress ? (
            <Row title={summary.withOverdue ? `${plural(summary.withOverdue, "person has", "people have")} overdue tasks` : "No one has overdue tasks"}
              sub={summary.inProgress - summary.withOverdue ? `${plural(summary.inProgress - summary.withOverdue, "person", "people")} on track` : undefined} />
          ) : <Row title="No one is onboarding" />}
        </div>
        {next && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-brand-ink">Starting {longDate(next.date, { weekday: "long", month: "long", day: "numeric" })}</h3>
            <Row title={next.people.map((p) => p.fullName).join(", ")} sub={next.people[0]?.jobTitle ?? undefined} />
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 text-[13px] text-muted">
        {later.length > 0 ? <span className="flex items-center gap-2"><FontAwesomeIcon icon={faCalendarDay} />{plural(later.reduce((n, g) => n + g.people.length, 0), "more person", "more people")} scheduled to start…</span>
          : <Link href="/settings/checklists" className="font-medium text-brand-ink hover:underline">Onboarding tasks</Link>}
      </div>
    </Widget>
  );
}

export function CertificationsWidget({ certifications }: { certifications: Insights["expiringCertifications"] }) {
  const now = today();
  return (
    <Widget title="Expiring certifications" icon={faGraduationCap}>
      {certifications.length ? (
        <ul className="space-y-2">
          {certifications.slice(0, 4).map((c) => (
            <li key={c.name} className="rounded-xl bg-subtle px-4 py-3">
              <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                <FontAwesomeIcon icon={faUsers} className="text-[11px]" />{plural(c.people, "employee")} ·
                <span className={c.soonest < now ? "text-red-600 dark:text-red-400" : undefined}>{c.soonest < now ? "expired" : "expires"} {formatDate(c.soonest)}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : <Empty>No certifications expire in the next 60 days.</Empty>}
      {certifications.length > 4 && <p className="mt-auto pt-3 text-[13px] text-muted">{plural(certifications.length - 4, "more certification")}…</p>}
    </Widget>
  );
}

export function BreakdownWidget({ title, icon, items, href, empty }: { title: string; icon: IconDefinition; items: { label: string; value: number }[]; href?: string; empty: string }) {
  return (
    <Widget title={title} icon={icon}>
      {items.length ? <BarList items={items} /> : <Empty>{empty}</Empty>}
      {href && <Link href={href} className="mt-auto pt-4 text-sm font-medium text-brand-ink hover:underline">Full report »</Link>}
    </Widget>
  );
}

const HolidaysDocument = graphql(`
  query HomeHolidays($year: Int!, $next: Int!) {
    thisYear: publicHolidays(year: $year) { id name date location { name } }
    nextYear: publicHolidays(year: $next) { id name date location { name } }
  }
`);

export function HolidaysWidget() {
  const year = new Date().getFullYear();
  const [{ data }] = useQuery({ query: HolidaysDocument, variables: { year, next: year + 1 } });
  const now = today();
  const upcoming = [...(data?.thisYear ?? []), ...(data?.nextYear ?? [])].filter((h) => h.date >= now).slice(0, 5);
  return (
    <Widget title="Company holidays" icon={faCalendarDay}>
      {upcoming.length ? (
        <ul className="space-y-3">
          {upcoming.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-subtle text-center leading-none">
                <span>
                  <span className="block text-[10px] font-semibold uppercase text-muted">{longDate(h.date, { month: "short" })}</span>
                  <span className="block font-display text-[17px] text-ink">{Number(h.date.slice(8))}</span>
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-ink">{h.name}</span>
                <span className="block text-[13px] text-muted">{longDate(h.date, { weekday: "long" })}{h.location ? ` · ${h.location.name} only` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : <Empty art="calendar">No public holidays coming up.</Empty>}
    </Widget>
  );
}

/* --------------------------------------------------------------- Widget catalogue */

export const WIDGETS: Record<string, { name: string; icon: IconDefinition }> = {
  time_off: { name: "Time off", icon: faCalendarDays },
  my_stuff: { name: "My stuff", icon: faBoxOpen },
  reminders: { name: "My reminders", icon: faBell },
  happening: { name: "What's happening", icon: faBullhorn },
  people: { name: "Headcount, direct reports and turnover", icon: faChartSimple },
  celebrations: { name: "Celebrations", icon: faCakeCandles },
  whos_out: { name: "Who's out", icon: faPlaneDeparture },
  company_links: { name: "Company links", icon: faLink },
  welcome: { name: "Welcome", icon: faIdCard },
  time_off_used: { name: "Time off used", icon: faCalendarDays },
  pay_raise: { name: "People without a pay raise", icon: faFaceFrown },
  certifications: { name: "Expiring certifications", icon: faGraduationCap },
  location: { name: "Location", icon: faLocationDot },
  onboarding: { name: "Onboarding", icon: faClipboardCheck },
  time_off_requests: { name: "Time off requests", icon: faCalendarDays },
  department: { name: "Department", icon: faBuilding },
  employment_type: { name: "Employment type", icon: faBriefcase },
  gender: { name: "Gender", icon: faVenusMars },
  age: { name: "Age", icon: faPeopleGroup },
  benefit_enrollments: { name: "Benefit enrollments", icon: faHeartPulse },
  holidays: { name: "Company holidays", icon: faCalendarDay },
};
