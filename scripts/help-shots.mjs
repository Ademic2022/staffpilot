/**
 * Screenshots for the user guide, cropped to the part of the screen an article talks about, in
 * light and dark. Run from hrms-client, with the API and `npm run dev` running:
 *
 *   npm run help:shots              every shot
 *   npm run help:shots -- leave-request two-step-setup   just these
 *
 * It signs in to the screenshot company, Brightpath, made by
 *   uv run python manage.py seed_demo --slug brightpath --name "Brightpath Ltd" --no-mfa --attendance
 * (its own people and made-up details, so no real records are ever in the guide). Images go to
 * public/help/shots/<name>.webp and <name>-dark.webp; their sizes to src/help/shots.json, which
 * the help renderer reads. An article shows one with a line of its own: ![What it shows](shot:<name>)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/help/shots");
const MANIFEST = path.join(ROOT, "src/help/shots.json");
const BASE = process.env.SHOTS_URL ?? "http://brightpath.localhost:3000";
const PASSWORD = "demo-pass-2026"; // seed_demo's password for its made-up people
const as = (who) => `${who}@brightpath.test`;
const WIDTH = 1280;
const SCALE = 2; // sharp on high-density screens; WebP keeps it small

/**
 * Each shot: who is signed in, where to go, what to do first, what to crop to, and what to ring
 * (numbered when there is more than one). Keep them few and on the steps people get stuck on.
 */
const SHOTS = [
  {
    name: "two-step-setup", who: "dev", path: "/account",
    act: (p) => p.getByRole("button", { name: "Set up two-step sign-in" }).click(),
    crop: (p) => p.locator("section").filter({ has: p.locator("form.\\@container") }),
  },
  {
    name: "leave-request", who: "dev", path: "/leave",
    act: (p) => p.getByRole("button", { name: "Request time off" }).first().click(),
    crop: (p) => p.getByRole("dialog"), pad: 0, bare: true,
  },
  {
    name: "leave-approvals", who: "lead", path: "/leave/approvals",
    crop: (p) => p.locator("main"),
    maxHeight: 560,
  },
  {
    name: "clock-in", who: "dev", path: "/home",
    crop: (p) => p.locator("[data-tour=clock]").locator("xpath=.."), pad: 16,
    ring: (p) => [p.locator("[data-tour=clock]")],
  },
  {
    name: "reminder-new", who: "hr", path: "/home",
    act: async (p) => {
      await p.getByRole("button", { name: "Add", exact: true }).first().click();
      await p.getByRole("dialog").getByRole("textbox").first().fill("Send the pension schedule to the PFAs");
      await p.getByRole("dialog").getByRole("button", { name: "Next week", exact: true }).first().click();
    },
    crop: (p) => p.getByRole("dialog"), pad: 0, bare: true,
  },
  {
    name: "search", who: "hr", path: "/home",
    act: async (p) => {
      await p.locator("[data-tour=search]").first().click();
      await p.keyboard.type("time off");
      await p.waitForTimeout(600);
    },
    crop: (p) => p.getByRole("dialog"), pad: 0, bare: true,
  },
  {
    name: "setup-checklist", who: "owner", path: "/settings/company",
    act: (p) => p.getByRole("button", { name: "All steps" }).click(),
    crop: (p) => p.getByText(/^Setup: \d+ of \d+ done$/).locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]"),
  },
  {
    name: "company-branding", who: "owner", path: "/settings/company?tab=branding",
    crop: (p) => p.getByRole("heading", { name: "Branding" }).locator("xpath=ancestor::section[1]"),
    ring: (p) => [p.getByText("Upload", { exact: true }).locator("xpath=ancestor::*[self::label or self::button][1]"),
      p.getByText("Colour", { exact: true }).locator("xpath=following-sibling::*[1]")],
    pad: 20,
  },
  {
    name: "pay-groups", who: "owner", path: "/settings/payroll?tab=groups",
    crop: (p) => p.getByRole("table").locator("xpath=ancestor::div[.//button[contains(., 'New pay group')]][1]"),
  },
  {
    name: "payroll-new", who: "pay", path: "/payroll",
    act: (p) => p.getByRole("button", { name: "New payroll" }).click(),
    crop: (p) => p.getByRole("dialog"), pad: 0, bare: true,
  },
  {
    name: "employee-import", who: "hr", path: "/employees/import",
    crop: (p) => p.locator("main"), maxHeight: 620,
  },
];

const STILL = `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
  nextjs-portal, [data-nextjs-toast] { display: none !important; }`;

async function signIn(browser, who) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Work email").fill(as(who));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
  const state = await context.storageState();
  await context.close();
  return state;
}

/** Ring the parts a step points at, numbered when there are several, drawn over the page. */
async function ring(page, locators) {
  const boxes = [];
  for (const l of locators) {
    const b = await l.first().boundingBox();
    if (b) boxes.push(b);
  }
  await page.evaluate((boxes) => {
    boxes.forEach((b, i) => {
      const r = document.createElement("div");
      r.dataset.shotMark = "";
      Object.assign(r.style, {
        position: "fixed", left: `${b.x - 5}px`, top: `${b.y - 5}px`, width: `${b.width + 10}px`, height: `${b.height + 10}px`,
        border: "2.5px solid #e09800", borderRadius: "12px", zIndex: 2147483647, pointerEvents: "none",
        boxShadow: "0 0 0 4px rgba(224,152,0,.18)",
      });
      if (boxes.length > 1) {
        const n = document.createElement("span");
        n.textContent = String(i + 1);
        Object.assign(n.style, {
          position: "absolute", top: "-12px", left: "-12px", width: "22px", height: "22px", borderRadius: "999px",
          background: "#e09800", color: "#fff", font: "600 12px/22px system-ui", textAlign: "center",
        });
        r.append(n);
      }
      document.body.append(r);
    });
  }, boxes);
}

async function take(browser, shot, state, scheme) {
  const context = await browser.newContext({
    storageState: state, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: SCALE,
    viewport: { width: WIDTH, height: 900 },
  });
  // Never start the welcome tour over the page being photographed.
  await context.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) { return String(key).startsWith("staffpilot:tour-seen") ? "1" : get.call(this, key); };
  });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: STILL });
    if (shot.act) { await shot.act(page); await page.waitForLoadState("networkidle"); }
    await page.waitForTimeout(400);
    const target = shot.crop(page).first();
    await target.waitFor({ state: "visible", timeout: 10000 });
    await target.scrollIntoViewIfNeeded();
    let box = await target.boundingBox();
    // Tall parts: make the window tall enough to hold them, so nothing is cut by the screen edge.
    if (box.y + box.height > 880) {
      await page.setViewportSize({ width: WIDTH, height: Math.ceil(box.y + box.height + 60) });
      await page.waitForTimeout(200);
      box = await target.boundingBox();
    }
    // A dialog on its own: hide the page and the dimmed backdrop behind it, so its rounded corners sit on plain background.
    if (shot.bare) {
      await page.addStyleTag({ content: `body > *:not(:has([role=dialog])) { visibility: hidden !important; }
        :has(> [role=dialog]), :has(> * > [role=dialog]) { background: transparent !important; backdrop-filter: none !important; }
        [role=dialog] ~ *, [role=dialog] + * { visibility: hidden !important; }` });
    }
    if (shot.ring) await ring(page, shot.ring(page));
    const pad = shot.pad ?? 12;
    const vp = page.viewportSize();
    const x = Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    const width = Math.min(vp.width - x, Math.ceil(box.width + pad * 2));
    const height = Math.min(vp.height - y, Math.ceil(box.height + pad * 2), shot.maxHeight ?? Infinity);
    const png = await page.screenshot({ clip: { x, y, width, height } });
    const file = path.join(OUT, `${shot.name}${scheme === "dark" ? "-dark" : ""}.webp`);
    const info = await sharp(png).webp({ quality: 78, effort: 6 }).toFile(file);
    return { w: width, h: height, kb: Math.round(info.size / 1024) };
  } finally {
    await context.close();
  }
}

async function main() {
  const only = process.argv.slice(2);
  const shots = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
  if (only.length && shots.length !== only.length) throw new Error(`Unknown shot. Known: ${SHOTS.map((s) => s.name).join(", ")}`);
  await mkdir(OUT, { recursive: true });
  let manifest = {};
  try { manifest = JSON.parse(await readFile(MANIFEST, "utf8")); } catch { /* first run */ }

  // Playwright's own Chromium, or the installed Google Chrome when that has not been downloaded.
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: "chrome" }));
  const states = {};
  let failed = 0;
  try {
    for (const shot of shots) {
      states[shot.who] ??= await signIn(browser, shot.who);
      try {
        const light = await take(browser, shot, states[shot.who], "light");
        const dark = await take(browser, shot, states[shot.who], "dark");
        manifest[shot.name] = { w: light.w, h: light.h };
        console.log(`✓ ${shot.name}  ${light.w}×${light.h}  ${light.kb} KB + ${dark.kb} KB dark`);
      } catch (e) {
        failed++;
        console.error(`✗ ${shot.name}: ${e.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  if (failed) process.exitCode = 1;
}

main();
