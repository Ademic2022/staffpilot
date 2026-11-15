"use client";

import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { cx } from "@/components/ui";

/**
 * How long someone has been here, at a glance: a coloured frame around their photo, a corner
 * mark for the newest people (🌱), the longest-serving (👑) and the founding team (⭐), and a
 * short label. Worked out from the hire date, so it is always current; the company can switch it
 * off (Settings → Company → General settings). Colour is never the only signal: every tier has a
 * label or a tooltip in words.
 */

export type TenureTier = {
  key: "new" | "bronze" | "silver" | "gold" | "og" | "founding";
  years: number;
  /** Shown beside the name; null for the quiet middle tiers. */
  label: string | null;
  /** For the tooltip: "Joined 3 Mar 2018 · 8 years 8 months". */
  detail: string;
  color: string;
  mark: string | null;
};

const NEW_DAYS = 90;
const GOLD = "#d4a017";

function between(since: string, now: Date) {
  const start = new Date(`${since}T00:00:00`);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return { months, days };
}

function spoken(months: number, days: number) {
  if (months < 1) return days === 1 ? "1 day" : `${days} days`;
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y} year${y === 1 ? "" : "s"}`, m && `${m} month${m === 1 ? "" : "s"}`].filter(Boolean).join(" ");
}

/** The tier for a hire date, or null before someone has started (and between 90 days and a year). */
export function tenureTier(hireDate: string | null | undefined, founding = false, now = new Date()): TenureTier | null {
  if (!hireDate) return null;
  const { months, days } = between(hireDate, now);
  if (days < 0) return null;
  const years = Math.floor(months / 12);
  const detail = `${founding ? "Founding team · " : ""}Joined ${formatDate(hireDate)} · ${spoken(months, days)}`;
  if (founding) return { key: "founding", years, label: years >= 1 ? `Founding team · ${years} yrs` : "Founding team", detail, color: GOLD, mark: "⭐" };
  if (days < NEW_DAYS) return { key: "new", years, label: "New", detail, color: "#10b981", mark: "🌱" };
  if (years >= 10) return { key: "og", years, label: `OG · ${years} yrs`, detail, color: GOLD, mark: "👑" };
  if (years >= 5) return { key: "gold", years, label: `${years} yrs`, detail, color: GOLD, mark: null };
  if (years >= 3) return { key: "silver", years, label: null, detail, color: "#a3acb5", mark: null };
  if (years >= 1) return { key: "bronze", years, label: null, detail, color: "#b87333", mark: null };
  return null;
}

/** The tier to show, or null when there is none or the company has switched the marks off. */
function useTier(hireDate?: string | null, founding?: boolean) {
  const { tenant } = useSession();
  if (tenant && tenant.showTenure === false) return null;
  return tenureTier(hireDate, founding);
}

/**
 * Wraps a photo with its tenure frame and corner mark. `gap` is the space between photo and
 * frame (it takes the page background), `width` the frame's thickness; `radius` should match the
 * photo's corners. `small` is for photos under 40 px: a thinner frame and no corner mark.
 */
export function TenureFrame({ hireDate, founding, radius, gap, width, markSize = 22, small, gapColor = "var(--surface)", children, className }: {
  hireDate?: string | null; founding?: boolean; radius: string; gap?: number; width?: number; markSize?: number; small?: boolean;
  /** What is behind the photo: the card colour by default, the page background for photos on the page itself. */
  gapColor?: string; children: React.ReactNode; className?: string;
}) {
  const tier = useTier(hireDate, founding);
  if (!tier) return <>{children}</>;
  const g = gap ?? (small ? 1.5 : 3), w = width ?? (small ? 2 : 3);
  return (
    <span className={cx("relative inline-block flex-none align-middle leading-none", radius, className)} title={tier.detail}
      style={{ boxShadow: `0 0 0 ${g}px ${gapColor}, 0 0 0 ${g + w}px ${tier.color}` }}>
      {children}
      {tier.mark && !small && (
        <span aria-hidden className="absolute -right-2 -top-2 grid place-items-center rounded-full bg-surface shadow-sm ring-1 ring-line"
          style={{ width: markSize, height: markSize, fontSize: markSize * 0.58 }}>
          {tier.mark}
        </span>
      )}
      <span className="sr-only">{tier.detail}</span>
    </span>
  );
}

/** "New", "5 yrs", "OG · 12 yrs" or "Founding team" beside a name, with the full detail on hover. */
export function TenureLabel({ hireDate, founding, className, onDark }: { hireDate?: string | null; founding?: boolean; className?: string; onDark?: boolean }) {
  const tier = useTier(hireDate, founding);
  if (!tier?.label) return null;
  return (
    <span title={tier.detail} className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
      onDark ? "bg-white/15 text-white ring-white/25" : "text-ink ring-line", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
      {tier.label}
    </span>
  );
}
