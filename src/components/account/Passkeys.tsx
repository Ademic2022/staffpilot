"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { RecoveryCodes } from "@/components/account/RecoveryCodes";
import { IconLock, IconTrash } from "@/components/icons";
import { Badge, Button, Card, ErrorNote, Field, IconButton, Input, Loading, PasswordInput } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useMounted, useSession } from "@/lib/session";

const MyPasskeysDocument = graphql(`
  query MyPasskeys { myPasskeys { id name createdAt lastUsedAt } }
`);
const StartPasskeySetupDocument = graphql(`
  mutation StartPasskeySetup { startPasskeySetup }
`);
const AddPasskeyDocument = graphql(`
  mutation AddPasskey($response: JSON!, $name: String!) {
    addPasskey(response: $response, name: $name) { codes errors { field message } }
  }
`);
const RemovePasskeyDocument = graphql(`
  mutation RemovePasskey($id: ID!, $password: String!) {
    removePasskey(id: $id, password: $password) { ok errors { field message } }
  }
`);

/** A starting name for a new passkey, from the device it is made on. */
function deviceName() {
  if (typeof navigator === "undefined") return "Passkey";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Passkey";
}

/**
 * Plain words for what the browser says when a passkey step does not finish. Closing the
 * prompt is not an error worth shouting about.
 */
export function passkeyProblem(error: unknown): string | undefined {
  const e = error as { name?: string; code?: string; cause?: { name?: string } };
  const name = e?.cause?.name ?? e?.name;
  if (e?.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return "This device already has a passkey for your account.";
  if (name === "NotAllowedError" || name === "AbortError") return undefined; // closed or timed out
  if (name === "SecurityError") return "Passkeys only work on your company's own StaffPilot address.";
  return "Your device could not use a passkey. Try again, or use another way.";
}

/** Ask the browser for a passkey answer to sign-in options. Undefined when closed. */
export async function signWithPasskey(optionsJSON: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return startAuthentication({ optionsJSON: optionsJSON as any });
}

export function PasskeysCard() {
  const mounted = useMounted();
  const { me, reset } = useSession();
  const [{ data, error: loadError }, reload] = useQuery({ query: MyPasskeysDocument });
  const [, startSetup] = useMutation(StartPasskeySetupDocument);
  const [, add] = useMutation(AddPasskeyDocument);
  const [, remove] = useMutation(RemovePasskeyDocument);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (!me) return null;
  const supported = mounted && browserSupportsWebAuthn();
  const keys = data?.myPasskeys ?? [];

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const options = await startSetup({});
      if (!options.data) return setError(errorMessage(options.error));
      let response;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response = await startRegistration({ optionsJSON: options.data.startPasskeySetup as any });
      } catch (err) {
        return setError(passkeyProblem(err));
      }
      const result = await add({ response, name: name.trim() || deviceName() });
      const problem = errorMessage(result.error) ?? result.data?.addPasskey.errors[0]?.message;
      if (problem) return setError(problem);
      setNaming(false);
      reload({ requestPolicy: "network-only" });
      const issued = result.data?.addPasskey.codes ?? [];
      if (issued.length) setCodes(issued);
      else reset();
    } finally {
      setBusy(false);
    }
  }

  async function drop(e: FormEvent) {
    e.preventDefault();
    if (!removing) return;
    setBusy(true);
    setError(undefined);
    const result = await remove({ id: removing.id, password });
    setBusy(false);
    const problem = errorMessage(result.error) ?? result.data?.removePasskey.errors[0]?.message;
    if (problem) return setError(problem);
    setRemoving(null);
    setPassword("");
    reload({ requestPolicy: "network-only" });
    reset();
  }

  if (codes) {
    return (
      <Card title="Passkeys">
        <RecoveryCodes codes={codes} onDone={() => { setCodes(null); reset(); }} />
      </Card>
    );
  }

  return (
    <Card title={<span className="flex items-center gap-2"><IconLock size={15} className="text-muted" />Passkeys</span>}
      actions={keys.length ? <Badge tone="good" dot>{keys.length} {keys.length === 1 ? "passkey" : "passkeys"}</Badge> : <Badge>None</Badge>}>
      <div className="space-y-4">
        {error && <ErrorNote error={error} />}
        {loadError && <ErrorNote error={errorMessage(loadError)} />}
        <p className="text-sm text-muted">
          After your password, confirm it is you with Face ID, Touch ID, Windows Hello, your phone or a security key. Nothing to type, and it cannot be used on a fake site.
        </p>
        {!data && !loadError ? <Loading shape="inline" /> : keys.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{k.name}</span>
                  <span className="block text-xs text-muted">
                    Added {formatDate(k.createdAt)}{k.lastUsedAt ? ` · last used ${formatDate(k.lastUsedAt)}` : " · not used yet"}
                  </span>
                </span>
                <IconButton label={`Remove ${k.name}`} onClick={() => { setRemoving({ id: k.id, name: k.name }); setError(undefined); }}>
                  <IconTrash size={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        {removing ? (
          <form className="max-w-sm space-y-4" onSubmit={drop}>
            <Field label={`Your password, to remove ${removing.name}`}
              hint={keys.length === 1 && !me.mfaAppEnabled ? "It is your only second step: two-step sign-in turns off." : undefined}>
              <PasswordInput value={password} autoComplete="current-password" autoFocus onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="danger" busy={busy}>Remove</Button>
              <Button variant="ghost" onClick={() => { setRemoving(null); setPassword(""); }}>Cancel</Button>
            </div>
          </form>
        ) : naming ? (
          <form className="max-w-sm space-y-4" onSubmit={create}>
            <Field label="Name it" hint="So you can tell your passkeys apart later.">
              <Input value={name} maxLength={60} autoFocus onChange={(e) => setName(e.target.value)} placeholder={deviceName()} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" busy={busy}>Continue</Button>
              <Button variant="ghost" onClick={() => setNaming(false)}>Cancel</Button>
            </div>
          </form>
        ) : supported ? (
          <Button variant={keys.length ? "secondary" : "primary"} onClick={() => { setName(deviceName()); setNaming(true); setError(undefined); }}>
            {keys.length ? "Add another passkey" : "Add a passkey"}
          </Button>
        ) : mounted ? (
          <p className="text-sm text-muted">This browser cannot make passkeys. Use the authenticator app instead, or try another browser.</p>
        ) : null}
      </div>
    </Card>
  );
}
