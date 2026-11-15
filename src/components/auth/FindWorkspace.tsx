"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useMutation } from "urql";

import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";

import { AuthAlert, AuthButton, AuthField, AuthInput, AuthShell } from "./AuthShell";

const EmailCompaniesDocument = graphql(`
  mutation EmailMyCompanies($email: String!) {
    emailMyCompanies(email: $email)
  }
`);

const noop = () => () => {};

/** The platform address has no company, so signing in starts by finding yours. */
export function FindWorkspace() {
  // The platform's address (e.g. "staffpilot.site" or "localhost:3000"); company addresses sit below
  // it. This page only shows there, but people may arrive on www. or app.
  const host = useSyncExternalStore(noop, () => window.location.host.replace(/^(www|app)\./, ""), () => "");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, emailCompanies] = useMutation(EmailCompaniesDocument);
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  function go(e: FormEvent) {
    e.preventDefault();
    if (!clean) return setError("Enter your company's web name.");
    // Another address (the company's own), so a full page load.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${window.location.protocol}//${clean}.${host}/login`);
  }

  async function sendLinks(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter your work email address.");
    setBusy(true);
    setError(undefined);
    const result = await emailCompanies({ email: email.trim() });
    setBusy(false);
    if (result.error) return setError(errorMessage(result.error));
    setSent(true);
  }

  return (
    <AuthShell title="Sign in" subtitle="Each company has its own address. Go to yours to sign in."
      aside={{
        heading: "Every company gets its own private workspace.",
        text: "Your company's address is in your invitation email, and looks like yourcompany." + (host || "example.com") + ".",
      }}
      footer={<p>New here? <Link href="/signup" className="font-medium text-brand-ink hover:underline">Set up your company</Link>.</p>}>
      <div className="space-y-8">
        {error && <AuthAlert>{error}</AuthAlert>}
        <form onSubmit={go} noValidate className="space-y-4">
          <AuthField label="Your company's web address">
            <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-line bg-surface focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="yourcompany" autoFocus autoCapitalize="none" spellCheck={false}
                aria-label="Company web name" className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none placeholder:text-muted/60" />
              <span className="flex items-center border-l border-line bg-subtle px-3.5 text-[15px] text-muted">.{host}</span>
            </div>
          </AuthField>
          <AuthButton type="submit">Continue</AuthButton>
        </form>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted">
          <span className="h-px flex-1 bg-line" />Forgot the address?<span className="h-px flex-1 bg-line" />
        </div>

        {sent ? (
          <p className="rounded-lg border border-line bg-subtle/60 px-4 py-3 text-sm text-ink">
            If {email.trim()} belongs to any company here, we have emailed you a link to each. Check your inbox.
          </p>
        ) : (
          <form onSubmit={sendLinks} noValidate className="space-y-4">
            <AuthField label="Email me my sign-in links">
              <AuthInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />
            </AuthField>
            <button type="submit" disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-line-strong bg-surface text-[15px] font-semibold text-ink transition hover:bg-subtle disabled:opacity-60">
              {busy ? "Sending…" : "Send links"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
