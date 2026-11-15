"use client";

import { faArrowDown, faArrowUp, faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { type Question, ROLE_LABEL } from "@/components/performance/shared";
import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { ReviewTemplatesQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const TemplatesDocument = graphql(`query ReviewTemplates { reviewTemplates { id name questions scale isActive cycles } }`);
const SaveDocument = graphql(`
  mutation SaveReviewTemplate($input: ReviewTemplateInput!) { saveReviewTemplate(input: $input) { template { id } errors { field message } } }
`);
const DeleteDocument = graphql(`mutation DeleteReviewTemplate($id: ID!) { deleteReviewTemplate(id: $id) }`);

type Template = ReviewTemplatesQuery["reviewTemplates"][number];
const DEFAULT_SCALE = ["Needs improvement", "Developing", "Meets expectations", "Exceeds expectations", "Outstanding"];

function Editor({ template, onClose, onSaved }: { template: Template | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [name, setName] = useState(template?.name ?? "");
  const [active, setActive] = useState(template?.isActive ?? true);
  const [scale, setScale] = useState<string[]>(template?.scale ?? DEFAULT_SCALE);
  const [questions, setQuestions] = useState<Question[]>((template?.questions as Question[]) ?? [
    { id: "", kind: "text", label: "", for: ["self", "manager"] },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveDocument);
  const setQ = (i: number, patch: Partial<Question>) => setQuestions(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, by: number) => {
    const next = [...questions];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setQuestions(next);
  };
  const submit = async () => {
    const res = await save({ input: { id: template?.id, name, isActive: active, scale, questions } });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Could not save." });
    const errs = res.data?.saveReviewTemplate.errors ?? [];
    if (errs.length) return setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    onSaved(`Saved ${name}.`);
  };
  return (
    <Dialog open wide onClose={onClose} title={template ? "Edit template" : "New review template"}
      description="The questions a review asks, and who answers each one."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button busy={fetching} onClick={submit}>Save template</Button></>}>
      <div className="grid gap-5">
        {errors[""] && <ErrorNote error={errors[""]} />}
        <Field label="Name" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual review" /></Field>
        <div>
          <p className="mb-1 text-sm font-medium text-ink">Rating scale</p>
          <p className="mb-2 text-xs text-muted">From lowest to highest. Managers also give an overall rating on this scale.</p>
          {errors.scale && <ErrorNote error={errors.scale} />}
          <div className="grid gap-2 sm:grid-cols-2">
            {scale.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-right text-sm tabular-nums text-muted">{i + 1}</span>
                <Input aria-label={`Rating ${i + 1}`} value={s} onChange={(e) => setScale(scale.map((x, j) => (j === i ? e.target.value : x)))} />
                <IconButton label="Remove rating" disabled={scale.length <= 2} onClick={() => setScale(scale.filter((_, j) => j !== i))}>
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </IconButton>
              </div>
            ))}
          </div>
          {scale.length < 7 && <Button size="sm" variant="ghost" className="mt-2" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setScale([...scale, ""])}>Add a rating</Button>}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Questions</p>
          {errors.questions && <ErrorNote error={errors.questions} />}
          <ol className="grid gap-3">
            {questions.map((q, i) => (
              <li key={i} className="grid gap-2 rounded-lg border border-line p-3">
                <div className="flex gap-2">
                  <Input aria-label={`Question ${i + 1}`} value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="What has gone well?" className="flex-1" />
                  <Select aria-label="Answer" value={q.kind} onChange={(e) => setQ(i, { kind: e.target.value as Question["kind"] })} className="w-36">
                    <option value="text">Written</option><option value="rating">Rating</option>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-muted">Asked in:</span>
                  {(["self", "manager", "peer"] as const).map((r) => (
                    <Checkbox key={r} label={ROLE_LABEL[r]} checked={q.for.includes(r)}
                      onChange={(on) => setQ(i, { for: on ? [...q.for, r] : q.for.filter((x) => x !== r) })} />
                  ))}
                  <span className="ml-auto flex">
                    <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><FontAwesomeIcon icon={faArrowUp} className="text-xs" /></IconButton>
                    <IconButton label="Move down" disabled={i === questions.length - 1} onClick={() => move(i, 1)}><FontAwesomeIcon icon={faArrowDown} className="text-xs" /></IconButton>
                    <IconButton label="Remove question" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <Button size="sm" variant="ghost" className="mt-2" icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setQuestions([...questions, { id: "", kind: "text", label: "", for: ["self", "manager"] }])}>Add a question</Button>
        </div>
        <Checkbox label="Available for new cycles" checked={active} onChange={setActive} />
      </div>
    </Dialog>
  );
}

export default function PerformanceSettingsPage() {
  const [{ data, error }, reload] = useQuery({ query: TemplatesDocument });
  const [, remove] = useMutation(DeleteDocument);
  const [editing, setEditing] = useState<Template | null | undefined>(undefined);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  const refresh = (text: string) => { setEditing(undefined); setMessage({ ok: true, text }); reload({ requestPolicy: "network-only" }); };
  return (
    <>
      {message && <Notice tone={message.ok ? "success" : "error"}>{message.text}</Notice>}
      <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing(null)}>New template</Button>}>
        Review templates: the questions and rating scale a review cycle uses. Start cycles from Performance → Review cycles.
      </SettingsIntro>
      <Card flush>
        <Table>
          <thead><tr><TH>Template</TH><TH>Questions</TH><TH>Scale</TH><TH>Used by</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
          <tbody>
            {data.reviewTemplates.map((t) => (
              <tr key={t.id} className={t.isActive ? undefined : "text-muted"}>
                <TD className="font-medium">{t.name} {!t.isActive && <Badge>Off</Badge>}</TD>
                <TD>{(t.questions as Question[]).length}</TD>
                <TD>{t.scale.length} points</TD>
                <TD>{t.cycles ? `${t.cycles} cycle${t.cycles === 1 ? "" : "s"}` : "—"}</TD>
                <TD align="right">
                  <span className="inline-flex">
                    <IconButton label={`Edit ${t.name}`} onClick={() => setEditing(t)}><FontAwesomeIcon icon={faPen} className="text-xs" /></IconButton>
                    {!t.cycles && (
                      <IconButton label={`Delete ${t.name}`} onClick={async () => {
                        const res = await remove({ id: t.id });
                        if (res.error) setMessage({ ok: false, text: errorMessage(res.error) ?? "Could not delete." });
                        else refresh(`Deleted ${t.name}.`);
                      }}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
                    )}
                  </span>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {editing !== undefined && <Editor template={editing} onClose={() => setEditing(undefined)} onSaved={refresh} />}
    </>
  );
}
