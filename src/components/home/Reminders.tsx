"use client";

import { faBell, faCheck, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { Empty, Widget } from "@/components/home/Widgets";
import { Button, Dialog, ErrorNote, Field, IconButton, Input, cx } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { today } from "@/lib/forms";

const MyRemindersDocument = graphql(`
  query MyReminders($employeeId: ID) {
    myReminders(employeeId: $employeeId) { id text dueOn doneAt employee { id fullName } }
  }
`);
const CreateReminderDocument = graphql(`
  mutation CreateReminder($input: ReminderInput!) { createReminder(input: $input) { reminder { id } errors { field message } } }
`);
const SnoozeReminderDocument = graphql(`
  mutation SnoozeReminder($id: ID!, $dueOn: Date) { updateReminder(id: $id, dueOn: $dueOn) { reminder { id dueOn } errors { message } } }
`);
const CompleteReminderDocument = graphql(`
  mutation CompleteReminder($id: ID!, $done: Boolean!) { completeReminder(id: $id, done: $done) { reminder { id doneAt } errors { message } } }
`);
const DeleteReminderDocument = graphql(`
  mutation DeleteReminder($id: ID!) { deleteReminder(id: $id) }
`);

/** A date `days` from today, as yyyy-mm-dd in the person's own time zone. */
export function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const QUICK_DATES: [string, number][] = [["Tomorrow", 1], ["In 3 days", 3], ["Next week", 7], ["In a month", 30]];

/** Pick a day: quick choices, or any date. */
export function DayPicker({ value, onChange }: { value: string; onChange: (day: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_DATES.map(([label, days]) => (
          <button key={label} type="button" onClick={() => onChange(inDays(days))}
            className={cx("rounded-full border px-3 py-1 text-sm", value === inDays(days) ? "border-brand bg-brand/10 font-medium text-brand-ink" : "border-line text-ink hover:bg-subtle")}>
            {label}
          </button>
        ))}
      </div>
      <Input type="date" value={value} min={today()} onChange={(e) => onChange(e.target.value)} className="max-w-48" aria-label="Date" />
    </div>
  );
}

/** Set a private reminder, optionally about one person. */
export function ReminderDialog({ employee, onClose, onSaved }: {
  employee?: { id: string; name: string } | null; onClose: () => void; onSaved: () => void;
}) {
  const [, create] = useMutation(CreateReminderDocument);
  const [text, setText] = useState("");
  const [day, setDay] = useState(inDays(7));
  const [problem, setProblem] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await create({ input: { text, dueOn: day, employeeId: employee?.id ?? null } });
    setBusy(false);
    const failure = errorMessage(r.error) ?? r.data?.createReminder.errors[0]?.message;
    if (failure) return setProblem(failure);
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} title={employee ? `Remind me about ${employee.name}` : "New reminder"}
      description="Only you see it. On the day, it appears under the bell and you get an email."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="reminder-form" busy={busy} disabled={!text.trim() || !day}>Set reminder</Button>
      </>}>
      <form id="reminder-form" onSubmit={submit} className="space-y-4">
        {problem && <ErrorNote error={problem} />}
        <Field label="Remind me to">
          <Input value={text} maxLength={255} autoFocus onChange={(e) => setText(e.target.value)}
            placeholder={employee ? "End probation review, collect laptop…" : "Send the pension schedule, renew the HMO…"} />
        </Field>
        <Field label="On"><DayPicker value={day} onChange={setDay} /></Field>
      </form>
    </Dialog>
  );
}

function when(due: string) {
  const now = today();
  if (due < now) return { text: `Overdue · ${formatDate(due)}`, tone: "text-red-600 dark:text-red-400" };
  if (due === now) return { text: "Today", tone: "font-semibold text-brand-ink" };
  if (due === inDays(1)) return { text: "Tomorrow", tone: "text-muted" };
  return { text: formatDate(due), tone: "text-muted" };
}

/** Your reminders, soonest first. Used on Home, and on a profile for reminders about that person. */
export function ReminderList({ employeeId, onAdd, limit = 6 }: { employeeId?: string; onAdd?: () => void; limit?: number }) {
  const [{ data, error }, reload] = useQuery({ query: MyRemindersDocument, variables: { employeeId: employeeId ?? null }, requestPolicy: "cache-and-network" });
  const [, snooze] = useMutation(SnoozeReminderDocument);
  const [, complete] = useMutation(CompleteReminderDocument);
  const [, remove] = useMutation(DeleteReminderDocument);
  const [all, setAll] = useState(false);
  const refresh = () => reload({ requestPolicy: "network-only" });
  const items = data?.myReminders ?? [];
  if (error && !data) return <ErrorNote error={errorMessage(error)} />;
  if (!data) {
    return (
      <div className="space-y-3 py-1" aria-busy="true" aria-label="Loading reminders">
        {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-subtle motion-reduce:animate-none" />)}
      </div>
    );
  }
  if (!items.length) {
    return (
      <Empty art="bell" title="No reminders yet" action={onAdd ? <Button size="sm" variant="secondary" className="rounded-full" onClick={onAdd}>Add a reminder</Button> : undefined}>
        {employeeId ? "Set one to follow up with this person on a day you choose." : "Set yourself a reminder for a follow-up, a renewal or a deadline. Only you see them."}
      </Empty>
    );
  }
  const shown = all ? items : items.slice(0, limit);
  return (
    <div>
      <ul className="-my-1 divide-y divide-line">
        {shown.map((r) => {
          const w = when(r.dueOn);
          return (
            <li key={r.id} className="group flex items-start gap-3 py-2.5">
              <button type="button" aria-label={`Mark "${r.text}" done`} title="Done"
                onClick={async () => { await complete({ id: r.id, done: true }); refresh(); }}
                className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border-2 border-line-strong text-transparent transition hover:border-brand hover:text-brand-ink">
                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug text-ink">{r.text}</p>
                <p className="mt-0.5 text-[13px]">
                  <span className={w.tone}>{w.text}</span>
                  {r.employee && !employeeId && <> · <Link href={`/employees/${r.employee.id}`} className="text-muted hover:text-brand-ink hover:underline">{r.employee.fullName}</Link></>}
                </p>
              </div>
              <div className="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-lg:opacity-100">
                <button type="button" onClick={async () => { await snooze({ id: r.id, dueOn: inDays(r.dueOn < today() ? 1 : 7) }); refresh(); }}
                  className="rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:bg-subtle hover:text-ink" title="Move it later">
                  {r.dueOn < today() ? "Tomorrow" : "+1 week"}
                </button>
                <IconButton label="Delete reminder" onClick={async () => { await remove({ id: r.id }); refresh(); }}>
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </IconButton>
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 text-sm font-medium text-brand-ink hover:underline">
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}

/** On a profile: your own reminders about this person, when you have any. */
export function PersonReminders({ employeeId, name, onAdd }: { employeeId: string; name: string; onAdd: () => void }) {
  const [{ data }] = useQuery({ query: MyRemindersDocument, variables: { employeeId }, requestPolicy: "cache-and-network" });
  if (!data?.myReminders.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <FontAwesomeIcon icon={faBell} className="text-brand-ink" /> Your reminders about {name}
        </h2>
        <button type="button" onClick={onAdd} className="text-sm font-medium text-brand-ink hover:underline">Add</button>
      </div>
      <ReminderList employeeId={employeeId} limit={3} />
      <p className="mt-2 text-xs text-muted">Only you see these.</p>
    </section>
  );
}

/** The Home widget. */
export function RemindersWidget() {
  const [adding, setAdding] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <Widget title="My reminders" icon={faBell}
      actions={<button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 font-medium text-brand-ink hover:underline">
        <FontAwesomeIcon icon={faPlus} className="text-xs" /> Add</button>}>
      <ReminderList key={key} onAdd={() => setAdding(true)} />
      {adding && <ReminderDialog onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setKey((k) => k + 1); }} />}
    </Widget>
  );
}
