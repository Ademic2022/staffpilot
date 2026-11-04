import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { SITE } from "@/lib/site";

import { FAQS } from "./faqs";
import { FindCompany } from "./FindCompany";
import { CalendarMock, OrgChartMock, PhoneMock, ProfileMock, ReportMock } from "./Mockups";

const NAV = [
  ["Product", "/#product"],
  ["Leave", "/#leave"],
  ["Security", "/#security"],
  ["How it works", "/#how"],
  ["FAQ", "/#faq"],
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${light ? "bg-[#fffcf5] p-1" : ""}`}>
        <Image src={SITE.logo} alt="" width={40} height={38} className="h-auto w-full" priority />
      </span>
      <span className={`font-display text-[22px] font-semibold tracking-tight ${light ? "text-[#fffcf5]" : "text-[var(--lp-green)]"}`}>{SITE.name}</span>
    </span>
  );
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`mb-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] ${light ? "text-[var(--lp-saffron)]" : "text-[var(--lp-clay)]"}`}>
      <span className={`h-px w-6 ${light ? "bg-[var(--lp-saffron)]" : "bg-[var(--lp-clay)]"}`} />
      {children}
    </div>
  );
}

function CTA({ href, children, variant = "solid" }: { href: string; children: ReactNode; variant?: "solid" | "outline" | "light" }) {
  const styles = {
    solid: "bg-[var(--lp-green)] text-[#fffcf5] hover:bg-[var(--lp-green-2)] shadow-[0_8px_20px_-8px_rgba(15,61,46,0.6)]",
    outline: "border border-[var(--lp-green)]/25 text-[var(--lp-green)] hover:border-[var(--lp-green)] hover:bg-[var(--lp-green)]/5",
    light: "bg-[var(--lp-saffron)] text-[var(--lp-green)] hover:bg-[#f2b45a]",
  };
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition ${styles[variant]}`}>
      {children}
    </Link>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={`h-4 w-4 flex-none ${className}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m3 8.5 3.2 3L13 5" /></svg>
);

/* ------------------------------------------------------------------------- */

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--lp-rule)]/70 bg-[var(--lp-paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
        <nav className="hidden items-center gap-8 text-[14px] font-medium text-[var(--lp-muted)] lg:flex" aria-label="Main">
          {NAV.map(([label, href]) => <a key={href} href={href} className="transition hover:text-[var(--lp-green)]">{label}</a>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="px-2 text-[14px] font-semibold text-[var(--lp-green)] sm:px-3">Sign in</Link>
          <Link href="/signup" className="inline-flex min-h-10 items-center rounded-full bg-[var(--lp-green)] px-4 text-[14px] font-semibold text-[#fffcf5] transition hover:bg-[var(--lp-green-2)]">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="lp-grid relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <div className="lp-rise mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--lp-green)]/15 bg-[var(--lp-card)] py-1 pl-1 pr-3 text-[13px] text-[var(--lp-muted)]" style={{ animationDelay: "0.05s" }}>
            <span className="rounded-full bg-[var(--lp-green)] px-2 py-0.5 text-[11px] font-semibold text-[var(--lp-saffron)]">New</span>
            Payroll for Nigeria and Ghana
          </div>
          <h1 className="lp-rise font-display text-[44px] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--lp-green)] sm:text-[60px] lg:text-[68px]" style={{ animationDelay: "0.12s" }}>
            Your people,<br />
            <span className="italic text-[var(--lp-clay)]">not</span> your<br />
            paperwork.
          </h1>
          <p className="lp-rise mt-6 max-w-xl text-[18px] leading-relaxed text-[var(--lp-muted)]" style={{ animationDelay: "0.22s" }}>
            {SITE.name} is HR software for growing African companies: employee records, leave, payroll, attendance, performance
            reviews and expense claims in one secure place. Staff help themselves from their phones, managers approve in a tap, and
            HR stops chasing spreadsheets and email threads.
          </p>
          <div className="lp-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.32s" }}>
            <CTA href="/signup">Set up your company <Arrow /></CTA>
            <CTA href="#how" variant="outline">See how it works</CTA>
          </div>
          <ul className="lp-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[var(--lp-muted)]" style={{ animationDelay: "0.42s" }}>
            {["Ready in minutes", "Import from Excel", "Works on any phone"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="text-[var(--lp-green-2)]" />{t}</li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto h-[600px] w-full max-w-[520px]">
          <div className="absolute -right-16 top-6 h-80 w-80 rounded-full bg-[var(--lp-saffron)]/25 blur-3xl" aria-hidden />
          <div className="absolute -left-10 bottom-0 h-72 w-72 rounded-full bg-[var(--lp-green)]/15 blur-3xl" aria-hidden />
          <div className="lp-rise absolute left-0 top-0" style={{ animationDelay: "0.25s" }}>
            <div className="-rotate-[2deg]"><div className="lp-float"><ProfileMock /></div></div>
          </div>
          <div className="lp-rise absolute -bottom-2 -right-2 sm:-right-4" style={{ animationDelay: "0.55s" }}>
            <div className="rotate-[4deg]"><div className="lp-float" style={{ animationDelay: "1.5s" }}><PhoneMock /></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Strip() {
  const facts = [
    ["One record per person", "Job, pay history, contacts, bank details and documents"],
    ["Leave that adds up", "Balances, accruals, carry-over and public holidays"],
    ["Payroll that files", "PAYE, pension, NHF and SSNIT, payslips and bank files"],
    ["Time, reviews, expenses", "Clock-in, timesheets, review cycles and receipts"],
  ];
  return (
    <section className="border-y border-[var(--lp-rule)] bg-[var(--lp-card)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {facts.map(([t, d]) => (
          <div key={t}>
            <div className="font-display text-[19px] text-[var(--lp-green)]">{t}</div>
            <div className="mt-1 text-[14px] text-[var(--lp-muted)]">{d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Product() {
  return (
    <section id="product" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
      <div className="max-w-3xl">
        <Eyebrow>Core HR</Eyebrow>
        <h2 className="font-display text-[38px] font-medium leading-[1.08] tracking-[-0.015em] text-[var(--lp-green)] sm:text-[50px]">
          Every employee, one record. Every change, on the record.
        </h2>
        <p className="mt-5 text-[18px] leading-relaxed text-[var(--lp-muted)]">
          Hires, promotions, transfers and pay rises are dated and kept, so you can always answer who did what, from when, and who approved it.
        </p>
      </div>
      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="rounded-[28px] border border-[var(--lp-rule)] bg-[var(--lp-card)] p-8 sm:p-10"><OrgChartMock /></div>
        <div>
          <div className="font-display text-[15px] italic text-[var(--lp-clay)]">01 — Records and structure</div>
          <h3 className="mt-2 font-display text-[30px] font-medium leading-tight text-[var(--lp-green)]">From the org chart down to the last certificate.</h3>
          <ul className="mt-6 space-y-3.5 text-[16px] text-[var(--lp-ink)]">
            {[
              "Legal entities, offices, departments, job titles and grades. One company or a whole group.",
              "Effective-dated job and pay history: promotions and transfers take effect on the right day, even when entered early.",
              "Emergency contacts, bank details and ID numbers, with the numbers encrypted and masked.",
              "Your own fields for anything else you track: T-shirt size, badge number, background check.",
              "Contracts, IDs and permits on each record, with reminders 30 and 7 days before they expire.",
              "Bring everyone in from Excel. Every row is checked first, so a bad file never half-imports.",
            ].map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 text-[var(--lp-green-2)]" />{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Leave() {
  return (
    <section id="leave" className="scroll-mt-20 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[var(--lp-green)]">
        <div className="lp-grain grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
          <div>
            <div className="font-display text-[15px] italic text-[var(--lp-saffron)]">02 — Leave and time off</div>
            <h3 className="mt-2 font-display text-[30px] font-medium leading-tight text-[#fffcf5] sm:text-[36px]">Requested in seconds. Approved before lunch.</h3>
            <ul className="mt-6 space-y-3.5 text-[16px] text-white/85">
              {[
                "Staff see exactly how many days a request uses, after weekends and public holidays, before they send it.",
                "Approvals go up the reporting line, one level or three. Away? Hand your approvals to a colleague.",
                "Balances keep themselves: yearly or monthly accrual, pro-rata for joiners, carry-over limits, long-service days.",
                "A team calendar shows who is off. Colleagues see that someone is away, never why.",
                "Everyone is told by email and in the app, at every step.",
              ].map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 text-[var(--lp-saffron)]" />{t}</li>)}
            </ul>
          </div>
          <CalendarMock />
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    ["Self-service", "Employees update their contact details; name, bank and ID changes go to HR to approve."],
    ["Manager view", "Line managers see their own team: records, leave and approvals. Nothing else."],
    ["Reports", "Headcount, joiners and leavers, attrition, leave taken, workforce make-up and pay totals. PDF, Excel or CSV."],
    ["Directory and org chart", "Everyone can find a colleague's role, team and work email. Personal details stay private."],
    ["Payroll", "Gross-to-net for Nigeria and Ghana: PAYE, pension, NHF and SSNIT, maker-checker approval, payslips and bank files."],
    ["Attendance and timesheets", "Clock in from a phone with an optional site check, shifts and overtime, and weekly hours by project."],
    ["Performance", "Goals and key results, self, manager and peer reviews, calibration, feedback and one-to-ones."],
    ["Expense claims", "Receipts from a phone camera, limits by category, manager and finance approval, paid back with pay."],
  ];
  return (
    <section className="mt-24 border-y border-[var(--lp-rule)] bg-[var(--lp-card)] lg:mt-32">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Everything around it</Eyebrow>
            <h2 className="font-display text-[36px] font-medium leading-[1.1] tracking-[-0.01em] text-[var(--lp-green)] sm:text-[44px]">Built for how growing teams actually run.</h2>
          </div>
          <div className="w-full max-w-sm"><ReportMock /></div>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-rule)] bg-[var(--lp-rule)] sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([t, d], i) => (
            <div key={t} className="bg-[var(--lp-card)] p-6 transition hover:bg-[var(--lp-paper)]">
              <div className="font-display text-[13px] text-[var(--lp-clay)]">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-3 text-[17px] font-semibold text-[var(--lp-green)]">{t}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--lp-muted)]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Create your company", "Choose your web address. We set up your legal entity, standard leave types and document categories to start from.", "5 minutes"],
    ["Bring your people", "Fill in the Excel template, or export from what you use now. Fix anything flagged, then import everyone at once.", "Same day"],
    ["Invite your team", "Invite HR, managers and staff by email. Each sees exactly what their role allows.", "From day one"],
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-display text-[38px] font-medium leading-[1.08] text-[var(--lp-green)] sm:text-[48px]">Up and running in an afternoon.</h2>
        <p className="mt-4 text-[17px] text-[var(--lp-muted)]">No installation, no consultants, no long onboarding.</p>
      </div>
      <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        <div className="absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-[var(--lp-rule)] md:block" aria-hidden />
        {steps.map(([t, d, time], i) => (
          <li key={t} className="relative">
            <div className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-[var(--lp-green)] bg-[var(--lp-paper)] font-display text-[22px] text-[var(--lp-green)]">{i + 1}</div>
            <div className="mt-6 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[24px] text-[var(--lp-green)]">{t}</h3>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-clay)]">{time}</span>
            </div>
            <p className="mt-2 text-[15.5px] leading-relaxed text-[var(--lp-muted)]">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Trust() {
  const items = [
    ["Your data stays yours", "Every company's records are kept apart from every other company's, checked by automated tests."],
    ["Pay and bank details locked down", "Hidden from line managers by default. Bank and ID numbers are encrypted, and every view is logged."],
    ["Two-step sign-in", "Codes from an authenticator app, required for admins by default. Limit access to your office network if you like."],
    ["A full audit trail", "Who changed a record, approved leave, viewed pay or exported a list, and when."],
  ];
  return (
    <section id="security" className="scroll-mt-20 border-y border-[var(--lp-rule)] bg-[#efe6d4]">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-32">
        <div>
          <Eyebrow>Trust and security</Eyebrow>
          <h2 className="font-display text-[38px] font-medium leading-[1.08] text-[var(--lp-green)] sm:text-[46px]">People data deserves better than a shared drive.</h2>
          <p className="mt-5 text-[17px] text-[var(--lp-muted)]">Salaries, IDs and medical notes. Here is how we keep them safe.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-[var(--lp-rule)] bg-[var(--lp-card)] p-6">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--lp-clay)]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" />
              </svg>
              <div className="mt-4 text-[17px] font-semibold text-[var(--lp-green)]">{t}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--lp-muted)]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SignIn({ companyUrl }: { companyUrl: string }) {
  return (
    <section id="signin" className="mx-auto max-w-3xl scroll-mt-20 px-5 pt-24 text-center sm:px-8">
      <Eyebrow>Already using {SITE.name}?</Eyebrow>
      <h2 className="font-display text-[30px] font-medium text-[var(--lp-green)]">Sign in at your company&apos;s own address.</h2>
      <p className="mt-3 text-[16px] text-[var(--lp-muted)]">It is in your invitation email. Ask your HR team if you cannot find it.</p>
      <FindCompany companyUrl={companyUrl} />
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
      <div className="text-center">
        <Eyebrow>Questions</Eyebrow>
        <h2 className="font-display text-[38px] font-medium leading-[1.08] text-[var(--lp-green)] sm:text-[46px]">What HR teams ask us first.</h2>
      </div>
      <div className="mt-12 divide-y divide-[var(--lp-rule)] border-y border-[var(--lp-rule)]">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-semibold text-[var(--lp-green)] [&::-webkit-details-marker]:hidden">
              {q}
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-[var(--lp-rule)] text-[var(--lp-green)] transition group-open:rotate-45 group-open:bg-[var(--lp-green)] group-open:text-white">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M8 3v10M3 8h10" /></svg>
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-[var(--lp-muted)]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="lp-grain relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[var(--lp-green)] px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[var(--lp-saffron)]/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-[38px] font-medium leading-[1.06] text-[#fffcf5] sm:text-[54px]">
            Close the spreadsheet. <span className="italic text-[var(--lp-saffron)]">Open</span> the people side of your business.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] text-white/75">Set up your company, import your team today, and run leave through it this month.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CTA href="/signup" variant="light">Set up your company <Arrow /></CTA>
            <a href={`mailto:${SITE.contactEmail}?subject=Demo%20request`} className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10">
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const cols: [string, [string, string][]][] = [
    ["Product", [["Core HR", "/#product"], ["Leave", "/#leave"], ["Security", "/#security"], ["FAQ", "/#faq"]]],
    ["Get started", [["Set up your company", "/signup"], ["Sign in", "/login"], ["How it works", "/#how"]]],
    ["Company", [["Contact", `mailto:${SITE.contactEmail}`], ["Privacy policy", "/privacy"], ["Terms of service", "/terms"]]],
  ];
  return (
    <footer className="border-t border-[var(--lp-rule)] bg-[var(--lp-card)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[var(--lp-muted)]">{SITE.tagline}.</p>
          <p className="mt-4 text-[14px]"><a href={`mailto:${SITE.contactEmail}`} className="font-medium text-[var(--lp-green)] hover:underline">{SITE.contactEmail}</a></p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-ink)]">{title}</div>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[var(--lp-muted)]">
              {links.map(([l, h]) => <li key={l}><a href={h} className="transition hover:text-[var(--lp-green)]">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--lp-rule)]">
        <div className="mx-auto max-w-7xl px-5 py-6 text-[13px] text-[var(--lp-muted)] sm:px-8">
          © {new Date().getFullYear()} {SITE.name}. Made for growing teams across Africa.
        </div>
      </div>
    </footer>
  );
}

/** companyUrl: a company's address with "{slug}" in place of its name, e.g. "https://{slug}.example.com". */
export function Landing({ companyUrl }: { companyUrl: string }) {
  return (
    <div className="lp min-h-screen overflow-x-clip">
      <a href="#product" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <Header />
      <main>
        <Hero />
        <Strip />
        <Product />
        <Leave />
        <Features />
        <HowItWorks />
        <Trust />
        <SignIn companyUrl={companyUrl} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
