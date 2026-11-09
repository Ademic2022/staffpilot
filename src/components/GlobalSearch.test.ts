import { describe, expect, it } from "vitest";

import { ACCOUNT_SETTINGS, AREAS } from "@/components/settings/areas";

import { searchSettings } from "./GlobalSearch";

const entries = [
  ...AREAS.flatMap((a) => [
    { hit: { kind: "setting", title: a.label, subtitle: "Settings", href: a.href }, words: `settings ${a.keywords ?? ""}` },
    ...(a.tabs ?? []).map((t) => ({
      hit: { kind: "setting", title: t.label, subtitle: `Settings · ${a.label}`, href: `${a.href}?tab=${t.key}` },
      words: `settings ${a.label} ${a.keywords ?? ""} ${t.keywords ?? ""}`,
    })),
  ]),
  ...ACCOUNT_SETTINGS.map((s) => ({ hit: { kind: "setting", title: s.label, subtitle: "Your account", href: "/account" }, words: `account settings my ${s.keywords}` })),
];
const titles = (q: string) => searchSettings(q, entries).map((h) => h.title);

describe("settings search", () => {
  it("finds settings by name, by the words people use, and by several words", () => {
    expect(titles("logo")[0]).toBe("Logo and colour");
    expect(titles("brand")).toContain("Logo and colour");
    expect(titles("2fa")).toEqual(expect.arrayContaining(["Two-step sign-in", "Login and security"]));
    expect(titles("tax")).toContain("Tax and contributions");
    expect(titles("holidays settings")).toContain("Public holidays");
    expect(titles("password")[0]).toBe("Password");
    expect(titles("settings").length).toBeGreaterThan(0);
    expect(titles("zzzz")).toEqual([]);
  });
});
