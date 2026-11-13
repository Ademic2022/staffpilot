"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui";
import { useSession } from "@/lib/session";

/**
 * A short guided tour of the app: the page dims, one part of the screen at a time is lit up
 * with a note beside it. Parts are found by their data-tour attribute, and a step whose part
 * is not on screen (another role, a phone layout, a feature switched off) is skipped, so each
 * person sees only what they have. It starts once, on Home, the first time someone signs in;
 * startTour() runs it again (the Help page has a button).
 */

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  { title: "Welcome to StaffPilot", body: "A one-minute look around, so you know where everything is. You can leave at any time and take the tour again from Help." },
  { target: "mfa", title: "Turn on two-step sign-in", body: "Your role needs it. Set it up on your account page and the admin tools (Settings, payroll, reports) open straight away." },
  { target: "setup", title: "Set up your company", body: "Your setup checklist. Each step links to the right page and ticks itself once it is done." },
  { target: "nav", title: "Your menu", body: "Everything you can use is here. You only see what your role allows, so it grows as you are given more." },
  { target: "search", title: "Search anything", body: "Find people, pages and settings by name. Press ⌘K (Ctrl K on Windows) from anywhere." },
  { target: "bell", title: "Things that need you", body: "Leave to approve, changes to review, payslips ready, documents to read. Everything also reaches you by email unless you turn it off." },
  { target: "help", title: "Help for the page you are on", body: "Opens the guide at the article for this page, with step-by-step instructions." },
  { target: "clock", title: "Clock in and out", body: "One click from Home. It shows whether you are clocked in and for how long." },
  { target: "profile-card", title: "Finish your profile", body: "These details make sure you are paid, can be reached in an emergency and show up properly for your team." },
  { target: "gaps", title: "Records to complete", body: "People missing bank details, a tax ID, a pension PIN or an emergency contact. Fix these before running payroll." },
  { target: "new", title: "Add things quickly", body: "Add an employee, build a report or post an announcement to everyone." },
  { target: "home-edit", title: "Make Home yours", body: "Choose, hide and rearrange the widgets on this page. Your layout is yours alone." },
  { target: "nav-settings", title: "Settings", body: "Your company, logo and colour, users and access, leave types, payroll, attendance and more. Start here when setting up." },
  { target: "me", title: "Your account", body: "Password, two-step sign-in, email notifications and calendar links. Sign out from here too." },
  { title: "You are all set", body: "That is the tour. The Help page has a guide for every part of StaffPilot whenever you need it." },
];

const START_EVENT = "staffpilot:tour";
const seenKey = (userId: string) => `staffpilot:tour-seen:${userId}`;

/** Run the tour again, from anywhere. */
export function startTour() {
  window.dispatchEvent(new Event(START_EVENT));
}

function visibleTarget(name: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

type Box = { top: number; left: number; width: number; height: number };
const PAD = 6;
const CARD_W = 320;

type Side = "right" | "below" | "above" | "over";
const ARROW = 14; // the pointer's size; the card sits this far from the lit part

/** Where the card goes, and which side of the lit part it is on (for its pointer). */
function place(box: Box | null, cardH: number): { top: number; left: number; side: Side | null } {
  const vw = window.innerWidth, vh = window.innerHeight, gap = ARROW;
  if (!box) return { top: Math.max(16, vh / 2 - cardH / 2), left: Math.max(16, vw / 2 - CARD_W / 2), side: null };
  const clampX = (x: number) => Math.min(Math.max(16, x), vw - CARD_W - 16);
  const clampY = (y: number) => Math.min(Math.max(16, y), vh - cardH - 16);
  // Beside it when there is room (the menu and other tall parts), so the card never covers what it explains.
  if (box.left + box.width + gap + CARD_W + 16 <= vw) return { top: clampY(box.top), left: box.left + box.width + gap, side: "right" };
  if (box.top + box.height + gap + cardH + 16 <= vh) return { top: box.top + box.height + gap, left: clampX(box.left), side: "below" };
  if (box.top - gap - cardH >= 16) return { top: box.top - gap - cardH, left: clampX(box.left), side: "above" };
  return { top: clampY(vh - cardH - 16), left: clampX(box.left), side: "over" };
}

/** The small pointer on the card's edge, aimed at the lit part. */
function arrowStyle(side: Side | null, box: Box | null, at: { top: number; left: number }, cardH: number): React.CSSProperties | null {
  if (!box || !side || side === "over") return null;
  const half = ARROW / 2;
  if (side === "right") {
    const y = Math.min(Math.max(box.top + Math.min(box.height / 2, 24) - at.top, 18), cardH - 18);
    return { left: -half, top: y - half };
  }
  const x = Math.min(Math.max(box.left + Math.min(box.width / 2, 40) - at.left, 18), CARD_W - 18);
  return side === "below" ? { top: -half, left: x - half } : { bottom: -half, left: x - half };
}

export function Tour() {
  const { me } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(180);
  const card = useRef<HTMLDivElement>(null);
  const userId = me?.user.id;

  const start = useCallback(() => {
    // Only the steps whose part is on screen for this person.
    setSteps(STEPS.filter((s) => !s.target || visibleTarget(s.target)));
    setIndex(0);
  }, []);

  const finish = useCallback(() => {
    setSteps(null);
    try { if (userId) localStorage.setItem(seenKey(userId), "1"); } catch { /* private mode: it may show again */ }
  }, [userId]);

  // "Take the tour" from anywhere: go Home first, where most parts are.
  useEffect(() => {
    const run = () => {
      if (window.location.pathname !== "/home") {
        router.push("/home");
        window.setTimeout(start, 900);
      } else start();
    };
    window.addEventListener(START_EVENT, run);
    return () => window.removeEventListener(START_EVENT, run);
  }, [router, start]);

  // First visit to Home: start once the page has drawn.
  useEffect(() => {
    if (!userId || pathname !== "/home") return;
    let seen = true;
    try { seen = localStorage.getItem(seenKey(userId)) === "1"; } catch { /* no storage: never auto-start */ }
    if (seen) return;
    const t = window.setTimeout(start, 1200);
    return () => window.clearTimeout(t);
  }, [userId, pathname, start]);

  const step = steps?.[index];

  /** Move to a step, passing over any whose part has since left the screen; past the end finishes. */
  const go = useCallback((to: number, dir: 1 | -1 = 1) => {
    if (!steps) return;
    let i = to;
    while (i >= 0 && i < steps.length && steps[i].target && !visibleTarget(steps[i].target!)) i += dir;
    if (i >= steps.length) return finish();
    setIndex(Math.max(0, i));
  }, [steps, finish]);

  // Light up the current part, and follow it as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!step) return;
    const el = step.target ? visibleTarget(step.target) : null;
    el?.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
    const measure = () => {
      if (!el) return setBox(null);
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step]);

  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    el.focus();
    const observer = new ResizeObserver(() => setCardH(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, steps]);

  useEffect(() => {
    if (!steps) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && index < steps.length - 1) go(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) go(index - 1, -1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [steps, index, go, finish]);

  if (!steps || !step) return null;
  const last = index === steps.length - 1;
  const at = place(step.target ? box : null, cardH);
  const arrow = arrowStyle(at.side, step.target ? box : null, at, cardH);

  return createPortal(
    <div className="fixed inset-0 z-[60]" aria-live="polite">
      {/* The dimmed page, with a hole over the part being shown. Clicks on the page are held while the tour runs. */}
      {step.target && box ? (
        <>
          <div className="absolute inset-0" />
          {/* A clear ring in the brand colour (lightened on dark pages), pulsing once as it lands. */}
          <div key={index} className="pointer-events-none absolute rounded-xl transition-all duration-200 motion-safe:animate-[tour-pulse_900ms_ease-out_1] motion-reduce:transition-none"
            style={{ ...box, boxShadow: "0 0 0 3px var(--brand-ink), 0 0 0 9999px var(--tour-dim)" }} />
        </>
      ) : <div className="absolute inset-0 bg-[var(--tour-dim)]" />}
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="tour-title" tabIndex={-1}
        className="absolute rounded-2xl border border-line-strong bg-surface p-5 shadow-2xl outline-none transition-[top,left] duration-200 motion-reduce:transition-none"
        style={{ top: at.top, left: at.left, width: CARD_W }}>
        {arrow && <span aria-hidden className="absolute h-3.5 w-3.5 rotate-45 border-line-strong bg-surface"
          style={{ ...arrow, borderWidth: at.side === "right" ? "0 0 1px 1px" : at.side === "below" ? "1px 0 0 1px" : "0 1px 1px 0" }} />}
        <p className="text-xs font-medium text-muted">{index + 1} of {steps.length}</p>
        <h2 id="tour-title" className="mt-1 text-[17px] font-semibold text-ink">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
        <div className="mt-4 flex items-center gap-1" aria-hidden>
          {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand" : "w-1.5 bg-line-strong"}`} />)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {last ? <span /> : <button type="button" onClick={finish} className="text-sm font-medium text-muted hover:text-ink">Skip tour</button>}
          <div className="flex gap-2">
            {index > 0 && <Button size="sm" variant="secondary" onClick={() => go(index - 1, -1)}>Back</Button>}
            <Button size="sm" onClick={() => (last ? finish() : go(index + 1))}>{last ? "Done" : index === 0 ? "Show me" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
