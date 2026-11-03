"use client";

import Image from "next/image";
import { createContext, useContext, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

import { initials } from "@/lib/format";
import { useSession } from "@/lib/session";
import { SITE } from "@/lib/site";

const DEFAULT_BRAND = "#0f3d2e";

/** White or near-black text, whichever reads better on the tenant's colour. */
function textOn(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#ffffff";
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#14181a" : "#ffffff";
}

/** Split-screen frame for sign-in pages: the company's identity on one side, the form on the other. */
interface Aside {
  heading: string;
  text: string;
  points?: string[];
}

/** The product's own mark, for pages on the platform's address (no company yet). */
function ProductMark() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1">
      <Image src={SITE.logo} alt="" width={44} height={42} className="h-auto w-full" priority />
    </span>
  );
}

export function AuthShell({ title, subtitle, children, footer, aside, wide }: {
  title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
  /** Room for a longer form, such as sign-up. */
  wide?: boolean;
  /** What the brand panel says. Defaults suit a company's sign-in page. */
  aside?: Aside;
}) {
  const { tenant, loading } = useSession();
  const brand = tenant?.primaryColor || DEFAULT_BRAND;
  const ink = textOn(brand);

  return (
    // On wide screens the page itself never scrolls: the brand panel stays put and only the
    // form column scrolls. On phones the two stack and the page scrolls as usual.
    <div className="min-h-screen bg-background lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden" style={{ ["--brand" as string]: brand }}>
      {/* Identity panel */}
      <aside className="relative overflow-hidden" style={{ backgroundColor: brand, color: ink }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)` }}
        />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full border-[56px] border-current opacity-[0.06]" />
        {/* One block, centred both ways, so the panel reads as a whole on any screen width. */}
        <div className={`relative flex h-full flex-col px-6 py-6 sm:px-10 lg:items-center lg:justify-center lg:px-12 lg:py-12 ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
          <div className="w-full lg:max-w-[440px]">
            <div className="flex items-center gap-4">
              {tenant?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
              ) : tenant ? (
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 font-display text-lg font-semibold ring-1 ring-inset ring-white/25">
                  {initials(tenant.name)}
                </span>
              ) : (
                <ProductMark />
              )}
              <div className="min-w-0 truncate font-display text-lg font-semibold leading-tight sm:text-xl">{tenant?.name ?? SITE.name}</div>
            </div>

            <div className="hidden lg:mt-14 lg:block">
              <div className="h-px w-12 bg-current opacity-40" />
              <p className="mt-6 max-w-sm font-display text-[34px] font-medium leading-[1.15] tracking-[-0.01em]">
                {aside?.heading ?? "Your people, their jobs and their pay, in one secure place."}
              </p>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed opacity-75">
                {aside?.text ?? (tenant
                  ? `For employees and managers at ${tenant.name}. Sign in with your work email address.`
                  : "Sign in with your work email address.")}
              </p>
              {aside?.points && (
                <ul className="mt-8 space-y-3 text-[15px]">
                  {aside.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 flex-none opacity-80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m3 8.5 3.2 3L13 5" /></svg>
                      <span className="opacity-90">{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-6 sm:px-10 lg:h-dvh lg:overflow-y-auto">
        <div className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className={`w-full ${wide ? "max-w-[460px]" : "max-w-[400px]"}`}>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.01em] text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 border-t border-line pt-6 text-sm text-muted">{footer}</div>}
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-line py-5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
            Encrypted connection. HR will never ask for your password.
          </span>
        </footer>
      </main>
    </div>
  );
}

const FieldId = createContext<string | undefined>(undefined);

export function AuthField({ label, action, error, children }: { label: string; action?: ReactNode; error?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        {action}
      </div>
      <FieldId.Provider value={id}>{children}</FieldId.Provider>
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputClass =
  "block h-12 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-red-500 dark:focus:border-[color-mix(in_srgb,var(--brand),white_40%)]";

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const id = useContext(FieldId);
  const invalid = props["aria-invalid"] === true;
  return <input id={id} aria-describedby={invalid ? `${id}-error` : undefined} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const id = useContext(FieldId);
  const invalid = props["aria-invalid"] === true;
  return (
    <div className="relative">
      <input id={id} aria-describedby={invalid ? `${id}-error` : undefined} {...props} type={visible ? "text" : "password"} className={`${inputClass} pr-16`} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute inset-y-0 right-0 px-3.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function AuthButton({ busy, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-snug text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
      <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="8" cy="8" r="6.25" /><path d="M8 4.75v3.75M8 11h.01" strokeLinecap="round" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
