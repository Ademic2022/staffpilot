/**
 * The in-app user guide. Each article says who it is for and which screens it explains, so the
 * "?" button in the header can open the right one. Articles live in ./articles, one file per audience.
 */

import { ADMIN } from "./articles/admin";
import { EMPLOYEE } from "./articles/employee";
import { MANAGER } from "./articles/manager";
import { PAYROLL } from "./articles/payroll";
import { START } from "./articles/start";

export type Audience = "employee" | "manager" | "hr" | "payroll";

export type Article = {
  slug: string;
  title: string;
  summary: string;
  audience: Audience[];
  /** Screens it explains: a path prefix, optionally with ?tab=… to match one tab. */
  paths?: string[];
  body: string;
};

export const SECTIONS: { key: string; title: string; description: string; articles: Article[] }[] = [
  { key: "start", title: "Getting started", description: "Signing in, finding your way and your account.", articles: START },
  { key: "employee", title: "For everyone", description: "Your record, time off, pay, time, expenses and reviews.", articles: EMPLOYEE },
  { key: "manager", title: "For managers", description: "Approvals, your team's time, reviews and one-to-ones.", articles: MANAGER },
  { key: "hr", title: "For HR and admins", description: "Setting up the company and looking after people's records.", articles: ADMIN },
  { key: "payroll", title: "For payroll", description: "Pay groups, payroll runs, payslips and statutory files.", articles: PAYROLL },
];

export const ARTICLES: Article[] = SECTIONS.flatMap((s) => s.articles);

export const AUDIENCE_LABEL: Record<Audience, string> = { employee: "Everyone", manager: "Managers", hr: "HR and admins", payroll: "Payroll" };

export function article(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}

export function sectionOf(slug: string) {
  return SECTIONS.find((s) => s.articles.some((a) => a.slug === slug));
}

/** The article that best explains a screen: the longest matching path, and a matching ?tab= wins. */
export function articleForPath(pathname: string, tab?: string | null): Article | undefined {
  let best: Article | undefined;
  let score = -1;
  for (const a of ARTICLES) {
    for (const p of a.paths ?? []) {
      const [path, query] = p.split("?");
      const wantTab = query?.startsWith("tab=") ? query.slice(4) : null;
      const hit = pathname === path || pathname.startsWith(`${path}/`) || (path !== "/" && pathname.startsWith(path) && path.endsWith("/"));
      if (!hit || (wantTab && wantTab !== tab)) continue;
      const s = path.length * 2 + (wantTab ? 1 : 0);
      if (s > score) { best = a; score = s; }
    }
  }
  return best;
}

/** Simple ranked search over titles, summaries and text. */
export function search(query: string, pool: Article[] = ARTICLES) {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  return pool
    .map((a) => {
      const title = a.title.toLowerCase();
      const summary = a.summary.toLowerCase();
      const body = a.body.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (title.includes(w)) score += 5;
        else if (summary.includes(w)) score += 3;
        else if (body.includes(w)) score += 1;
        else return { a, score: 0 };
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}

/** Which audience to show first, from someone's roles and permissions. */
export function audienceFor(roles: string[], can: (...p: string[]) => boolean): Audience {
  if (roles.includes("owner") || roles.includes("hr_admin")) return "hr";
  if (roles.includes("payroll_officer") || can("payroll.manage")) return "payroll";
  if (roles.includes("manager")) return "manager";
  return "employee";
}
