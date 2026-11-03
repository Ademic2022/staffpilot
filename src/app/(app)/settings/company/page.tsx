"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "urql";

import { IconUpload } from "@/components/icons";
import {
  Button, Card, Checkbox, ErrorNote, Field, FormSection, Input, Loading, Notice, Select, Textarea,
} from "@/components/ui";
import { useSettingsTab } from "@/components/settings/areas";
import { graphql } from "@/gql";
import type { CompanySettingsQuery } from "@/gql/graphql";
import { errorMessage, postForm } from "@/lib/api";
import { reportErrors } from "@/lib/forms";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const CompanySettingsDocument = graphql(`
  query CompanySettings {
    companySettings {
      name country currency timezone primaryColor logoUrl requireAdminMfa sessionTimeoutMinutes ipAllowlist yourIp
      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads payrollEnabled
    }
  }
`);

const UpdateCompanyDocument = graphql(`
  mutation UpdateCompanySettings($input: CompanySettingsInput!) {
    updateCompanySettings(input: $input) { settings { name } errors { field message } }
  }
`);

const RemoveLogoDocument = graphql(`
  mutation RemoveCompanyLogo { removeCompanyLogo }
`);

type Settings = CompanySettingsQuery["companySettings"];

const COLORS = ["#0F3D2E", "#1D4ED8", "#7C3AED", "#B91C1C", "#C2410C", "#0E7490", "#334155"];
const TIMEOUTS = [15, 30, 60, 120, 240, 480, 1440];
const DATE_FORMATS = [
  ["d_mmm_yyyy", "25 Oct 2026"], ["mmm_d_yyyy", "Oct 25, 2026"], ["dd/mm/yyyy", "25/10/2026 (dd/mm/yyyy)"],
  ["mm/dd/yyyy", "10/25/2026 (mm/dd/yyyy)"], ["yyyy-mm-dd", "2026-10-25 (yyyy-mm-dd)"],
];
const NAME_FORMATS = [["first_last", "First Last (Ada Owner)"], ["first_middle_last", "First Middle Last (Ada Ngozi Owner)"], ["last_first", "Last, First (Owner, Ada)"]];
export type CompanySection = "info" | "general" | "branding" | "security";
const ZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Africa/Lagos", "UTC"];

function Form({ initial, section, onSaved }: { initial: Settings; section: CompanySection; onSaved: () => void }) {
  const { me, reset } = useSession();
  const [, update] = useMutation(UpdateCompanyDocument);
  const [, removeLogo] = useMutation(RemoveLogoDocument);
  const [v, setV] = useState({
    name: initial.name, country: initial.country, currency: initial.currency, timezone: initial.timezone,
    primaryColor: initial.primaryColor || "#0F3D2E", requireAdminMfa: initial.requireAdminMfa,
    sessionTimeoutMinutes: initial.sessionTimeoutMinutes, ipAllowlist: initial.ipAllowlist.join("\n"),
    dateFormat: initial.dateFormat, nameFormat: initial.nameFormat, showCurrencyCode: initial.showCurrencyCode,
    employeesEditOwnPhoto: initial.employeesEditOwnPhoto, expandedGender: initial.expandedGender, employeeUploads: initial.employeeUploads,
    payrollEnabled: initial.payrollEnabled,
  });
  const [logo, setLogo] = useState(initial.logoUrl);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  async function uploadLogo(file: File) {
    const form = new FormData();
    form.set("file", file);
    const body = await postForm<{ logoUrl?: string }>("/api/tenant/logo/", form);
    if (body.errors?.length) return setErrors({ logo: body.errors[0].message });
    setErrors({});
    setLogo(body.logoUrl ?? null);
    reset();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setBusy(true);
    const result = await update({ input: { ...v, ipAllowlist: v.ipAllowlist.split(/[\n,]/).map((x) => x.trim()).filter(Boolean) } });
    setBusy(false);
    const found: Record<string, string> = {};
    const failed = reportErrors(result, result.data?.updateCompanySettings.errors,
      ["name", "country", "currency", "timezone", "primaryColor", "requireAdminMfa", "sessionTimeoutMinutes", "ipAllowlist", "dateFormat", "nameFormat"] as const,
      (f, m) => { found[f] = m; }, setFormError);
    setErrors(found);
    if (!failed) {
      document.documentElement.style.setProperty("--brand", v.primaryColor);
      reset();
      onSaved();
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {formError && <div className="mb-4"><ErrorNote error={formError} /></div>}
      <Card>
        {section === "info" && <FormSection stacked title="Company" description="Shown on the sign-in page, in emails and on reports.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Name" error={errors.name}><Input value={v.name} aria-invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
            <Field label="Country code" error={errors.country} hint="Two letters, e.g. NG."><Input value={v.country} maxLength={2} className="uppercase" onChange={(e) => set("country", e.target.value)} /></Field>
            <Field label="Currency" error={errors.currency} hint="Three letters, e.g. NGN. Used for new pay records."><Input value={v.currency} maxLength={3} className="uppercase" onChange={(e) => set("currency", e.target.value)} /></Field>
            <div className="sm:col-span-2">
              <Field label="Time zone" error={errors.timezone} hint="Leave days, reminders and reports follow this.">
                <Select value={v.timezone} onChange={(e) => set("timezone", e.target.value)}>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        </FormSection>}

        {section === "general" && (
          <FormSection stacked title="General settings" description="How dates, amounts and names read for everyone, and what employees may do themselves.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date format" error={errors.dateFormat}>
                <Select value={v.dateFormat} onChange={(e) => set("dateFormat", e.target.value)}>
                  {DATE_FORMATS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Display names as" error={errors.nameFormat} hint="Preferred names stand in for first names.">
                <Select value={v.nameFormat} onChange={(e) => set("nameFormat", e.target.value)}>
                  {NAME_FORMATS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <div className="space-y-4 sm:col-span-2">
                <Checkbox label="Show currency codes on amounts" description="NGN 450,000.00 instead of ₦450,000.00. Clearer when you pay in more than one currency."
                  checked={v.showCurrencyCode} onChange={(c) => set("showCurrencyCode", c)} />
                <Checkbox label="Let employees change their own photo" description="Otherwise only HR can add or change photos."
                  checked={v.employeesEditOwnPhoto} onChange={(c) => set("employeesEditOwnPhoto", c)} />
                <Checkbox label="Let employees upload files to their own record" description="They land in an Employee uploads category that the employee and HR can see."
                  checked={v.employeeUploads} onChange={(c) => set("employeeUploads", c)} />
                <Checkbox label="Show expanded gender options" description="Adds Non-binary as a gender, and a pronouns field on every profile."
                  checked={v.expandedGender} onChange={(c) => set("expandedGender", c)} />
                <Checkbox label="Run payroll in HRMS" description="Adds Payroll and My payslips. Leave it off if you pay people elsewhere: expense claims are then paid back by bank transfer, and past payslips stay readable."
                  checked={v.payrollEnabled} onChange={(c) => set("payrollEnabled", c)} />
              </div>
            </div>
          </FormSection>
        )}

        {section === "branding" && <FormSection stacked title="Branding" description="Your logo and colour on the sign-in page, the menu and emails.">
          <div className="space-y-5">
            <Field label="Logo" error={errors.logo} hint="PNG, JPG or WebP, up to 2 MB. Square or wide logos work best.">
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logo ? <img src={logo} alt="Current logo" className="h-full w-full object-contain p-1.5" /> : <span className="text-xs text-muted">None</span>}
                </span>
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink shadow-sm hover:bg-subtle">
                  <IconUpload size={16} />{logo ? "Replace" : "Upload"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }} />
                </label>
                {logo && <Button variant="ghost" onClick={async () => { await removeLogo({}); setLogo(null); reset(); }}>Remove</Button>}
              </div>
            </Field>
            <Field label="Colour" error={errors.primaryColor}>
              <div className="flex flex-wrap items-center gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={c} aria-pressed={v.primaryColor.toLowerCase() === c.toLowerCase()} onClick={() => set("primaryColor", c)}
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition ${v.primaryColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ink" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <Input value={v.primaryColor} maxLength={7} className="ml-2 w-28 font-mono uppercase" aria-label="Colour code" onChange={(e) => set("primaryColor", e.target.value)} />
                <span className="ml-1 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white" style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(v.primaryColor) ? v.primaryColor : "#0F3D2E" }}>Preview</span>
              </div>
            </Field>
          </div>
        </FormSection>}

        {section === "security" && <FormSection stacked title="Security" description="Rules for everyone who signs in to this company.">
          <div className="space-y-5">
            <div>
              <Checkbox label="Admins must use two-step sign-in" checked={v.requireAdminMfa} onChange={(c) => set("requireAdminMfa", c)}
                description="Anyone who manages people, pay, leave, documents, users or settings needs an authenticator app. Until they set it up, they can only use the app as an employee." />
              {errors.requireAdminMfa && <p className="mt-1.5 text-xs text-red-600">{errors.requireAdminMfa}</p>}
              {v.requireAdminMfa && !me?.mfaEnabled && <p className="mt-1.5 text-xs text-muted">Set it up for yourself first on your account page.</p>}
            </div>
            <Field label="Sign people out after" error={errors.sessionTimeoutMinutes} hint="Of no activity. Shorter is safer on shared computers.">
              <Select value={String(v.sessionTimeoutMinutes)} onChange={(e) => set("sessionTimeoutMinutes", Number(e.target.value))}>
                {[...new Set([...TIMEOUTS, v.sessionTimeoutMinutes])].sort((a, b) => a - b).map((m) => (
                  <option key={m} value={m}>{m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : m === 1440 ? "24 hours" : `${m / 60} hours`}</option>
                ))}
              </Select>
            </Field>
            <Field label="Only allow these networks" optional error={errors.ipAllowlist}
              hint={`One address or network per line, e.g. 102.89.4.10 or 102.89.0.0/16. Empty allows everywhere. You are on ${initial.yourIp}.`}>
              <Textarea rows={3} value={v.ipAllowlist} className="font-mono" placeholder={initial.yourIp} onChange={(e) => set("ipAllowlist", e.target.value)} />
            </Field>
          </div>
        </FormSection>}
      </Card>
      <div className="mt-4 flex justify-end">
        <Button type="submit" busy={busy}>Save settings</Button>
      </div>
    </form>
  );
}

export default function CompanySettingsPage() {
  const { can } = useSession();
  const [{ data, error }, reload] = useQuery({ query: CompanySettingsDocument });
  const [saved, setSaved] = useState(false);
  const [section] = useSettingsTab<CompanySection>(["info", "general", "branding", "security"], "info");
  if (!can(PERMS.tenantManage)) return <Notice tone="warning">Only owners can change company settings.</Notice>;
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  return (
    <>
      {saved && <Notice tone="success">Settings saved.</Notice>}
      <Form key={JSON.stringify(data.companySettings)} initial={data.companySettings} section={section}
        onSaved={() => { setSaved(true); reload({ requestPolicy: "network-only" }); window.scrollTo({ top: 0 }); }} />
    </>
  );
}
