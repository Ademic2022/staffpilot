"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";

import { passkeyProblem, signWithPasskey } from "@/components/account/Passkeys";
import { FindWorkspace } from "@/components/auth/FindWorkspace";
import { Notice } from "@/components/ui";
import { AuthAlert, AuthButton, AuthField, AuthInput, AuthShell, PasswordInput } from "@/components/auth/AuthShell";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { safeNext } from "@/lib/safeNext";
import { useSession } from "@/lib/session";

const LoginDocument = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      mfaRequired passkeyAvailable appAvailable
      me { permissions }
      errors { field message }
    }
  }
`);

const VerifyMfaDocument = graphql(`
  mutation VerifyMfa($code: String!) {
    verifyMfa(code: $code) {
      me { permissions }
      errors { field message }
    }
  }
`);

const StartPasskeyDocument = graphql(`
  mutation StartPasskeySignIn { startPasskeySignIn }
`);

const VerifyPasskeyDocument = graphql(`
  mutation VerifyPasskey($response: JSON!) {
    verifyPasskey(response: $response) {
      me { permissions }
      errors { field message }
    }
  }
`);

interface Ways { passkey: boolean; app: boolean }

/** The second step: a passkey, a code from the authenticator app, or a recovery code. */
function CodeStep({ ways, onDone, onRestart }: { ways: Ways; onDone: () => void; onRestart: (why?: string) => void }) {
  const [, verify] = useMutation(VerifyMfaDocument);
  const [, startPasskey] = useMutation(StartPasskeyDocument);
  const [, verifyPasskey] = useMutation(VerifyPasskeyDocument);
  const [code, setCode] = useState("");
  // Without the app, a typed code can only be a recovery code.
  const [recovery, setRecovery] = useState(!ways.app);
  const [typing, setTyping] = useState(!ways.passkey);
  const [usingPasskey, setUsingPasskey] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // Set at once, unlike state: a quick double Enter would otherwise send the code twice, and a code
  // works only once, so the second send would come back as "already used".
  const sending = useRef(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (sending.current) return;
    if (!code.trim()) return setError(recovery ? "Enter one of your recovery codes." : "Enter the 6-digit code.");
    sending.current = true;
    setBusy(true);
    setError(undefined);
    const result = await verify({ code: code.trim() });
    const failure = result.data?.verifyMfa.errors[0];
    const problem = errorMessage(result.error) ?? failure?.message;
    if (failure || problem) {
      sending.current = false;
      setBusy(false);
    }
    // The password step has expired (or was replaced by a sign-in in another tab): no code can work, so start over.
    if (failure?.field === "restart") return onRestart(failure.message);
    if (problem) {
      setCode("");
      return setError(problem);
    }
    onDone(); // stays busy until Home appears
  }

  async function usePasskey() {
    if (sending.current) return;
    sending.current = true;
    setUsingPasskey(true);
    setError(undefined);
    const fail = (message?: string) => { sending.current = false; setUsingPasskey(false); if (message) setError(message); };
    const options = await startPasskey({});
    if (!options.data?.startPasskeySignIn) return fail(errorMessage(options.error) ?? "Sign in again.");
    let response;
    try {
      response = await signWithPasskey(options.data.startPasskeySignIn);
    } catch (err) {
      return fail(passkeyProblem(err));
    }
    const result = await verifyPasskey({ response });
    const failure = result.data?.verifyPasskey.errors[0];
    if (failure?.field === "restart") { fail(); return onRestart(failure.message); }
    const problem = errorMessage(result.error) ?? failure?.message;
    if (problem) return fail(problem);
    onDone(); // stays busy until Home appears
  }

  if (!typing) {
    return (
      <div className="space-y-5">
        {error && <AuthAlert>{error}</AuthAlert>}
        <AuthButton type="button" busy={usingPasskey} onClick={usePasskey}>Use your passkey</AuthButton>
        <button type="button" onClick={() => { setTyping(true); setError(undefined); }} className="block w-full text-center text-sm font-medium text-brand-ink hover:underline">
          {ways.app ? "Enter a code instead" : "Use a recovery code"}
        </button>
        <button type="button" onClick={() => onRestart()} className="block w-full text-center text-sm text-muted hover:text-ink">Start again</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && <AuthAlert>{error}</AuthAlert>}
      <AuthField label={recovery ? "Recovery code" : "Code from your authenticator app"}
        action={ways.app ? <button type="button" className="text-sm font-medium text-brand-ink hover:underline" onClick={() => { setRecovery(!recovery); setCode(""); setError(undefined); }}>
          {recovery ? "Use the app instead" : "Use a recovery code"}
        </button> : undefined}>
        <AuthInput value={code} onChange={(e) => setCode(e.target.value)} autoFocus autoComplete="one-time-code"
          inputMode={recovery ? "text" : "numeric"} maxLength={recovery ? 12 : 6} placeholder={recovery ? "abcd-efgh" : "123456"}
          className="text-center font-mono text-lg tracking-[0.3em]" />
      </AuthField>
      <AuthButton type="submit" busy={busy}>Verify</AuthButton>
      {ways.passkey && (
        <button type="button" onClick={() => { setTyping(false); setError(undefined); }} className="block w-full text-center text-sm font-medium text-brand-ink hover:underline">Use your passkey instead</button>
      )}
      <button type="button" onClick={() => onRestart()} className="block w-full text-center text-sm text-muted hover:text-ink">Start again</button>
    </form>
  );
}

const schema = z.object({
  email: z.email("Enter your work email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { tenant, me, loading, reset, failed } = useSession();
  // Already signed in (the Back button, a second tab, or a sign-in just finishing): go on to the app.
  useEffect(() => {
    if (!loading && me) router.replace(safeNext(params.get("next")));
  }, [loading, me, router, params]);
  const [, login] = useMutation(LoginDocument);
  const [formError, setFormError] = useState<string>();
  const [needsCode, setNeedsCode] = useState<Ways | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(undefined);
    const result = await login({ input: values });
    const problem = errorMessage(result.error) ?? result.data?.login.errors[0]?.message;
    if (problem) {
      setFormError(problem);
      return;
    }
    if (result.data?.login.mfaRequired) {
      setNeedsCode({ passkey: result.data.login.passkeyAvailable, app: result.data.login.appAvailable });
      return;
    }
    finish();
  }

  function finish() {
    // A full page load, not router.replace: the router may still hold the signed-out answer for the
    // next page (a redirect back here, from before the session cookie existed), which left people
    // stuck on "Verifying" until they reloaded. A fresh load also starts with a clean cache.
    window.location.replace(safeNext(params.get("next")));
  }

  // No connection (a weak signal, the app waking up): say so, rather than "find your company".
  if (failed) {
    return (
      <AuthShell title="Sign in" subtitle="StaffPilot could not be reached. Check your connection, then try again.">
        <AuthButton type="button" onClick={() => reset()}>Try again</AuthButton>
      </AuthShell>
    );
  }
  // The platform's own address has no company to sign in to: find yours first.
  if (!loading && !tenant) return <FindWorkspace />;

  if (needsCode) {
    return (
      <AuthShell title="Two-step sign-in" subtitle={needsCode.passkey
        ? "Confirm it is you with your passkey: Face ID, Touch ID, Windows Hello, your phone or a security key."
        : "Open your authenticator app and enter the code for this account."}>
        <CodeStep ways={needsCode} onDone={finish} onRestart={(why) => { setNeedsCode(null); setFormError(why); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle={tenant ? `Welcome to ${tenant.name}.` : "Sign in with your work email."}
      footer={<p>New here? Use the link in your invitation email to choose a password.</p>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        {params.get("set") && !formError ? <Notice tone="success">Password saved. Sign in with it now.</Notice> : null}
        <AuthField label="Work email" error={errors.email?.message}>
          <AuthInput type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus
            placeholder="you@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </AuthField>
        <AuthField label="Password" error={errors.password?.message}
          action={<Link href="/forgot-password" className="text-sm font-medium text-brand-ink hover:underline">Forgot password?</Link>}>
          <PasswordInput autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        </AuthField>
        <AuthButton type="submit" busy={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</AuthButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
