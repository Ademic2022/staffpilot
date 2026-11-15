"use client";

import { faCopy, faKey, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { Badge, Button, Card, Checkbox, ErrorNote, Field, IconButton, Input, Loading, Notice, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const FeedsDocument = graphql(`
  query MyCalendarFeeds { myCalendarFeeds { id kinds url lastUsedAt } }
`);
const CreateFeedDocument = graphql(`
  mutation CreateCalendarFeed($kinds: [String!]!) { createCalendarFeed(kinds: $kinds) { id } }
`);
const DeleteFeedDocument = graphql(`mutation DeleteCalendarFeed($id: ID!) { deleteCalendarFeed(id: $id) }`);

const KEYS = graphql(`
  query ApiKeys { apiKeys { id name prefix readOnly owner createdAt lastUsedAt } }
`);
const CreateKeyDocument = graphql(`
  mutation CreateApiKey($name: String!, $readOnly: Boolean!) { createApiKey(name: $name, readOnly: $readOnly) { secret } }
`);
const RevokeKeyDocument = graphql(`mutation RevokeApiKey($id: ID!) { revokeApiKey(id: $id) }`);

const FEED_KINDS = [["time_off", "Who's out"], ["holidays", "Public holidays"], ["birthdays", "Birthdays"], ["anniversaries", "Work anniversaries"]] as const;

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconButton label={done ? "Copied" : "Copy"} onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); }}>
      <FontAwesomeIcon icon={faCopy} />
    </IconButton>
  );
}

/** Private calendar links for Google, Outlook or Apple Calendar (as BambooHR's iCalendar feeds). */
export function CalendarFeeds() {
  const [{ data, error }, reload] = useQuery({ query: FeedsDocument });
  const [kinds, setKinds] = useState<string[]>(["time_off", "holidays"]);
  const [, create] = useMutation(CreateFeedDocument);
  const [, remove] = useMutation(DeleteFeedDocument);
  const refresh = () => reload({ requestPolicy: "network-only" });
  return (
    <Card title="Calendar links" description="Subscribe in Google, Outlook or Apple Calendar to see time off and dates there. Anyone with a link can read it, so keep it private.">
      {error && <ErrorNote error={errorMessage(error)} />}
      {!data ? <Loading shape="inline" /> : (
        <div className="space-y-4">
          {data.myCalendarFeeds.map((f) => (
            <div key={f.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-subtle px-2 py-1 text-xs">{f.url}</code>
                <Copy text={f.url} />
                <IconButton label="Delete link" onClick={async () => { await remove({ id: f.id }); refresh(); }}><FontAwesomeIcon icon={faTrash} /></IconButton>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {f.kinds.map((k) => FEED_KINDS.find(([key]) => key === k)?.[1] ?? k).join(", ")} · {f.lastUsedAt ? `last read ${formatDate(f.lastUsedAt)}` : "not used yet"}
              </p>
            </div>
          ))}
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {FEED_KINDS.map(([k, label]) => (
                <Checkbox key={k} label={label} checked={kinds.includes(k)} onChange={() => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k])} />
              ))}
            </div>
            <Button size="sm" variant="secondary" disabled={!kinds.length} onClick={async () => { await create({ kinds }); refresh(); }}>Make a calendar link</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** API keys other systems use to read (or change) data as the person who made the key. */
export function ApiKeys() {
  const [{ data, error }, reload] = useQuery({ query: KEYS });
  const [name, setName] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [secret, setSecret] = useState<string>();
  const [problem, setProblem] = useState<string>();
  const [, create] = useMutation(CreateKeyDocument);
  const [, revoke] = useMutation(RevokeKeyDocument);
  const refresh = () => reload({ requestPolicy: "network-only" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="inline" />;
  return (
    <div className="space-y-5">
      {secret && (
        <Notice tone="warning" title="Copy this key now. It will not be shown again.">
          <span className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded bg-subtle px-2 py-1 text-xs">{secret}</code><Copy text={secret} /></span>
          <span className="mt-1 block text-xs">Send it as the header <code>Authorization: Bearer …</code> to <code>/graphql</code>.</span>
        </Notice>
      )}
      {problem && <ErrorNote error={problem} />}
      <Card title="New key" description="A key acts as you, with your access level. Read-only keys cannot change anything.">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1"><Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Payroll system" /></Field></div>
          <Checkbox label="Read-only" checked={readOnly} onChange={setReadOnly} />
          <Button icon={<FontAwesomeIcon icon={faKey} />} disabled={!name.trim()} onClick={async () => {
            const r = await create({ name, readOnly });
            if (r.error) return setProblem(errorMessage(r.error));
            setProblem(undefined); setSecret(r.data?.createApiKey.secret); setName(""); refresh();
          }}>Make key</Button>
        </div>
      </Card>
      <Card flush title="Keys in use">
        {data.apiKeys.length ? (
          <Table>
            <thead><tr><TH>Name</TH><TH>Key</TH><TH>Access</TH><TH>Made by</TH><TH>Last used</TH><TH align="right"><span className="sr-only">Revoke</span></TH></tr></thead>
            <tbody>
              {data.apiKeys.map((k) => (
                <tr key={k.id}>
                  <TD className="font-medium">{k.name}</TD>
                  <TD><code className="text-xs">{k.prefix}…</code></TD>
                  <TD>{k.readOnly ? <Badge>Read-only</Badge> : <Badge tone="warn">Read and write</Badge>}</TD>
                  <TD>{k.owner}</TD>
                  <TD className="text-muted">{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}</TD>
                  <TD align="right"><IconButton label={`Revoke ${k.name}`} onClick={async () => { await revoke({ id: k.id }); refresh(); }}><FontAwesomeIcon icon={faTrash} /></IconButton></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="p-5 text-sm text-muted">No API keys.</p>}
      </Card>
    </div>
  );
}

const PrefsDocument = graphql(`query MyEmailPreferences { myEmailPreferences { key label email } }`);
const SetPrefsDocument = graphql(`
  mutation SetEmailPreferences($off: [String!]!) { setEmailPreferences(emailOff: $off) { key email } }
`);

/** Which notifications also come by email. They always appear under the bell. */
export function EmailPreferences() {
  const [{ data, error }, reload] = useQuery({ query: PrefsDocument });
  const [, setPrefs] = useMutation(SetPrefsDocument);
  return (
    <Card title="Email notifications" description="Everything also appears under the bell; untick what you do not want by email.">
      {error && <ErrorNote error={errorMessage(error)} />}
      {!data ? <Loading shape="inline" /> : (
        <div className="space-y-2">
          {data.myEmailPreferences.map((p) => (
            <Checkbox key={p.key} label={p.label} checked={p.email} onChange={async (c) => {
              const off = data.myEmailPreferences.filter((x) => (x.key === p.key ? !c : !x.email)).map((x) => x.key);
              await setPrefs({ off });
              reload({ requestPolicy: "network-only" });
            }} />
          ))}
        </div>
      )}
    </Card>
  );
}
