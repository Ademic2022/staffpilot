import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ARTICLES, articleForPath, search } from "./index";
import { parse } from "./render";

const APP = path.resolve(__dirname, "../app/(app)");

/** Whether a path like /settings/time-off or /employees/123 is a page in the app. */
function routeExists(route: string) {
  const parts = route.split("?")[0].split("/").filter(Boolean);
  let dir = APP;
  for (const part of parts) {
    const exact = path.join(dir, part);
    if (fs.existsSync(exact)) { dir = exact; continue; }
    const dynamic = fs.readdirSync(dir).find((d) => d.startsWith("["));
    if (!dynamic) return false;
    dir = path.join(dir, dynamic);
  }
  return fs.existsSync(path.join(dir, "page.tsx"));
}

describe("user guide", () => {
  it("has unique slugs", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("links only to articles and screens that exist", () => {
    const slugs = new Set(ARTICLES.map((a) => a.slug));
    for (const a of ARTICLES) {
      for (const [, href] of a.body.matchAll(/\]\(([^)]+)\)/g)) {
        if (href.startsWith("/help/")) expect(slugs, `${a.slug} → ${href}`).toContain(href.slice(6));
        else if (href.startsWith("/")) expect(routeExists(href), `${a.slug} → ${href}`).toBe(true);
      }
      for (const p of a.paths ?? []) expect(routeExists(p) || routeExists(`${p.replace(/\/$/, "")}/x`) || fs.existsSync(path.join(APP, p.split("?")[0])), `${a.slug} path ${p}`).toBe(true);
    }
  });

  it("finds the article for a screen", () => {
    expect(articleForPath("/settings/time-off")?.slug).toBe("time-off-setup");
    expect(articleForPath("/attendance", "timesheet")?.slug).toBe("timesheets");
    expect(articleForPath("/attendance", null)?.slug).toBe("clocking-in");
    expect(articleForPath("/employees/123")?.slug).toBe("my-profile");
    expect(articleForPath("/employees/import")?.slug).toBe("people-records");
    expect(articleForPath("/employees")?.slug).toBe("directory-and-org-chart");
    expect(articleForPath("/payroll/runs/9")?.slug).toBe("running-payroll");
    expect(articleForPath("/expenses/4")?.slug).toBe("approving-expenses");
  });

  it("searches titles before body text", () => {
    expect(search("carry over")[0]?.slug).toBe("time-off-setup");
    expect(search("bank file").map((a) => a.slug)).toContain("payroll-files");
  });

  it("reads lists, tips and headings", () => {
    const blocks = parse("## One\n\nText **bold**.\n\n- a\n- b\n\n1. first\n2. second\n\n> tip");
    expect(blocks.map((b) => b.kind)).toEqual(["h2", "p", "ul", "ol", "tip"]);
  });
});
