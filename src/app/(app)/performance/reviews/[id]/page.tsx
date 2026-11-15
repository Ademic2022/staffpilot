"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Answers, PersonSearch, Question, RatingPicker, REVIEW_STATUS, ratingText, ROLE_LABEL } from "@/components/performance/shared";
import { Badge, Button, Card, ErrorNote, Field, Input, Loading, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { graphql } from "@/gql";
import type { ReviewQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const ReviewDocument = graphql(`
  query Review($id: ID!) {
    review(id: $id) {
      review { ...ReviewRowFields calibrationNote }
      questions
      responses { id role authorId authorName answers submittedAt declinedAt mine }
      peers { id name status }
      sharedAt acknowledgedAt employeeComment periodStart periodEnd includePeers canManage canCalibrate isEmployee
    }
  }
`);
const SaveResponseDocument = graphql(`
  mutation SaveReviewResponse($id: ID!, $answers: JSON!, $submit: Boolean) {
    saveReviewResponse(id: $id, answers: $answers, submit: $submit) { response { id submittedAt } errors { field message } }
  }
`);
const DeclineDocument = graphql(`mutation DeclinePeerReview($id: ID!) { declinePeerReview(id: $id) }`);
const RequestPeersDocument = graphql(`
  mutation RequestPeerReviews($reviewId: ID!, $employeeIds: [ID!]!) { requestPeerReviews(reviewId: $reviewId, employeeIds: $employeeIds) { peers { id } } }
`);
const ShareDocument = graphql(`mutation ShareReview($id: ID!) { shareReview(id: $id) { sharedAt } }`);
const AcknowledgeDocument = graphql(`mutation AcknowledgeReview($id: ID!, $comment: String!) { acknowledgeReview(id: $id, comment: $comment) { acknowledgedAt } }`);
const CalibrateDocument = graphql(`
  mutation CalibrateReview($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { calibratedRating } }
`);

type Detail = ReviewQuery["review"];
const OVERALL: Question = { id: "overall", kind: "rating", label: "Overall rating", for: ["manager"] };

function MyForm({ detail, onDone }: { detail: Detail; onDone: () => void }) {
  const r = detail.review;
  const mine = detail.responses.find((x) => x.mine && x.role === r.myRole);
  const role = r.myRole!;
  const questions = [...(detail.questions as Question[]).filter((q) => q.for.includes(role)), ...(role === "manager" ? [OVERALL] : [])];
  const [answers, setAnswers] = useState<Answers>((mine?.answers as Answers) ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string>();
  const [{ fetching }, save] = useMutation(SaveResponseDocument);
  const [, decline] = useMutation(DeclineDocument);
  const set = (id: string, patch: Answers[string]) => setAnswers({ ...answers, [id]: { ...answers[id], ...patch } });
  const send = async (submit: boolean) => {
    setSaved(undefined);
    const res = await save({ id: r.myResponseId!, answers, submit });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Could not save." });
    const errs = res.data?.saveReviewResponse.errors ?? [];
    setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    if (errs.length) return;
    if (submit) onDone();
    else setSaved("Draft saved. Only you can see it until you submit.");
  };
  const intro = role === "self" ? "Look back on the period. Your manager sees this once you submit."
    : role === "peer" ? `Only ${r.employeeName}'s managers and HR will read this.`
    : `Write ${r.employeeName}'s review. They see it when you share it.`;
  return (
    <Card title={ROLE_LABEL[role]} description={intro}>
      <div className="grid gap-6">
        {errors[""] && <ErrorNote error={errors[""]} />}
        {saved && <Notice tone="success">{saved}</Notice>}
        {questions.map((q) => (
          <div key={q.id} className="grid gap-2">
            <p className="text-sm font-medium text-ink">{q.label}</p>
            {q.kind === "rating" && <RatingPicker label={q.label} scale={r.scale} value={answers[q.id]?.rating} onChange={(rating) => set(q.id, { rating })} />}
            {q.id !== "overall" && (
              <Textarea rows={q.kind === "text" ? 4 : 2} aria-label={`${q.label} comments`} placeholder={q.kind === "rating" ? "Comments (optional)" : ""}
                value={answers[q.id]?.text ?? ""} onChange={(e) => set(q.id, { text: e.target.value })} />
            )}
            {errors[q.id] && <p className="text-xs text-red-600">{errors[q.id]}</p>}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button busy={fetching} onClick={() => send(true)}>Submit</Button>
          <Button variant="secondary" disabled={fetching} onClick={() => send(false)}>Save draft</Button>
          {role === "peer" && mine && (
            <Button variant="ghost" onClick={async () => { await decline({ id: mine.id }); onDone(); }}>Decline</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ResponseView({ detail, response }: { detail: Detail; response: Detail["responses"][number] }) {
  const questions = [...(detail.questions as Question[]).filter((q) => q.for.includes(response.role)), ...(response.role === "manager" ? [OVERALL] : [])];
  const answers = (response.answers as Answers) ?? {};
  return (
    <Card title={`${ROLE_LABEL[response.role]}${response.role !== "self" ? ` · ${response.authorName}` : ""}`}
      description={response.submittedAt ? `Submitted ${formatDate(response.submittedAt)}` : "Draft: only you can see it"}>
      <dl className="grid gap-4">
        {questions.map((q) => {
          const a = answers[q.id];
          if (!a?.rating && !a?.text) return null;
          return (
            <div key={q.id}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{q.label}</dt>
              {q.kind === "rating" && <dd className="mt-0.5 text-sm font-medium text-ink">{ratingText(detail.review.scale, a.rating)}</dd>}
              {a.text && <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{a.text}</dd>}
            </div>
          );
        })}
      </dl>
    </Card>
  );
}

function Peers({ detail, onChange }: { detail: Detail; onChange: () => void }) {
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const [{ fetching, error }, ask] = useMutation(RequestPeersDocument);
  const open = detail.review.cycleStatus === "active";
  return (
    <Card title="Peer reviews" description="Colleagues who work with them. Only managers and HR read what they write.">
      <div className="grid gap-3">
        {error && <ErrorNote error={errorMessage(error)} />}
        {detail.peers.length ? (
          <ul className="grid gap-1.5">
            {detail.peers.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{p.name}</span>
                <Badge tone={p.status === "done" ? "good" : p.status === "declined" ? "neutral" : "warn"}>{p.status === "done" ? "Done" : p.status === "declined" ? "Declined" : "Waiting"}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No one asked yet.</p>}
        {open && <>
          <PersonSearch placeholder="Add a colleague" onPick={(p) => setPicked([...picked, p])} exclude={picked.map((p) => p.id)} />
          {picked.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {picked.map((p) => (
                <button key={p.id} type="button" className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink hover:bg-subtle"
                  onClick={() => setPicked(picked.filter((x) => x.id !== p.id))}>{p.name} ×</button>
              ))}
              <Button size="sm" busy={fetching} onClick={async () => {
                const res = await ask({ reviewId: detail.review.id, employeeIds: picked.map((p) => p.id) });
                if (!res.error) { setPicked([]); onChange(); }
              }}>Ask {picked.length === 1 ? "them" : `${picked.length} people`}</Button>
            </div>
          )}
        </>}
      </div>
    </Card>
  );
}

function Outcome({ detail, onChange }: { detail: Detail; onChange: () => void }) {
  const r = detail.review;
  const [{ fetching: sharing, error: shareError }, share] = useMutation(ShareDocument);
  const [{ fetching: acking }, acknowledge] = useMutation(AcknowledgeDocument);
  const [{ fetching: calibrating, error: calError }, calibrate] = useMutation(CalibrateDocument);
  const [comment, setComment] = useState("");
  const [cal, setCal] = useState({ rating: r.calibratedRating ? String(r.calibratedRating) : "", note: r.calibrationNote });
  return (
    <Card title="Outcome">
      <div className="grid gap-4 text-sm">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Rating</span>
          <span className="text-ink">{r.overallRating ? ratingText(r.scale, r.overallRating) : "Not rated yet"}</span>
          {detail.canManage && r.calibratedRating && <span className="text-muted">Calibrated to {ratingText(r.scale, r.calibratedRating)}{r.calibrationNote && ` (${r.calibrationNote})`}</span>}
        </div>
        {detail.canManage && !detail.sharedAt && (
          <div>
            {shareError && <ErrorNote error={errorMessage(shareError)} />}
            <Button size="sm" busy={sharing} disabled={!r.managerDone} onClick={async () => { await share({ id: r.id }); onChange(); }}>Share with {r.employeeName.split(" ")[0]}</Button>
            {!r.managerDone && <p className="mt-1 text-xs text-muted">Submit the manager review first.</p>}
          </div>
        )}
        {detail.sharedAt && <p className="text-muted">Shared {formatDate(detail.sharedAt)}{detail.acknowledgedAt && `, acknowledged ${formatDate(detail.acknowledgedAt)}`}.</p>}
        {detail.employeeComment && <blockquote className="border-l-2 border-line pl-3 text-ink">{detail.employeeComment}</blockquote>}
        {detail.isEmployee && detail.sharedAt && !detail.acknowledgedAt && (
          <div className="grid gap-2">
            <Field label="Your comments" optional><Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
            <div><Button size="sm" busy={acking} onClick={async () => { await acknowledge({ id: r.id, comment }); onChange(); }}>I have read my review</Button></div>
          </div>
        )}
        {detail.canCalibrate && r.cycleStatus !== "draft" && (
          <div className="grid gap-2 border-t border-line pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Calibration (HR)</span>
            {calError && <ErrorNote error={errorMessage(calError)} />}
            <Select aria-label="Calibrated rating" value={cal.rating} onChange={(e) => setCal({ ...cal, rating: e.target.value })}>
              <option value="">Keep the manager&apos;s rating</option>
              {r.scale.map((s, i) => <option key={s} value={i + 1}>{i + 1} · {s}</option>)}
            </Select>
            <Input aria-label="Reason" placeholder="Reason" value={cal.note} onChange={(e) => setCal({ ...cal, note: e.target.value })} />
            <div><Button size="sm" variant="secondary" busy={calibrating}
              onClick={async () => { await calibrate({ id: r.id, rating: cal.rating ? Number(cal.rating) : null, note: cal.note }); onChange(); }}>Save calibration</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [{ data, error }, reload] = useQuery({ query: ReviewDocument, variables: { id }, requestPolicy: "cache-and-network" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  const d = data.review;
  const r = d.review;
  const refresh = () => reload({ requestPolicy: "network-only" });
  const writing = r.myRole && !r.myResponseDone && r.cycleStatus === "active";
  const others = d.responses.filter((x) => !(writing && x.mine && x.role === r.myRole));
  const order = { self: 0, manager: 1, peer: 2 } as Record<string, number>;
  const s = REVIEW_STATUS[r.status];
  return (
    <>
      <PageHeader title={d.isEmployee ? `Your ${r.cycleName} review` : r.employeeName} back={{ href: "/performance?tab=reviews", label: "Reviews" }}
        subtitle={<>
          <span>{r.cycleName} · {formatDate(d.periodStart)} to {formatDate(d.periodEnd)}{r.managerName && ` · reviewer ${r.managerName}`}</span>
          {(d.canManage || d.isEmployee) && <Badge tone={s?.tone ?? "neutral"} dot>{s?.label ?? r.status}</Badge>}
        </>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-5">
          {writing && <MyForm detail={d} onDone={refresh} />}
          {[...others].sort((a, b) => order[a.role] - order[b.role]).map((x) => <ResponseView key={x.id} detail={d} response={x} />)}
          {!writing && !others.length && <Notice title="Nothing to read yet">Responses appear here once they are submitted.</Notice>}
        </div>
        <div className="grid content-start gap-5">
          {(d.canManage || d.isEmployee) && <Outcome detail={d} onChange={refresh} />}
          {d.canManage && d.includePeers && <Peers detail={d} onChange={refresh} />}
        </div>
      </div>
    </>
  );
}
