"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";

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
      mfaRequired
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

/** The second step: a code from the authenticator app, or a recovery code. */
function CodeStep({ onDone, onRestart }: { onDone: () => void; onRestart: (why?: string) => void }) {
  const [, verify] = useMutation(VerifyMfaDocument);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!code.trim()) return setError(recovery ? "Enter one of your recovery codes." : "Enter the 6-digit code.");
    setBusy(true);
    setError(undefined);
    const result = await verify({ code: code.trim() });
    setBusy(false);
    const failure = result.data?.verifyMfa.errors[0];
    // The password step has expired (or was replaced by a sign-in in another tab): no code can work, so start over.
    if (failure?.field === "restart") return onRestart(failure.message);
    const problem = errorMessage(result.error) ?? failure?.message;
    if (problem) {
      setCode("");
      return setError(problem);
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && <AuthAlert>{error}</AuthAlert>}
      <AuthField label={recovery ? "Recovery code" : "Code from your authenticator app"}
        action={<button type="button" className="text-sm font-medium text-brand-ink hover:underline" onClick={() => { setRecovery(!recovery); setCode(""); setError(undefined); }}>
          {recovery ? "Use the app instead" : "Use a recovery code"}
        </button>}>
        <AuthInput value={code} onChange={(e) => setCode(e.target.value)} autoFocus autoComplete="one-time-code"
          inputMode={recovery ? "text" : "numeric"} maxLength={recovery ? 12 : 6} placeholder={recovery ? "abcd-efgh" : "123456"}
          className="text-center font-mono text-lg tracking-[0.3em]" />
      </AuthField>
      <AuthButton type="submit" busy={busy}>Verify</AuthButton>
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
  const { tenant, loading, reset } = useSession();
  const [, login] = useMutation(LoginDocument);
  const [formError, setFormError] = useState<string>();
  const [needsCode, setNeedsCode] = useState(false);
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
      setNeedsCode(true);
      return;
    }
    finish();
  }

  function finish() {
    reset();
    router.replace(safeNext(params.get("next")));
  }

  // The platform's own address has no company to sign in to: find yours first.
  if (!loading && !tenant) return <FindWorkspace />;

  if (needsCode) {
    return (
      <AuthShell title="Two-step sign-in" subtitle="Open your authenticator app and enter the code for this account.">
        <CodeStep onDone={finish} onRestart={(why) => { setNeedsCode(false); setFormError(why); }} />
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
