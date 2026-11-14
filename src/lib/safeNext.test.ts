import { describe, expect, it } from "vitest";

import { safeNext } from "./safeNext";

describe("safeNext", () => {
  it("keeps pages of this app", () => {
    expect(safeNext("/leave?tab=approvals")).toBe("/leave?tab=approvals");
    expect(safeNext(null)).toBe("/home");
  });
  it("never leaves the site", () => {
    for (const bad of ["//evil.example", "/\\evil.example", "/\\/evil.example", "https://evil.example", "javascript:alert(1)", "/%5C%5Cevil.example"]) {
      const out = safeNext(bad);
      expect(new URL(out, "https://acme.staffpilot.site").origin).toBe("https://acme.staffpilot.site");
    }
  });
});
