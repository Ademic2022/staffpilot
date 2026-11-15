"use client";

import { faArrowDown, faArrowUp, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { Button, Checkbox, ErrorNote, IconButton, Loading, Notice, Select } from "@/components/ui";
import { graphql } from "@/gql";
import type { ApprovalsSettingsQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const ApprovalsDocument = graphql(`
  query ApprovalsSettings {
    approvalChains { kind name enabled steps }
    approvalStepTypes { key label }
    roles { code name }
    members { id fullName email isActive }
  }
`);

const SaveChainDocument = graphql(`
  mutation SaveApprovalChain($kind: String!, $enabled: Boolean!, $steps: JSON!) {
    saveApprovalChain(kind: $kind, enabled: $enabled, steps: $steps) { chain { kind } errors { field message } }
  }
`);

type Step = { type: string; role?: string; member?: string };
type Data = ApprovalsSettingsQuery;

function ChainEditor({ data, kind }: { data: Data; kind: string }) {
  const chain = data.approvalChains.find((c) => c.kind === kind)!;
  const [enabled, setEnabled] = useState(chain.enabled);
  const [steps, setSteps] = useState<Step[]>((chain.steps as Step[]) ?? []);
  const [{ fetching }, save] = useMutation(SaveChainDocument);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const set = (i: number, patch: Partial<Step>) => setSteps(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, by: number) => { const next = [...steps]; [next[i], next[i + by]] = [next[i + by], next[i]]; setSteps(next); };

  return (
    <div className="space-y-4">
      {message && (message.ok ? <Notice tone="success">{message.text}</Notice> : <ErrorNote error={message.text} />)}
      <Checkbox label={`Approve ${chain.name.toLowerCase()} before they take effect`} checked={enabled} onChange={setEnabled}
        description="Off: changes apply as soon as they are saved, as now. On: they wait for each approver in turn." />
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-line px-3 py-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-subtle text-xs font-semibold text-ink">{i + 1}</span>
            <Select aria-label="Approver" value={s.type} onChange={(e) => set(i, { type: e.target.value, role: undefined, member: undefined })} className="w-56">
              {data.approvalStepTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
            {s.type === "role" && (
              <Select aria-label="Access level" value={s.role ?? ""} onChange={(e) => set(i, { role: e.target.value })} className="w-48">
                <option value="">Choose…</option>
                {data.roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </Select>
            )}
            {s.type === "person" && (
              <Select aria-label="Person" value={s.member ?? ""} onChange={(e) => set(i, { member: e.target.value })} className="w-56">
                <option value="">Choose…</option>
                {data.members.filter((m) => m.isActive).map((m) => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
              </Select>
            )}
            <span className="ml-auto flex">
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><FontAwesomeIcon icon={faArrowUp} className="text-[11px]" /></IconButton>
              <IconButton label="Move down" disabled={i === steps.length - 1} onClick={() => move(i, 1)}><FontAwesomeIcon icon={faArrowDown} className="text-[11px]" /></IconButton>
              <IconButton label="Remove step" onClick={() => setSteps(steps.filter((_, j) => j !== i))}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
            </span>
          </li>
        ))}
      </ol>
      {steps.length < 5 && (
        <Button size="sm" variant="secondary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setSteps([...steps, { type: "manager" }])}>Add approver</Button>
      )}
      <p className="text-xs text-muted">
        Approvers see the change, including pay amounts, even if their access level would not show them. Nobody approves a change to their
        own record or one they asked for; a step with nobody else to ask is skipped.
      </p>
      <div className="flex justify-end">
        <Button busy={fetching} onClick={async () => {
          const r = await save({ kind, enabled, steps });
          const problem = errorMessage(r.error) ?? r.data?.saveApprovalChain.errors[0]?.message;
          setMessage(problem ? { ok: false, text: problem } : { ok: true, text: "Approvals saved." });
        }}>Save</Button>
      </div>
    </div>
  );
}

export default function ApprovalsSettingsPage() {
  const [tab] = useSettingsTab(["pay_change", "job_change", "time_off", "info"] as const, "pay_change");
  const [{ data, error }] = useQuery({ query: ApprovalsDocument });
  if (tab === "time_off") {
    return <SettingsIntro>Time off is approved up the reporting line. Set how many managers approve each leave type (1–3) in{" "}
      <Link href="/settings/time-off?tab=types" className="font-medium text-brand-ink hover:underline">Time off → Leave types</Link>.</SettingsIntro>;
  }
  if (tab === "info") {
    return <SettingsIntro>Changes people ask for to their own name, bank or ID details go to everyone who can change employee records,
      who see them in their notifications and on Home.</SettingsIntro>;
  }
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  return (
    <>
      <SettingsIntro>Who approves {tab === "pay_change" ? "pay changes" : "job changes and promotions"}, in order. Waiting changes show under Approvals.</SettingsIntro>
      <ChainEditor key={tab} data={data} kind={tab} />
    </>
  );
}
