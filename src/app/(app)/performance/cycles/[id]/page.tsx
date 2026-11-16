"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";

import { CycleEditor } from "@/components/performance/CycleEditor";
import { CYCLE_KINDS, REVIEW_STATUS, ratingText } from "@/components/performance/shared";
import { ActionDialog, Badge, Button, Card, ErrorNote, Input, Loading, Notice, PageHeader, Select, Stat } from "@/components/ui";
import { graphql } from "@/gql";
import type { CycleReviewsQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const CycleDocument = graphql(`
  query CycleReviews($id: ID!) {
    reviewCycle(id: $id) { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds
      people selfDone managerDone withReviewer shared }
    cycleReviews(cycleId: $id) { ...ReviewRowFields calibrationNote }
    reviewTemplates { id name isActive }
    departments { id name }
  }
`);
const LaunchDocument = graphql(`mutation LaunchReviewCycle($id: ID!) { launchReviewCycle(id: $id) { cycle { id status } errors { message } } }`);
const CloseDocument = graphql(`mutation CloseReviewCycle($id: ID!) { closeReviewCycle(id: $id) { cycle { id status } errors { message } } }`);
const DeleteDocument = graphql(`mutation DeleteReviewCycle($id: ID!) { deleteReviewCycle(id: $id) }`);
const CalibrateDocument = graphql(`
  mutation CalibrateFromCycle($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { id calibratedRating calibrationNote } }
`);

type Row = CycleReviewsQuery["cycleReviews"][number];

/** How many people sit at each point of the scale: the manager's rating, and after calibration. */
function Distribution({ rows, scale }: { rows: Row[]; scale: string[] }) {
  const counts = scale.map((_, i) => ({
    manager: rows.filter((r) => r.overallRating === i + 1).length,
    final: rows.filter((r) => (r.calibratedRating ?? r.overallRating) === i + 1).length,
  }));
  const rated = rows.filter((r) => r.overallRating).length;
  const max = Math.max(1, ...counts.flatMap((c) => [c.manager, c.final]));
  return (
    <Card title="Rating spread" description={`${rated} of ${rows.length} rated. Pale bars are managers' ratings; solid bars are after calibration.`}>
      <ul className="grid gap-3">
        {scale.map((label, i) => (
          <li key={label} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-3 text-sm">
            <span className="truncate text-ink" title={label}>{i + 1} · {label}</span>
            <span className="grid gap-[2px]">
              <span className="flex items-center gap-2" title={`Managers: ${counts[i].manager}`}>
                <span className="h-2 rounded-r bg-brand/30" style={{ width: `${(counts[i].manager / max) * 100}%`, minWidth: counts[i].manager ? 4 : 0 }} />
              </span>
              <span className="flex items-center gap-2" title={`After calibration: ${counts[i].final}`}>
                <span className="h-2 rounded-r bg-brand" style={{ width: `${(counts[i].final / max) * 100}%`, minWidth: counts[i].final ? 4 : 0 }} />
                <span className="text-xs tabular-nums text-muted">{counts[i].final}{rated ? ` · ${Math.round((counts[i].final * 100) / rated)}%` : ""}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CalibrationRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [rating, setRating] = useState(row.calibratedRating ? String(row.calibratedRating) : "");
  const [note, setNote] = useState(row.calibrationNote);
  const [{ fetching }, save] = useMutation(CalibrateDocument);
  const dirty = rating !== (row.calibratedRating ? String(row.calibratedRating) : "") || note !== row.calibrationNote;
  const s = REVIEW_STATUS[row.status];
  return (
    <tr className="align-top">
      <td className="px-4 py-2.5">
        <Link href={`/performance/reviews/${row.id}`} className="font-medium text-ink hover:underline">{row.employeeName}</Link>
        <span className="block text-xs text-muted">{[row.department, row.managerName && `reviewer ${row.managerName}`].filter(Boolean).join(" · ") || "No reviewer"}</span>
      </td>
      <td className="px-3 py-2.5"><Badge tone={s?.tone ?? "neutral"} dot>{s?.label ?? row.status}</Badge></td>
      <td className="px-3 py-2.5 text-ink">{ratingText(row.scale, row.overallRating)}</td>
      <td className="px-3 py-2.5">
        <Select aria-label={`Calibrated rating for ${row.employeeName}`} value={rating} onChange={(e) => setRating(e.target.value)} className="min-w-40">
          <option value="">Keep</option>
          {row.scale.map((l, i) => <option key={l} value={i + 1}>{i + 1} · {l}</option>)}
        </Select>
      </td>
      <td className="px-3 py-2.5"><Input aria-label={`Reason for ${row.employeeName}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" /></td>
      <td className="px-3 py-2.5 text-right">
        <Button size="sm" variant="secondary" busy={fetching} disabled={!dirty}
          onClick={async () => { await save({ id: row.id, rating: rating ? Number(rating) : null, note }); onSaved(); }}>Save</Button>
      </td>
    </tr>
  );
}

export default function CyclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [{ data, error }, reload] = useQuery({ query: CycleDocument, variables: { id }, requestPolicy: "cache-and-network" });
  const [{ fetching: launching }, launch] = useMutation(LaunchDocument);
  const [{ fetching: closing }, close] = useMutation(CloseDocument);
  const [, remove] = useMutation(DeleteDocument);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"launch" | "close" | "delete" | null>(null);
  const [problem, setProblem] = useState<string>();
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => data?.cycleReviews ?? [], [data]);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;
  const c = data.reviewCycle;
  const refresh = () => reload({ requestPolicy: "network-only" });
  const scale = rows[0]?.scale ?? [];
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const act = async () => {
    setProblem(undefined);
    if (confirm === "delete") {
      await remove({ id: c.id });
      return router.push("/performance?tab=cycles");
    }
    const res = confirm === "launch" ? await launch({ id: c.id }) : await close({ id: c.id });
    const payload = res.data && ("launchReviewCycle" in res.data ? res.data.launchReviewCycle : res.data.closeReviewCycle);
    const msg = res.error ? errorMessage(res.error) : payload?.errors[0]?.message;
    setConfirm(null);
    if (msg) setProblem(msg);
    refresh();
  };
  return (
    <>
      <PageHeader title={c.name} back={{ href: "/performance?tab=cycles", label: "Review cycles" }}
        subtitle={`${CYCLE_KINDS[c.kind]} · ${formatDate(c.periodStart)} to ${formatDate(c.periodEnd)} · questions from ${c.templateName}`}
        actions={<>
          {c.status !== "closed" && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
          {c.status === "draft" && <Button variant="ghost" onClick={() => setConfirm("delete")}>Delete</Button>}
          {c.status === "draft" && <Button busy={launching} onClick={() => setConfirm("launch")}>Start cycle</Button>}
          {c.status === "active" && <Button variant="secondary" busy={closing} onClick={() => setConfirm("close")}>Close cycle</Button>}
        </>} />
      {problem && <ErrorNote error={problem} />}
      {c.status === "draft" ? (
        <Notice title="Not started">
          {c.people} {c.people === 1 ? "person" : "people"} will be reviewed.{c.includeSelf && " Each gets a self review"}{c.includeSelf ? " and" : ""} their manager gets a review to write.
          {" "}Starting sends everyone an email.
        </Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="People" value={c.people} />
            {c.includeSelf && <Stat label="Self reviews done" value={`${c.selfDone} of ${c.people}`} hint={c.selfDue ? `Due ${formatDate(c.selfDue)}` : undefined} />}
            <Stat label="Manager reviews done" value={`${c.managerDone} of ${c.withReviewer}`}
              hint={[c.people > c.withReviewer && `${c.people - c.withReviewer} with no reviewer`, c.managerDue && `Due ${formatDate(c.managerDue)}`].filter(Boolean).join(" · ") || undefined} />
            <Stat label="Shared" value={`${c.shared} of ${c.people}`} />
          </div>
          {scale.length > 0 && <Distribution rows={rows} scale={scale} />}
          <Card flush title="Reviews and calibration" description="Adjust a rating when it is out of line with similar work elsewhere. People only see the final rating once their review is shared."
            actions={<Select aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Everyone</option>
              {Object.entries(REVIEW_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </Select>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-subtle/70 text-left"><tr>
                  <th className="px-4 py-2.5 font-semibold text-ink">Person</th><th className="px-3 py-2.5 font-semibold text-ink">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-ink">Manager&apos;s rating</th><th className="px-3 py-2.5 font-semibold text-ink">Calibrated</th>
                  <th className="px-3 py-2.5 font-semibold text-ink">Reason</th><th />
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => <CalibrationRow key={`${r.id}-${r.calibratedRating}-${r.calibrationNote}`} row={r} onSaved={refresh} />)}
                </tbody>
              </table>
              {!shown.length && <p className="p-5 text-sm text-muted">No one here.</p>}
            </div>
          </Card>
        </>
      )}
      {editing && <CycleEditor cycle={c} templates={data.reviewTemplates} departments={data.departments} onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); refresh(); }} />}
      <ActionDialog open={confirm !== null} onClose={() => setConfirm(null)} onConfirm={act}
        title={confirm === "launch" ? "Start this review cycle?" : confirm === "close" ? "Close this review cycle?" : "Delete this draft cycle?"}
        description={confirm === "launch" ? `Everyone in it is emailed and asked for their reviews. The period and questions can no longer change.`
          : confirm === "close" ? "Unfinished reviews can no longer be written. Shared reviews stay readable." : "Nothing has been sent yet."}
        confirmLabel={confirm === "launch" ? "Start" : confirm === "close" ? "Close" : "Delete"} tone={confirm === "delete" ? "danger" : "primary"} />
    </>
  );
}
