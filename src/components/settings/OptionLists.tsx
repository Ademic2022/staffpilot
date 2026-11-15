"use client";

import { faArrowDown, faArrowUp, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Button, ErrorNote, IconButton, Input, Loading, cx } from "@/components/ui";
import { graphql } from "@/gql";
import type { ListKey } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const ListsDocument = graphql(`
  query OptionListsAdmin {
    optionLists { key name }
    listOptions(includeInactive: true) { id listKey label position isActive }
  }
`);

const SaveDocument = graphql(`
  mutation SaveListOption($input: ListOptionInput!) {
    saveListOption(input: $input) { option { id } errors { field message } }
  }
`);

const ReorderDocument = graphql(`
  mutation ReorderListOptions($ids: [ID!]!) { reorderListOptions(ids: $ids) }
`);

const DeleteDocument = graphql(`
  mutation DeleteListOption($id: ID!) { deleteListOption(id: $id) }
`);

/** Every choice in one list, for a datalist: suggestions on a text box that still takes anything. */
export const ListChoicesDocument = graphql(`
  query ListChoices($key: ListKey!) {
    listOptions(listKey: $key) { id label }
  }
`);

/** HR-managed dropdown lists (as BambooHR's Employee fields): pay change reasons, reasons for leaving and so on. */
export function OptionLists() {
  const [{ data, error }, reload] = useQuery({ query: ListsDocument });
  const [chosen, setChosen] = useState<ListKey | null>(null);
  const [label, setLabel] = useState("");
  const [problem, setProblem] = useState<string>();
  const [, save] = useMutation(SaveDocument);
  const [, reorder] = useMutation(ReorderDocument);
  const [, remove] = useMutation(DeleteDocument);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const key = chosen ?? data.optionLists[0]?.key;
  const options = data.listOptions.filter((o) => o.listKey === key);
  const refresh = () => reload({ requestPolicy: "network-only" });
  const run = async (p: Promise<{ error?: unknown; data?: unknown }>, check?: (d: unknown) => string | undefined) => {
    const r = await p;
    const message = errorMessage(r.error as never) ?? check?.(r.data);
    setProblem(message);
    if (!message) refresh();
    return !message;
  };
  const move = (i: number, by: number) => {
    const ids = options.map((o) => o.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    void run(reorder({ ids }));
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <ul className="flex gap-1 overflow-x-auto md:w-44 md:flex-none md:flex-col">
        {data.optionLists.map((l) => (
          <li key={l.key}>
            <button type="button" onClick={() => { setChosen(l.key); setProblem(undefined); }}
              className={cx("w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition",
                l.key === key ? "bg-subtle font-semibold text-brand-ink" : "text-ink hover:bg-subtle/60")}>{l.name}</button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 space-y-3">
        {problem && <ErrorNote error={problem} />}
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!key || !label.trim()) return;
          if (await run(save({ input: { listKey: key, label } }), (d) => (d as { saveListOption?: { errors: { message: string }[] } })?.saveListOption?.errors[0]?.message)) setLabel("");
        }}>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a choice" aria-label="New choice" />
          <Button type="submit" icon={<FontAwesomeIcon icon={faPlus} />}>Add</Button>
        </form>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {options.map((o, i) => (
            <li key={o.id} className={cx("flex items-center gap-2 px-3 py-1.5 text-sm", !o.isActive && "text-muted")}>
              <span className="min-w-0 flex-1 break-words">{o.label}{!o.isActive && " (hidden)"}</span>
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><FontAwesomeIcon icon={faArrowUp} className="text-[11px]" /></IconButton>
              <IconButton label="Move down" disabled={i === options.length - 1} onClick={() => move(i, 1)}><FontAwesomeIcon icon={faArrowDown} className="text-[11px]" /></IconButton>
              <Button size="sm" variant="ghost" onClick={() => void run(save({ input: { id: o.id, listKey: o.listKey, label: o.label, isActive: !o.isActive } }))}>
                {o.isActive ? "Hide" : "Show"}
              </Button>
              <IconButton label={`Delete ${o.label}`} onClick={() => void run(remove({ id: o.id }))}><FontAwesomeIcon icon={faTrash} className="text-xs" /></IconButton>
            </li>
          ))}
          {!options.length && <li className="px-3 py-4 text-sm text-muted">No choices yet.</li>}
        </ul>
        <p className="text-xs text-muted">Records keep the text they were saved with, so renaming or deleting a choice does not change history.</p>
      </div>
    </div>
  );
}

/** A text box with the list's choices as suggestions. */
export function ListInput({ listKey, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { listKey: ListKey; id: string }) {
  const [{ data }] = useQuery({ query: ListChoicesDocument, variables: { key: listKey } });
  return (
    <>
      <Input list={`${id}-choices`} id={id} autoComplete="off" {...props} />
      <datalist id={`${id}-choices`}>{data?.listOptions.map((o) => <option key={o.id} value={o.label} />)}</datalist>
    </>
  );
}
