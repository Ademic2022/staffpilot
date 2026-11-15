"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { AuthAlert, AuthButton, AuthField, AuthShell, PasswordInput } from "@/components/auth/AuthShell";
import { Loading } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { useMounted } from "@/lib/session";

const PasswordLinkDocument = graphql(`
  query PasswordLink($uid: String!, $token: String!) {
    passwordLink(uid: $uid, token: $token)
  }
`);

const SetPasswordDocument = graphql(`
  mutation SetPassword($input: SetPasswordInput!) {
    setPassword(input: $input) { ok errors { field message } }
  }
`);

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const mounted = useMounted();
  const uid = params.get("u") ?? "";
  const token = params.get("t") ?? "";
  const [{ data, fetching }] = useQuery({ query: PasswordLinkDocument, variables: { uid, token }, pause: !mounted || !uid || !token });
  const [, setPassword] = useMutation(SetPasswordDocument);
  const [password, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (!mounted || fetching) return <AuthShell title="Choose a password"><Loading shape="form" /></AuthShell>;
  const email = data?.passwordLink;
  if (!email) {
    return (
      <AuthShell title="This link has expired" subtitle="Links work for three days and only once."
        footer={<Link href="/login" className="font-medium text-brand-ink hover:underline">Back to sign in</Link>}>
        <Link href="/forgot-password" className="font-semibold text-brand-ink hover:underline">Send me a new link</Link>
      </AuthShell>
    );
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError(undefined);
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The two passwords are not the same.");
    setBusy(true);
    const result = await setPassword({ input: { uid, token, password } });
    setBusy(false);
    const problem = errorMessage(result.error) ?? result.data?.setPassword.errors[0]?.message;
    if (problem) return setError(problem);
    router.replace(`/login?email=${encodeURIComponent(email ?? "")}&set=1`);
  }

  return (
    <AuthShell title="Choose a password" subtitle={`For ${email}.`}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <AuthAlert>{error}</AuthAlert>}
        <AuthField label="New password">
          <PasswordInput autoComplete="new-password" autoFocus value={password} onChange={(e) => setPw(e.target.value)} />
        </AuthField>
        <AuthField label="The same again">
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </AuthField>
        <p className="text-xs text-muted">At least 10 characters. A few unrelated words make a strong, memorable password.</p>
        <AuthButton type="submit" busy={busy}>Save password</AuthButton>
      </form>
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
