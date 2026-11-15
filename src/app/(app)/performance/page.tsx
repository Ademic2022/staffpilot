"use client";

import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQuery } from "urql";

import {
  Badge, Button, Card, Checkbox, Dialog, Empty, ErrorNote, Field, IconButton, Input, Loading, Notice, PageHeader, Select, Tabs, Textarea,
} from "@/components/ui";
import { CycleEditor } from "@/components/performance/CycleEditor";
import {
  CYCLE_KINDS, GOAL_STATUS, goalTone, PersonSearch, Progress, REVIEW_STATUS, ratingText, ROLE_LABEL,
} from "@/components/performance/shared";
import { graphql } from "@/gql";
import type { GoalsQuery, MyReviewsQuery, OneOnOnesQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

/* ------------------------------------------------------------------ Goals */

const GoalsDocument = graphql(`
  query Goals($employeeId: ID) {
    goals(employeeId: $employeeId) { ...GoalFields }
    company: goals { ...GoalFields }
    teamGoals { ...GoalFields }
    myReports { id name jobTitle direct }
  }
`);
const AlignableDocument = graphql(`query AlignableGoals($employeeId: ID) { alignableGoals(employeeId: $employeeId) { id title employeeName } }`);
const GoalUpdatesDocument = graphql(`query GoalUpdates($id: ID!) { goal(id: $id) { id updates { id author progress status note createdAt } } }`);
const SaveGoalDocument = graphql(`
  mutation SaveGoal($input: GoalInput!) { saveGoal(input: $input) { goal { ...GoalFields } errors { field message } } }
`);
const CheckInDocument = graphql(`
  mutation CheckInGoal($input: GoalCheckInInput!) { checkInGoal(input: $input) { goal { ...GoalFields } errors { field message } } }
`);
const DeleteGoalDocument = graphql(`mutation DeleteGoal($id: ID!) { deleteGoal(id: $id) }`);

type Goal = GoalsQuery["company"][number];
type Report = GoalsQuery["myReports"][number];

function GoalRow({ goal, onOpen, showOwner }: { goal: Goal; onOpen: () => void; showOwner?: boolean }) {
  const s = GOAL_STATUS[goal.status];
  return (
    <li>
      <button type="button" onClick={onOpen} className="grid w-full gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-subtle/50 sm:grid-cols-[1fr_180px_110px]">
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{goal.title}</span>
          <span className="block truncate text-xs text-muted">
            {[showOwner && (goal.employeeName ?? "Company"), goal.dueDate && `Due ${formatDate(goal.dueDate)}`,
              goal.parentTitle && `Supports “${goal.parentTitle}”`, goal.supporting ? `${goal.supporting} supporting` : null].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="self-center"><Progress value={goal.progress} tone={goalTone(goal.status)} /></span>
        <span className="self-center sm:text-right"><Badge tone={s?.tone ?? "neutral"} dot>{s?.label ?? goal.status}</Badge></span>
      </button>
    </li>
  );
}

function GoalList({ goals, empty, onOpen, showOwner }: { goals: Goal[]; empty: string; onOpen: (g: Goal) => void; showOwner?: boolean }) {
  if (!goals.length) return <p className="px-5 py-4 text-sm text-muted">{empty}</p>;
  return <ul className="divide-y divide-line">{goals.map((g) => <GoalRow key={g.id} goal={g} showOwner={showOwner} onOpen={() => onOpen(g)} />)}</ul>;
}

type KrDraft = { id?: string | null; title: string; startValue: string; targetValue: string; currentValue: string; unit: string };

function GoalEditor({ goal, owner, reports, canCompany, onClose, onSaved }: {
  goal?: Goal; owner: string | null; reports: Report[]; canCompany: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { me } = useSession();
  const [employeeId, setEmployeeId] = useState<string | null>(goal ? goal.employeeId ?? null : owner);
  const [v, setV] = useState({
    title: goal?.title ?? "", description: goal?.description ?? "", startDate: goal?.startDate ?? "", dueDate: goal?.dueDate ?? "",
    parentId: goal?.parentId ?? "",
  });
  const [krs, setKrs] = useState<KrDraft[]>(goal?.keyResults.map((k) => ({
    id: k.id, title: k.title, startValue: String(k.startValue), targetValue: String(k.targetValue), currentValue: String(k.currentValue), unit: k.unit,
  })) ?? []);
  const [{ data: align }] = useQuery({ query: AlignableDocument, variables: { employeeId } });
  const [{ fetching }, save] = useMutation(SaveGoalDocument);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const owners = [
    ...(me?.employee ? [{ id: me.employee.id, name: `${me.employee.fullName} (me)` }] : []),
    ...reports.map((r) => ({ id: r.id, name: r.name })),
  ];
  const submit = async () => {
    const res = await save({ input: {
      id: goal?.id, employeeId, title: v.title, description: v.description, startDate: v.startDate || null, dueDate: v.dueDate || null,
      parentId: v.parentId || null,
      keyResults: krs.filter((k) => k.title.trim()).map((k) => ({ id: k.id, title: k.title, startValue: k.startValue || "0",
        targetValue: k.targetValue || "0", currentValue: k.currentValue || "0", unit: k.unit })),
    } });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Something went wrong." });
    const errs = res.data?.saveGoal.errors ?? [];
    if (errs.length) return setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    onSaved();
  };
  const choices = (align?.alignableGoals ?? []).filter((g) => g.id !== goal?.id);
  return (
    <Dialog open onClose={onClose} wide title={goal ? "Edit goal" : "New goal"} footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button busy={fetching} onClick={submit}>Save goal</Button>
    </>}>
      <div className="grid gap-4">
        {errors[""] && <ErrorNote error={errors[""]} />}
        {!goal && (owners.length > 1 || canCompany) && (
          <Field label="Whose goal">
            <Select value={employeeId ?? ""} onChange={(e) => { setEmployeeId(e.target.value || null); setV({ ...v, parentId: "" }); }}>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              {canCompany && <option value="">Company goal</option>}
            </Select>
          </Field>
        )}
        <Field label="Goal" error={errors.title}><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="What will be achieved" /></Field>
        <Field label="Details" optional><Textarea rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start" optional><Input type="date" value={v.startDate} onChange={(e) => setV({ ...v, startDate: e.target.value })} /></Field>
          <Field label="Due" optional error={errors.dueDate}><Input type="date" value={v.dueDate} onChange={(e) => setV({ ...v, dueDate: e.target.value })} /></Field>
        </div>
        <Field label="Supports" optional hint="Line this goal up with a company goal or one of the manager's goals." error={errors.parent}>
          <Select value={v.parentId} onChange={(e) => setV({ ...v, parentId: e.target.value })}>
            <option value="">Nothing</option>
            {choices.map((g) => <option key={g.id} value={g.id}>{g.title}{g.employeeName ? ` (${g.employeeName})` : " (company)"}</option>)}
          </Select>
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Key results</p>
              <p className="text-xs text-muted">Measurable results. Progress is worked out from them; without any, you set it by hand.</p>
            </div>
            <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPlus} />} disabled={krs.length >= 10}
              onClick={() => setKrs([...krs, { title: "", startValue: "0", targetValue: "100", currentValue: "0", unit: "" }])}>Add</Button>
          </div>
          {errors.keyResults && <ErrorNote error={errors.keyResults} />}
          <div className="grid gap-2">
            {krs.map((k, i) => {
              const set = (patch: Partial<KrDraft>) => setKrs(krs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_80px_80px_80px_70px_auto]">
                  <Input aria-label="Key result" placeholder="Key result" value={k.title} onChange={(e) => set({ title: e.target.value })} className="col-span-1" />
                  <IconButton label="Remove key result" className="sm:order-last" onClick={() => setKrs(krs.filter((_, j) => j !== i))}>
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </IconButton>
                  <Input aria-label="Start" title="Start" inputMode="decimal" value={k.startValue} onChange={(e) => set({ startValue: e.target.value })} />
                  <Input aria-label="Now" title="Now" inputMode="decimal" value={k.currentValue} onChange={(e) => set({ currentValue: e.target.value })} />
                  <Input aria-label="Target" title="Target" inputMode="decimal" value={k.targetValue} onChange={(e) => set({ targetValue: e.target.value })} />
                  <Input aria-label="Unit" placeholder="Unit" value={k.unit} onChange={(e) => set({ unit: e.target.value })} />
                </div>
              );
            })}
            {krs.length > 0 && <p className="text-xs text-muted">Each row: start, now, target and unit (for example %, ₦ or customers).</p>}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function GoalPanel({ goal, onClose, onEdit, onChanged }: { goal: Goal; onClose: () => void; onEdit: () => void; onChanged: () => void }) {
  const [{ data }, reload] = useQuery({ query: GoalUpdatesDocument, variables: { id: goal.id }, requestPolicy: "cache-and-network" });
  const [{ fetching }, checkIn] = useMutation(CheckInDocument);
  const [, remove] = useMutation(DeleteGoalDocument);
  const [status, setStatus] = useState(goal.status);
  const [progress, setProgress] = useState(String(goal.progress));
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(goal.keyResults.map((k) => [k.id, String(k.currentValue)])));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const submit = async () => {
    const res = await checkIn({ input: {
      id: goal.id, status, note, progress: goal.keyResults.length ? null : Number(progress),
      values: goal.keyResults.map((k) => ({ id: k.id, value: values[k.id] || "0" })),
    } });
    const msg = res.error ? errorMessage(res.error) : res.data?.checkInGoal.errors[0]?.message;
    if (msg) return setError(msg);
    setNote("");
    reload({ requestPolicy: "network-only" });
    onChanged();
  };
  return (
    <Dialog open onClose={onClose} wide title={goal.title} description={<>
      {goal.employeeName ?? "Company goal"}{goal.dueDate && <> · due {formatDate(goal.dueDate)}</>}{goal.parentTitle && <> · supports “{goal.parentTitle}”</>}
    </>} footer={goal.canEdit ? <>
      {confirming ? <>
        <span className="mr-auto self-center text-sm text-muted">Delete this goal and its check-ins?</span>
        <Button variant="secondary" onClick={() => setConfirming(false)}>Keep</Button>
        <Button variant="danger" onClick={async () => { await remove({ id: goal.id }); onChanged(); onClose(); }}>Delete</Button>
      </> : <>
        <Button variant="ghost" className="sm:mr-auto" onClick={() => setConfirming(true)}>Delete</Button>
        <Button variant="secondary" icon={<FontAwesomeIcon icon={faPen} />} onClick={onEdit}>Edit</Button>
        <Button busy={fetching} onClick={submit}>Save check-in</Button>
      </>}
    </> : undefined}>
      <div className="grid gap-5">
        {goal.description && <p className="whitespace-pre-wrap text-sm text-ink">{goal.description}</p>}
        <Progress value={goal.progress} tone={goalTone(goal.status)} />
        {goal.keyResults.length > 0 && (
          <ul className="grid gap-2">
            {goal.keyResults.map((k) => (
              <li key={k.id} className="grid items-center gap-2 rounded-lg border border-line px-3 py-2 sm:grid-cols-[1fr_120px_140px]">
                <span className="text-sm text-ink">{k.title}<span className="block text-xs text-muted">{String(k.startValue)} → {String(k.targetValue)} {k.unit}</span></span>
                <Progress value={k.progress} />
                {goal.canEdit
                  ? <Input aria-label={`${k.title} now`} inputMode="decimal" value={values[k.id] ?? ""} onChange={(e) => setValues({ ...values, [k.id]: e.target.value })} />
                  : <span className="text-right text-sm tabular-nums">{String(k.currentValue)} {k.unit}</span>}
              </li>
            ))}
          </ul>
        )}
        {goal.canEdit && (
          <div className="grid gap-4 rounded-lg bg-subtle/60 p-4 sm:grid-cols-2">
            {error && <div className="sm:col-span-2"><ErrorNote error={error} /></div>}
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(GOAL_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </Select>
            </Field>
            {!goal.keyResults.length && (
              <Field label="Progress (%)"><Input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} /></Field>
            )}
            <div className="sm:col-span-2"><Field label="Check-in note" optional><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved, what is in the way" /></Field></div>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Check-ins</h3>
          {data?.goal.updates.length ? (
            <ul className="grid gap-2">
              {data.goal.updates.map((u) => (
                <li key={u.id} className="text-sm">
                  <span className="text-ink">{u.author ?? "Someone"}</span> <span className="text-muted">· {formatDate(u.createdAt)} · {u.progress}% · {GOAL_STATUS[u.status]?.label}</span>
                  {u.note && <p className="whitespace-pre-wrap text-muted">{u.note}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No check-ins yet.</p>}
        </div>
      </div>
    </Dialog>
  );
}

function Goals() {
  const { me, can } = useSession();
  const myId = me?.employee?.id ?? null;
  const [{ data, error }, reload] = useQuery({ query: GoalsDocument, variables: { employeeId: myId }, requestPolicy: "cache-and-network" });
  const [open, setOpen] = useState<Goal | null>(null);
  const [editing, setEditing] = useState<{ goal?: Goal; owner: string | null } | null>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const hr = can(PERMS.performanceManage);
  const refresh = () => reload({ requestPolicy: "network-only" });
  // goals(employeeId: null) returns company goals, so "mine" is only meaningful with an employee record.
  const mine = myId ? data.goals : [];
  const live = (g: Goal) => g.status !== "cancelled";
  return (
    <div className="grid gap-5">
      {myId && (
        <Card flush title="My goals" description="What you are working towards, and how it is going."
          actions={<Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ owner: myId })}>New goal</Button>}>
          {mine.length ? <GoalList goals={mine.filter(live)} empty="" onOpen={setOpen} /> : (
            <Empty title="No goals yet">Set a goal, and line it up with a company goal so everyone can see how the work fits together.</Empty>
          )}
        </Card>
      )}
      {(data.teamGoals.length > 0 || data.myReports.length > 0) && (
        <Card flush title="My team's goals"
          actions={data.myReports.length ? <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setEditing({ owner: data.myReports[0].id })}>Set a goal for someone</Button> : undefined}>
          <GoalList goals={data.teamGoals} showOwner empty="No one in your team has a goal yet." onOpen={setOpen} />
        </Card>
      )}
      <Card flush title="Company goals" description="The few things the whole company is aiming for."
        actions={hr ? <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing({ owner: null })}>Company goal</Button> : undefined}>
        <GoalList goals={data.company.filter(live)} empty="HR has not set company goals yet." onOpen={setOpen} />
      </Card>
      {open && !editing && (
        <GoalPanel goal={open} onClose={() => setOpen(null)} onEdit={() => setEditing({ goal: open, owner: open.employeeId ?? null })}
          onChanged={() => { refresh(); setOpen(null); }} />
      )}
      {editing && (
        <GoalEditor goal={editing.goal} owner={editing.owner} reports={data.myReports} canCompany={hr}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setOpen(null); refresh(); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Reviews */

const MyReviewsDocument = graphql(`
  query MyReviews { myReviews { ...ReviewRowFields } teamReviews { ...ReviewRowFields } }
`);

type ReviewRow = MyReviewsQuery["myReviews"][number];

function ReviewLine({ r, title, meta }: { r: ReviewRow; title: string; meta: string }) {
  const s = REVIEW_STATUS[r.status];
  return (
    <li>
      <Link href={`/performance/reviews/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-subtle/50">
        <span className="min-w-0">
          <span className="block font-medium text-ink">{title}</span>
          <span className="block text-xs text-muted">{meta}</span>
        </span>
        <span className="flex items-center gap-2">
          {r.overallRating ? <span className="text-sm text-muted">{ratingText(r.scale, r.overallRating)}</span> : null}
          <Badge tone={s?.tone ?? "neutral"} dot>{s?.label ?? r.status}</Badge>
        </span>
      </Link>
    </li>
  );
}

function Reviews() {
  const { me } = useSession();
  const [{ data, error }] = useQuery({ query: MyReviewsDocument, requestPolicy: "cache-and-network" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const todo = data.myReviews.filter((r) => r.myRole && !r.myResponseDone && r.cycleStatus === "active");
  const own = data.myReviews.filter((r) => r.employeeName === me?.employee?.fullName && (r.myRole === "self" || !r.myRole));
  const written = data.myReviews.filter((r) => r.myRole && r.myRole !== "self" && r.myResponseDone);
  const title = (r: ReviewRow) => (r.myRole === "self" ? "Your self review" : r.myRole === "peer" ? `Peer review of ${r.employeeName}` : `Review ${r.employeeName}`);
  return (
    <div className="grid gap-5">
      <Card flush title="To do" description="Reviews you have been asked to write.">
        {todo.length ? (
          <ul className="divide-y divide-line">
            {todo.map((r) => <ReviewLine key={`${r.id}-${r.myRole}`} r={r} title={title(r)}
              meta={[r.cycleName, ROLE_LABEL[r.myRole ?? ""], r.due && `due ${formatDate(r.due)}`].filter(Boolean).join(" · ")} />)}
          </ul>
        ) : <p className="px-5 py-4 text-sm text-muted">Nothing to write right now.</p>}
      </Card>
      {own.length > 0 && (
        <Card flush title="My reviews">
          <ul className="divide-y divide-line">
            {own.map((r) => <ReviewLine key={r.id} r={r} title={r.cycleName} meta={r.managerName ? `Reviewer: ${r.managerName}` : ""} />)}
          </ul>
        </Card>
      )}
      {data.teamReviews.length > 0 && (
        <Card flush title="My team" description="Everyone below you in the reporting line.">
          <ul className="divide-y divide-line">
            {data.teamReviews.map((r) => <ReviewLine key={r.id} r={r} title={r.employeeName}
              meta={[r.cycleName, r.department, r.managerName && `reviewer ${r.managerName}`].filter(Boolean).join(" · ")} />)}
          </ul>
        </Card>
      )}
      {written.length > 0 && (
        <Card flush title="Written by you">
          <ul className="divide-y divide-line">
            {written.map((r) => <ReviewLine key={`${r.id}-${r.myRole}`} r={r} title={title(r)} meta={r.cycleName} />)}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Feedback */

const FeedbackDocument = graphql(`
  query Feedback($employeeId: ID) {
    feedback(employeeId: $employeeId) { id giverName recipientId recipientName body private mine createdAt }
    myReports { id name direct }
  }
`);
const GiveFeedbackDocument = graphql(`
  mutation GiveFeedback($recipientId: ID!, $body: String!, $private: Boolean) {
    giveFeedback(recipientId: $recipientId, body: $body, private: $private) { feedback { id } errors { field message } }
  }
`);
const DeleteFeedbackDocument = graphql(`mutation DeleteFeedback($id: ID!) { deleteFeedback(id: $id) }`);

function Feedback() {
  const { me } = useSession();
  const [about, setAbout] = useState<string>("");
  const [{ data, error }, reload] = useQuery({ query: FeedbackDocument, variables: { employeeId: about || null }, requestPolicy: "cache-and-network" });
  const [{ fetching }, give] = useMutation(GiveFeedbackDocument);
  const [, remove] = useMutation(DeleteFeedbackDocument);
  const [to, setTo] = useState<{ id: string; name: string } | null>(null);
  const [body, setBody] = useState("");
  const [priv, setPriv] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const send = async () => {
    if (!to) return;
    const res = await give({ recipientId: to.id, body, private: priv });
    const msg = res.error ? errorMessage(res.error) : res.data?.giveFeedback.errors[0]?.message;
    if (msg) return setMessage({ ok: false, text: msg });
    setMessage({ ok: true, text: priv ? `Sent privately to ${to.name}'s manager.` : `Sent to ${to.name}.` });
    setTo(null); setBody(""); setPriv(false);
    reload({ requestPolicy: "network-only" });
  };
  const received = data.feedback.filter((f) => !f.mine && f.recipientId === me?.employee?.id);
  const given = data.feedback.filter((f) => f.mine);
  const list = about ? data.feedback : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card title="Give feedback" description="Praise good work or suggest what to do differently, at any time.">
        <div className="grid gap-4">
          {message && <Notice tone={message.ok ? "success" : "error"}>{message.text}</Notice>}
          <Field label="To">
            {to ? (
              <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                <span className="text-ink">{to.name}</span>
                <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setTo(null)}>Change</button>
              </div>
            ) : <PersonSearch onPick={setTo} exclude={me?.employee ? [me.employee.id] : []} />}
          </Field>
          <Field label="Feedback"><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          <Checkbox checked={priv} onChange={setPriv} label="Only for their manager"
            description="They will not see it; their managers and HR will." />
          <div><Button busy={fetching} disabled={!to || !body.trim()} onClick={send}>Send feedback</Button></div>
        </div>
      </Card>
      <div className="grid content-start gap-5">
        {data.myReports.length > 0 && (
          <Field label="Show feedback about">
            <Select value={about} onChange={(e) => setAbout(e.target.value)}>
              <option value="">Me</option>
              {data.myReports.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
        )}
        {list ? <FeedbackList title={`About ${data.myReports.find((r) => r.id === about)?.name ?? ""}`} items={list} showRecipient={false} onDelete={undefined} /> : <>
          <FeedbackList title="Received" items={received} showRecipient={false} />
          <FeedbackList title="Given" items={given} showRecipient onDelete={async (id) => { await remove({ id }); reload({ requestPolicy: "network-only" }); }} />
        </>}
      </div>
    </div>
  );
}

type FeedbackItem = { id: string; giverName: string; recipientName: string; body: string; private: boolean; mine: boolean; createdAt: string };

function FeedbackList({ title, items, showRecipient, onDelete }: { title: string; items: FeedbackItem[]; showRecipient: boolean; onDelete?: (id: string) => void }) {
  return (
    <Card flush title={title}>
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((f) => (
            <li key={f.id} className="flex gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  {showRecipient ? `To ${f.recipientName}` : `From ${f.giverName}`} · {formatDate(f.createdAt)}
                  {f.private && <> · <Badge tone="neutral">Manager only</Badge></>}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{f.body}</p>
              </div>
              {onDelete && f.mine && (
                <IconButton label="Delete feedback" onClick={() => onDelete(f.id)}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="px-5 py-4 text-sm text-muted">Nothing yet.</p>}
    </Card>
  );
}

/* ------------------------------------------------------------------ One-to-ones */

const OneOnOnesDocument = graphql(`
  query OneOnOnes { oneOnOnes { id managerId managerName employeeId employeeName date agenda notes privateNotes actionItems myRole } myReports { id name direct } }
`);
const SaveOneOnOneDocument = graphql(`
  mutation SaveOneOnOne($input: OneOnOneInput!) { saveOneOnOne(input: $input) { oneOnOne { id } errors { field message } } }
`);
const DeleteOneOnOneDocument = graphql(`mutation DeleteOneOnOne($id: ID!) { deleteOneOnOne(id: $id) }`);

type Meeting = OneOnOnesQuery["oneOnOnes"][number];
type Item = { text: string; done: boolean; owner: "manager" | "employee" };

function MeetingEditor({ meeting, reports, onClose, onSaved }: {
  meeting?: Meeting; reports: OneOnOnesQuery["myReports"]; onClose: () => void; onSaved: () => void;
}) {
  const manager = !meeting || meeting.myRole === "manager";
  const [employeeId, setEmployeeId] = useState(meeting?.employeeId ?? reports[0]?.id ?? "");
  const [v, setV] = useState({ date: meeting?.date ?? new Date().toISOString().slice(0, 10), agenda: meeting?.agenda ?? "", notes: meeting?.notes ?? "",
    privateNotes: meeting?.privateNotes ?? "" });
  const [items, setItems] = useState<Item[]>((meeting?.actionItems as Item[] | undefined) ?? []);
  const [{ fetching }, save] = useMutation(SaveOneOnOneDocument);
  const [, remove] = useMutation(DeleteOneOnOneDocument);
  const [error, setError] = useState<string>();
  const submit = async () => {
    const res = await save({ input: { id: meeting?.id, employeeId: meeting ? null : employeeId, date: v.date, agenda: v.agenda, notes: v.notes,
      privateNotes: manager ? v.privateNotes : null, actionItems: items.filter((i) => i.text.trim()) } });
    const msg = res.error ? errorMessage(res.error) : res.data?.saveOneOnOne.errors[0]?.message;
    if (msg) return setError(msg);
    onSaved();
  };
  const other = meeting ? (meeting.myRole === "manager" ? meeting.employeeName : meeting.managerName) : null;
  return (
    <Dialog open onClose={onClose} wide title={other ? `One-to-one with ${other}` : "New one-to-one"} footer={<>
      {meeting && manager && <Button variant="ghost" className="sm:mr-auto" onClick={async () => { await remove({ id: meeting.id }); onSaved(); }}>Delete</Button>}
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button busy={fetching} onClick={submit}>Save</Button>
    </>}>
      <div className="grid gap-4">
        {error && <ErrorNote error={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {!meeting && (
            <Field label="With">
              <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Date"><Input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
        </div>
        <Field label="Agenda" hint="Both of you can add to it."><Textarea rows={3} value={v.agenda} onChange={(e) => setV({ ...v, agenda: e.target.value })} /></Field>
        <Field label="Shared notes"><Textarea rows={4} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} /></Field>
        {manager && (
          <Field label="Private notes" hint="Only you see these."><Textarea rows={3} value={v.privateNotes} onChange={(e) => setV({ ...v, privateNotes: e.target.value })} /></Field>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Action items</p>
            <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPlus} />}
              onClick={() => setItems([...items, { text: "", done: false, owner: "employee" }])}>Add</Button>
          </div>
          <ul className="grid gap-2">
            {items.map((it, i) => {
              const set = (patch: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <li key={i} className="flex items-center gap-2">
                  <input type="checkbox" aria-label="Done" checked={it.done} onChange={(e) => set({ done: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
                  <Input aria-label="Action" value={it.text} onChange={(e) => set({ text: e.target.value })} className="flex-1" />
                  <Select aria-label="Owner" value={it.owner} onChange={(e) => set({ owner: e.target.value as Item["owner"] })} className="w-32">
                    <option value="employee">{meeting?.employeeName.split(" ")[0] ?? "Employee"}</option>
                    <option value="manager">{meeting?.managerName.split(" ")[0] ?? "Manager"}</option>
                  </Select>
                  <IconButton label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

function OneOnOnes() {
  const [{ data, error }, reload] = useQuery({ query: OneOnOnesDocument, requestPolicy: "cache-and-network" });
  const [editing, setEditing] = useState<Meeting | "new" | null>(null);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.oneOnOnes.filter((m) => m.date >= today).reverse();
  const past = data.oneOnOnes.filter((m) => m.date < today);
  const row = (m: Meeting) => {
    const items = (m.actionItems as Item[]) ?? [];
    const open = items.filter((i) => !i.done).length;
    return (
      <li key={m.id}>
        <button type="button" onClick={() => setEditing(m)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3 text-left hover:bg-subtle/50">
          <span>
            <span className="block font-medium text-ink">{m.myRole === "manager" ? m.employeeName : m.managerName}</span>
            <span className="block text-xs text-muted">{formatDate(m.date)}{m.agenda && ` · ${m.agenda.split("\n")[0].slice(0, 80)}`}</span>
          </span>
          {open > 0 && <Badge tone="warn">{open} open action{open === 1 ? "" : "s"}</Badge>}
        </button>
      </li>
    );
  };
  return (
    <div className="grid gap-5">
      <Card flush title="Coming up" actions={data.myReports.length ? (
        <Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing("new")}>New one-to-one</Button>) : undefined}>
        {upcoming.length ? <ul className="divide-y divide-line">{upcoming.map(row)}</ul>
          : <p className="px-5 py-4 text-sm text-muted">{data.myReports.length ? "Plan a one-to-one with someone in your team." : "Your manager has not planned a one-to-one yet."}</p>}
      </Card>
      {past.length > 0 && <Card flush title="Earlier"><ul className="divide-y divide-line">{past.map(row)}</ul></Card>}
      {editing && (
        <MeetingEditor meeting={editing === "new" ? undefined : editing} reports={data.myReports}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ requestPolicy: "network-only" }); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Cycles (HR) */

const CyclesDocument = graphql(`
  query ReviewCycles {
    reviewCycles { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds
      people selfDone managerDone shared }
    reviewTemplates { id name isActive }
    departments { id name }
  }
`);
function Cycles() {
  const router = useRouter();
  const [{ data, error }] = useQuery({ query: CyclesDocument, requestPolicy: "cache-and-network" });
  const [creating, setCreating] = useState(false);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const tone = { draft: "neutral", active: "brand", closed: "good" } as const;
  return (
    <>
      <Card flush title="Review cycles" description="Annual, mid-year, quarterly or probation reviews for everyone or a group."
        actions={<Button size="sm" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreating(true)}>New cycle</Button>}>
        {data.reviewCycles.length ? (
          <ul className="divide-y divide-line">
            {data.reviewCycles.map((c) => (
              <li key={c.id}>
                <Link href={`/performance/cycles/${c.id}`} className="grid gap-2 px-5 py-3 hover:bg-subtle/50 sm:grid-cols-[1fr_220px_110px] sm:items-center">
                  <span>
                    <span className="block font-medium text-ink">{c.name}</span>
                    <span className="block text-xs text-muted">{CYCLE_KINDS[c.kind]} · {formatDate(c.periodStart)} to {formatDate(c.periodEnd)} · {c.people} people</span>
                  </span>
                  <span>{c.status !== "draft" && <Progress value={c.people ? Math.round((c.managerDone * 100) / c.people) : 0} />}
                    {c.status !== "draft" && <span className="text-xs text-muted">{c.managerDone} of {c.people} manager reviews done</span>}</span>
                  <span className="sm:text-right"><Badge tone={tone[c.status as keyof typeof tone] ?? "neutral"} dot>
                    {c.status === "active" ? "In progress" : c.status === "draft" ? "Draft" : "Closed"}</Badge></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty title="No review cycles yet">Start one when it is time for reviews. Questions come from the templates in Settings → Performance.</Empty>}
      </Card>
      {creating && <CycleEditor templates={data.reviewTemplates} departments={data.departments} onClose={() => setCreating(false)}
        onSaved={(id) => router.push(`/performance/cycles/${id}`)} />}
    </>
  );
}

/* ------------------------------------------------------------------ Page */

type Tab = "goals" | "reviews" | "feedback" | "one_on_ones" | "cycles";

function Performance() {
  const { can, me } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hr = can(PERMS.performanceManage);
  const tabs: { key: Tab; label: string }[] = [
    { key: "goals", label: "Goals" }, { key: "reviews", label: "Reviews" },
    ...(me?.employee ? [{ key: "feedback" as const, label: "Feedback" }, { key: "one_on_ones" as const, label: "One-to-ones" }] : []),
    ...(hr ? [{ key: "cycles" as const, label: "Review cycles" }] : []),
  ];
  const asked = params.get("tab") as Tab | null;
  const tab = tabs.some((t) => t.key === asked) ? asked! : tabs[0].key;
  return (
    <>
      <PageHeader title="Performance" subtitle="Goals, reviews, feedback and one-to-ones." />
      <Tabs value={tab} onChange={(t) => router.replace(`${pathname}?tab=${t}`)} tabs={tabs} />
      {tab === "goals" ? <Goals /> : tab === "reviews" ? <Reviews /> : tab === "feedback" ? <Feedback /> : tab === "one_on_ones" ? <OneOnOnes /> : <Cycles />}
    </>
  );
}

export default function PerformancePage() {
  return <Suspense fallback={<Loading shape="list" />}><Performance /></Suspense>;
}
