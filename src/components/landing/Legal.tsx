import type { CSSProperties, ReactNode } from "react";

import { Footer, Header } from "@/components/landing/Landing";
import "@/components/landing/landing.css";

const tones = { "--brand": "#0f3d2e", "--brand-ink": "#175a43" } as CSSProperties;

/** A public legal page (privacy policy, terms) in the marketing site's frame. */
export function LegalPage({ eyebrow, title, updated, intro, children }: {
  eyebrow: string; title: string; updated: string; intro: ReactNode; children: ReactNode;
}) {
  return (
    <div className="lp min-h-screen overflow-x-clip" style={tones}>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-clay)]">{eyebrow}</p>
        <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.06] text-[var(--lp-green)] sm:text-[52px]">{title}</h1>
        <p className="mt-4 text-[14px] text-[var(--lp-muted)]">Last updated {updated}</p>
        <div className="mt-6 text-[18px] leading-relaxed text-[var(--lp-muted)]">{intro}</div>
        <div className="legal mt-12 grid gap-10 text-[16px] leading-relaxed text-[var(--lp-ink)]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

/** One numbered section of a legal page. */
export function Clause({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h2 id={`${id}-h`} className="font-display text-[24px] font-medium text-[var(--lp-green)]">{title}</h2>
      <div className="mt-3 grid gap-3 [&_a]:font-medium [&_a]:text-[var(--lp-green-2)] [&_a]:underline [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
