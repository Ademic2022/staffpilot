"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "urql";

import { IconCheck, IconLock } from "@/components/icons";
import { Badge, Button, Card, ErrorNote, Field, Input, Notice, PageHeader, PasswordInput } from "@/components/ui";
import { CalendarFeeds, EmailPreferences } from "@/components/settings/Integrations";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { useSession } from "@/lib/session";

const ChangePasswordDocument = graphql(`
  mutation ChangePassword($current: String!, $new: String!) {
    changePassword(current: $current, new: $new) { ok errors { field message } }
  }
`);
const StartMfaDocument = graphql(`
  mutation StartMfaSetup { startMfaSetup { secret uri qrSvg } }
`);
const ConfirmMfaDocument = graphql(`
  mutation ConfirmMfaSetup($code: String!) {
    confirmMfaSetup(code: $code) { codes errors { field message } }
  }
`);
const DisableMfaDocument = graphql(`
  mutation DisableMfa($password: String!) {
    disableMfa(password: $password) { ok errors { field message } }
  }
`);
const NewCodesDocument = graphql(`
  mutation NewRecoveryCodes($code: String!) {
    newRecoveryCodes(code: $code) { codes errors { field message } }
  }
`);

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const text = codes.join("\n");
  return (
    <div className="space-y-4">
      <Notice tone="warning" title="Save these recovery codes now">
        Each code signs you in once if you lose your phone. They will not be shown again.
      </Notice>
      <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-subtle/60 p-4 font-mono text-sm sm:grid-cols-5">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(text)}>Copy</Button>
        <a className="inline-flex h-10 items-center rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink shadow-sm hover:bg-subtle"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text + "\n")}`} download="recovery-codes.txt">Download</a>
        <Button onClick={onDone}>I have saved them</Button>
      </div>
    </div>
  );
}

function TwoStepCard() {
  const { me, reset } = useSession();
  const [, start] = useMutation(StartMfaDocument);
  const [, confirm] = useMutation(ConfirmMfaDocument);
  const [, disable] = useMutation(DisableMfaDocument);
  const [, newCodes] = useMutation(NewCodesDocument);
  const [setup, setSetup] = useState<{ secret: string; uri: string; qrSvg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"idle" | "disable" | "codes">("idle");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (!me) return null;

  async function run<T>(work: () => Promise<T>) {
    setBusy(true);
    setError(undefined);
    try {
      return await work();
    } finally {
      setBusy(false);
    }
  }

  if (codes) {
    return (
      <Card title="Two-step sign-in">
        <RecoveryCodes codes={codes} onDone={() => { setCodes(null); setSetup(null); setMode("idle"); reset(); }} />
      </Card>
    );
  }

  return (
    <Card title={<span className="flex items-center gap-2"><IconLock size={15} className="text-muted" />Two-step sign-in</span>}
      actions={me.mfaEnabled ? <Badge tone="good" dot>On</Badge> : <Badge>Off</Badge>}>
      {error && <div className="mb-4"><ErrorNote error={error} /></div>}
      {me.mfaEnabled ? (
        mode === "idle" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Signing in asks for a code from your authenticator app. {me.recoveryCodesLeft} recovery {me.recoveryCodesLeft === 1 ? "code" : "codes"} left.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setMode("codes")}>New recovery codes</Button>
              <Button variant="ghost" onClick={() => setMode("disable")}>Turn off</Button>
            </div>
          </div>
        ) : mode === "codes" ? (
          <form className="max-w-sm space-y-4" onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            const result = await run(() => newCodes({ code }));
            const problem = errorMessage(result.error) ?? result.data?.newRecoveryCodes.errors[0]?.message;
            if (problem) return setError(problem);
            setCodes(result.data?.newRecoveryCodes.codes ?? []);
            setCode("");
          }}>
            <Field label="A code from your app" hint="Your old recovery codes stop working.">
              <Input value={code} inputMode="numeric" autoComplete="one-time-code" onChange={(e) => setCode(e.target.value)} />
            </Field>
            <div className="flex gap-2"><Button type="submit" busy={busy}>Make new codes</Button><Button variant="ghost" onClick={() => setMode("idle")}>Cancel</Button></div>
          </form>
        ) : (
          <form className="max-w-sm space-y-4" onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            const result = await run(() => disable({ password }));
            const problem = errorMessage(result.error) ?? result.data?.disableMfa.errors[0]?.message;
            if (problem) return setError(problem);
            setPassword("");
            setMode("idle");
            reset();
          }}>
            <Field label="Your password" hint="Turning it off makes your account easier to break into.">
              <PasswordInput value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <div className="flex gap-2"><Button type="submit" variant="danger" busy={busy}>Turn off</Button><Button variant="ghost" onClick={() => setMode("idle")}>Cancel</Button></div>
          </form>
        )
      ) : setup ? (
        <form className="grid gap-6 sm:grid-cols-[240px_1fr]" onSubmit={async (e: FormEvent) => {
          e.preventDefault();
          const result = await run(() => confirm({ code }));
          const found: Record<string, string> = {};
          if (reportErrors(result, result.data?.confirmMfaSetup.errors, ["code"] as const, (_f, m) => { found.code = m; }, setError)) {
            if (found.code) setError(found.code);
            return;
          }
          setCodes(result.data?.confirmMfaSetup.codes ?? []);
          setCode("");
        }}>
          {/* The SVG is our own server's rendering of the QR code, not user content. */}
          <div className="grid content-start justify-items-center gap-3">
            <div className="w-full max-w-[240px] rounded-lg bg-white p-1 ring-1 ring-line [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]" dangerouslySetInnerHTML={{ __html: setup.qrSvg }} />
            {/* On the phone itself there is nothing to scan: hand the key straight to the authenticator app. */}
            <a href={setup.uri} className="text-sm font-medium text-brand-ink hover:underline sm:hidden">Open in my authenticator app</a>
          </div>
          <div className="space-y-4">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
              <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
              <li>
                Scan the code. If it will not scan, choose <strong>Enter a setup key</strong> in the app and type this key (time-based):
                <span className="mt-1.5 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-subtle px-2 py-1 font-mono text-sm tracking-wider text-ink">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try { await navigator.clipboard.writeText(setup.secret); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* copying is a convenience */ }
                  }}>{copied ? "Copied" : "Copy key"}</Button>
                </span>
              </li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <Field label="Code from the app">
              <Input value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="max-w-40 font-mono tracking-[0.3em]"
                onChange={(e) => setCode(e.target.value)} autoFocus />
            </Field>
            <div className="flex gap-2"><Button type="submit" busy={busy} icon={<IconCheck size={16} />}>Turn on</Button><Button variant="ghost" onClick={() => setSetup(null)}>Cancel</Button></div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">After your password, signing in also asks for a code from an app on your phone, so a stolen password alone is not enough.</p>
          <Button busy={busy} onClick={async () => {
            const result = await run(() => start({}));
            if (result.data) setSetup(result.data.startMfaSetup);
            else setError(errorMessage(result.error));
          }}>Set up two-step sign-in</Button>
        </div>
      )}
    </Card>
  );
}

function PasswordCard() {
  const [, change] = useMutation(ChangePasswordDocument);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    setFormError(undefined);
    if (next.length < 10) return setErrors({ new: "Use at least 10 characters." });
    setBusy(true);
    const result = await change({ current, new: next });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.changePassword.errors, ["current", "new"] as const, (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (failed) return;
    setCurrent("");
    setNext("");
    setDone(true);
  }

  return (
    <Card title="Password">
      <form onSubmit={submit} noValidate className="max-w-sm space-y-4">
        {formError && <ErrorNote error={formError} />}
        {done && <Notice tone="success">Password changed. Other devices will need to sign in again.</Notice>}
        <Field label="Current password" error={errors.current}>
          <PasswordInput value={current} autoComplete="current-password" aria-invalid={!!errors.current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" error={errors.new} hint="At least 10 characters.">
          <PasswordInput value={next} autoComplete="new-password" aria-invalid={!!errors.new} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Button type="submit" busy={busy}>Change password</Button>
      </form>
    </Card>
  );
}

export default function AccountPage() {
  const { me } = useSession();
  if (!me) return null;
  return (
    <>
      <PageHeader title="Your account" subtitle={`${me.user.fullName} · ${me.user.email}`} />
      {me.mfaSetupRequired && (
        <Notice tone="warning" title="Your role needs two-step sign-in">Set it up below to use your admin access.</Notice>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <TwoStepCard />
        <PasswordCard />
        <EmailPreferences />
        <CalendarFeeds />
      </div>
    </>
  );
}
