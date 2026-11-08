"use client";

import Link from "next/link";
import { useDeferredValue, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { AuthAlert, AuthButton, AuthField, AuthInput, AuthShell, PasswordInput } from "@/components/auth/AuthShell";
import { Select } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { useMounted } from "@/lib/session";

const SlugCheckDocument = graphql(`
  query SlugCheck($slug: String!) {
    slugCheck(slug: $slug)
  }
`);

const SignUpDocument = graphql(`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) { url codeSentTo errors { field message } }
  }
`);

const EmailCheckDocument = graphql(`
  query SignupEmailCheck($email: String!) {
    signupEmailCheck(email: $email) { problem freeWebmail }
  }
`);

const COUNTRIES: [string, string, string][] = [
  ["NG", "Nigeria", "NGN"], ["GH", "Ghana", "GHS"], ["KE", "Kenya", "KES"], ["ZA", "South Africa", "ZAR"],
  ["EG", "Egypt", "EGP"], ["RW", "Rwanda", "RWF"], ["UG", "Uganda", "UGX"], ["TZ", "Tanzania", "TZS"],
  ["GB", "United Kingdom", "GBP"], ["US", "United States", "USD"],
];

const toSlug = (v: string) => v.toLowerCase().replace(/\b(ltd|limited|plc|inc|llc)\b\.?/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function SignUpForm({ addressSuffix }: { addressSuffix: string }) {
  const mounted = useMounted();
  const [, signUp] = useMutation(SignUpDocument);
  const [v, setV] = useState({ company: "", slug: "", firstName: "", lastName: "", email: "", password: "", country: "NG" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v, value: string) => setV((s) => ({ ...s, [k]: value }));
  const slug = useDeferredValue(v.slug);
  const [{ data: check }] = useQuery({ query: SlugCheckDocument, variables: { slug }, pause: !mounted || slug.length < 3 });
  const slugProblem = slug.length >= 3 ? check?.slugCheck : undefined;
  // The email is looked up once the person leaves the field: typos, throwaway inboxes, Gmail hint.
  const [emailTouched, setEmailTouched] = useState(false);
  const email = useDeferredValue(v.email.trim());
  const [{ data: emailData }] = useQuery({ query: EmailCheckDocument, variables: { email },
    pause: !mounted || !emailTouched || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) });
  const emailCheck = emailTouched ? emailData?.signupEmailCheck : undefined;
  // The second step: the 6-digit code emailed to a new address.
  const [codeSentTo, setCodeSentTo] = useState<string>();
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string>();

  async function send(extra: { code?: string; resend?: boolean }) {
    setFormError(undefined);
    setNotice(undefined);
    setBusy(true);
    const currency = COUNTRIES.find((c) => c[0] === v.country)?.[2] ?? "USD";
    const result = await signUp({ input: { ...v, currency, ...extra } });
    const payload = result.data?.signUp;
    setBusy(false);
    if (result.error || !payload) return setFormError(errorMessage(result.error));
    if (payload.errors.length) {
      const found: Record<string, string> = {};
      for (const err of payload.errors) {
        if (err.field && (err.field in v || err.field === "code")) found[err.field] = err.message;
        else setFormError(err.message);
      }
      setErrors(found);
      // A problem with the form itself sends the person back to it.
      if (Object.keys(found).some((k) => k !== "code")) setCodeSentTo(undefined);
      return;
    }
    if (payload.codeSentTo) {
      setErrors({});
      setCode("");
      if (codeSentTo) setNotice("A new code is on its way.");
      return setCodeSentTo(payload.codeSentTo);
    }
    // On to the company's own address, signed in.
    window.location.assign(payload.url!);
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setErrors({ code: "Enter the 6-digit code from the email." });
    await send({ code });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const missing: Record<string, string> = {};
    if (!v.company.trim()) missing.company = "Enter your company's name.";
    if (v.slug.length < 3) missing.slug = "Choose a web address of at least 3 characters.";
    if (!v.firstName.trim()) missing.firstName = "Enter your first name.";
    if (!v.email.includes("@")) missing.email = "Enter your email address.";
    else if (emailCheck?.problem) missing.email = emailCheck.problem;
    if (v.password.length < 10) missing.password = "Use at least 10 characters.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    await send({});
  }

  if (codeSentTo) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${codeSentTo}. Enter it to create ${v.company.trim() || "your company"}.`}
        footer={<p>Wrong address? <button type="button" onClick={() => { setCodeSentTo(undefined); setErrors({}); setNotice(undefined); }}
          className="font-medium text-brand-ink hover:underline">Change it</button>.</p>}>
        <form onSubmit={confirm} noValidate className="space-y-5">
          {formError && <AuthAlert>{formError}</AuthAlert>}
          {notice && <p role="status" className="rounded-lg bg-subtle px-3.5 py-2.5 text-sm text-ink">{notice}</p>}
          <AuthField label="Code" error={errors.code}>
            <AuthInput value={code} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
              aria-invalid={!!errors.code} className="text-center font-mono text-2xl tracking-[0.5em]"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </AuthField>
          <AuthButton type="submit" busy={busy}>Confirm and create my company</AuthButton>
          <p className="text-center text-xs text-muted">
            The code works for 15 minutes. Not there? Check spam, or{" "}
            <button type="button" disabled={busy} onClick={() => send({ resend: true })} className="font-medium text-brand-ink hover:underline disabled:opacity-50">send a new code</button>.
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide title="Set up your company" subtitle="Your own workspace, ready in a minute. You can change everything later."
      aside={{
        heading: "HR that runs itself, from day one.",
        text: "Create your company's private workspace, then bring your people in from Excel and invite your team.",
        points: [
          "Your own web address and sign-in page",
          "Leave types and document categories ready to use",
          "Import your whole team from one spreadsheet",
          "Invite HR, managers and staff by email",
        ],
      }}
      footer={<p>Already set up? <Link href="/login" className="font-medium text-brand-ink hover:underline">Sign in</Link>.</p>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <AuthAlert>{formError}</AuthAlert>}
        <AuthField label="Company name" error={errors.company}>
          <AuthInput value={v.company} autoFocus aria-invalid={!!errors.company} placeholder="Bright Foods Ltd"
            onChange={(e) => { set("company", e.target.value); if (!slugEdited) set("slug", toSlug(e.target.value)); }} />
        </AuthField>
        <AuthField label="Web address" error={errors.slug ?? slugProblem ?? undefined}>
          <div className={`flex h-12 items-stretch overflow-hidden rounded-lg border bg-surface focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 ${errors.slug || slugProblem ? "border-red-500" : "border-line"}`}>
            <input value={v.slug} aria-invalid={!!(errors.slug || slugProblem)} autoCapitalize="none" spellCheck={false} placeholder="yourcompany"
              aria-label="Web address" className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none placeholder:text-muted/60"
              onChange={(e) => { setSlugEdited(true); set("slug", toSlug(e.target.value)); }} />
            <span className="flex items-center whitespace-nowrap border-l border-line bg-subtle px-3.5 text-[15px] text-muted">{addressSuffix}</span>
          </div>
          {v.slug.length >= 3 && !slugProblem && check?.slugCheck === null ? (
            <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">Available. Your team signs in at {v.slug}{addressSuffix}</p>
          ) : !errors.slug && !slugProblem && (
            <p className="mt-1.5 text-xs text-muted">Letters, numbers and hyphens. Filled in from your company name.</p>
          )}
        </AuthField>
        <div className="grid grid-cols-2 gap-4">
          <AuthField label="First name" error={errors.firstName}>
            <AuthInput value={v.firstName} autoComplete="given-name" aria-invalid={!!errors.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </AuthField>
          <AuthField label="Last name">
            <AuthInput value={v.lastName} autoComplete="family-name" onChange={(e) => set("lastName", e.target.value)} />
          </AuthField>
        </div>
        <AuthField label="Email" error={errors.email ?? emailCheck?.problem ?? undefined}>
          <AuthInput type="email" value={v.email} autoComplete="email" aria-invalid={!!(errors.email || emailCheck?.problem)} placeholder="you@company.com"
            onBlur={() => setEmailTouched(true)} onChange={(e) => { set("email", e.target.value); if (errors.email) setErrors((all) => ({ ...all, email: "" })); }} />
          {!errors.email && !emailCheck?.problem && (
            <p className="mt-1.5 text-xs text-muted">
              {emailCheck?.freeWebmail
                ? "That works. A company address (you@yourcompany.com) helps your team trust the invites you send."
                : "We will send a code to confirm it."}
            </p>
          )}
        </AuthField>
        <AuthField label="Password" error={errors.password}>
          <PasswordInput value={v.password} autoComplete="new-password" aria-invalid={!!errors.password} onChange={(e) => set("password", e.target.value)} />
        </AuthField>
        <AuthField label="Country">
          <Select value={v.country} onChange={(e) => set("country", e.target.value)} className="[&_select]:h-12">
            {COUNTRIES.map(([code, name, currency]) => <option key={code} value={code}>{name} ({currency})</option>)}
          </Select>
        </AuthField>
        <AuthButton type="submit" busy={busy}>Create my company</AuthButton>
        <p className="text-center text-xs text-muted">You become its owner. Your data stays separate from every other company&apos;s.</p>
        <p className="text-center text-xs text-muted">
          By creating a company you agree to the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-brand-ink hover:underline">terms of service</Link> and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-brand-ink hover:underline">privacy policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
