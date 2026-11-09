import {
  faAddressBook, faBell, faBusinessTime, faClockRotateLeft, faMoneyCheckDollar, faBuilding, faCalendarDays, faChartLine, faClipboardList, faReceipt, faGraduationCap, faHeartPulse, faIdCard, faListCheck, faSitemap,
  faUserLock, type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PERMS } from "@/lib/permissions";

/** One settings area: a page under /settings, who may open it, and the sections it splits into. */
export type SettingsArea = {
  href: string;
  label: string;
  icon: IconDefinition;
  permission: string;
  /** Shown only when the company runs payroll in StaffPilot. */
  needsPayroll?: boolean;
  tabs?: { key: string; label: string; keywords?: string }[];
  /** Other words people search for this area by. */
  keywords?: string;
};

/** The areas someone may open: their permissions, and switched-on features. */
export function visibleAreas(can: (...p: string[]) => boolean, tenant: { payrollEnabled?: boolean } | null) {
  return AREAS.filter((a) => can(a.permission) && (!a.needsPayroll || Boolean(tenant?.payrollEnabled)));
}

/** The areas in the Settings menu, in BambooHR's alphabetical spirit but grouped by what people look for. */
export const AREAS: SettingsArea[] = [
  {
    href: "/settings/company", label: "Company", icon: faBuilding, permission: PERMS.tenantManage,
    tabs: [
      { key: "info", label: "Company info", keywords: "name address country currency timezone" },
      { key: "general", label: "General settings", keywords: "date format name format payroll switch gender pronouns currency code" },
      { key: "branding", label: "Logo and colour", keywords: "brand branding color theme" },
      { key: "security", label: "Login and security", keywords: "two-step 2fa mfa authenticator session timeout ip allowlist" },
      { key: "data", label: "Data and account", keywords: "export download backup close delete account cancel subscription" },
    ],
  },
  {
    href: "/settings/users", label: "Users and access", icon: faUserLock, permission: PERMS.usersManage,
    tabs: [{ key: "users", label: "Users", keywords: "invite people accounts admins staff login" },
      { key: "levels", label: "Access levels", keywords: "roles permissions rights" }, { key: "api", label: "API keys", keywords: "integration token" }],
  },
  {
    href: "/settings/approvals", label: "Approvals", icon: faListCheck, permission: PERMS.employeesManage,
    tabs: [
      { key: "pay_change", label: "Pay changes" }, { key: "job_change", label: "Job changes" },
      { key: "time_off", label: "Time off" }, { key: "info", label: "Information updates" },
    ],
  },
  { href: "/settings/alerts", label: "Email alerts", icon: faBell, permission: PERMS.employeesManage, keywords: "birthdays anniversaries reminders notifications" },
  { href: "/settings/directory", label: "Company directory", icon: faAddressBook, permission: PERMS.employeesManage, keywords: "who can see fields org chart" },
  {
    href: "/settings/organization", label: "Job organization", icon: faSitemap, permission: PERMS.orgManage,
    tabs: [
      { key: "legalEntities", label: "Legal entities" }, { key: "locations", label: "Locations" },
      { key: "departments", label: "Departments" }, { key: "jobTitles", label: "Job titles", keywords: "positions roles" }, { key: "grades", label: "Grades and pay bands", keywords: "salary levels" },
      { key: "teams", label: "Teams" },
    ],
  },
  {
    href: "/settings/fields", label: "Employee fields", icon: faIdCard, permission: PERMS.employeesManage,
    tabs: [{ key: "fields", label: "Custom fields" }, { key: "lists", label: "Dropdown lists" }],
  },
  {
    href: "/settings/time-off", label: "Time off", icon: faCalendarDays, permission: PERMS.leaveManage,
    keywords: "leave vacation annual sick",
    tabs: [{ key: "types", label: "Leave types", keywords: "annual sick maternity unpaid" },
      { key: "policies", label: "Policies", keywords: "accrual entitlement carry over days per year" }, { key: "holidays", label: "Public holidays", keywords: "bank holidays calendar" }],
  },
  {
    href: "/settings/attendance", label: "Attendance", icon: faBusinessTime, permission: PERMS.attendanceManage,
    keywords: "clock in out timesheets geofence location",
    tabs: [{ key: "rules", label: "Rules", keywords: "overtime absence late geofence" }, { key: "shifts", label: "Shifts and roster", keywords: "hours schedule" },
      { key: "projects", label: "Projects", keywords: "timesheet codes" }],
  },
  { href: "/settings/performance", label: "Performance", icon: faChartLine, permission: PERMS.performanceManage, keywords: "reviews goals appraisal feedback" },
  {
    href: "/settings/expenses", label: "Expenses", icon: faReceipt, permission: PERMS.expensesManage,
    keywords: "claims receipts reimbursement",
    tabs: [{ key: "rules", label: "Rules", keywords: "limits approval" }, { key: "categories", label: "Categories" }],
  },
  {
    href: "/settings/payroll", label: "Payroll", icon: faMoneyCheckDollar, permission: PERMS.payrollManage, needsPayroll: true,
    keywords: "salary pay",
    tabs: [{ key: "groups", label: "Pay groups", keywords: "pay day monthly biweekly schedule" },
      { key: "components", label: "Pay components", keywords: "salary split basic housing transport allowances deductions" },
      { key: "rules", label: "Tax and contributions", keywords: "paye pension nhf nsitf ssnit statutory rules" }],
  },
  { href: "/settings/benefits", label: "Benefits", icon: faHeartPulse, permission: PERMS.employeesManage, keywords: "hmo health insurance" },
  {
    href: "/settings/checklists", label: "Onboarding and offboarding", icon: faClipboardList, permission: PERMS.employeesManage,
    tabs: [{ key: "ONBOARDING", label: "Onboarding" }, { key: "OFFBOARDING", label: "Offboarding" }],
  },
  { href: "/settings/training", label: "Training", icon: faGraduationCap, permission: PERMS.employeesManage },
  { href: "/settings/audit", label: "Audit log", icon: faClockRotateLeft, permission: PERMS.auditView, keywords: "history activity changes who" },
];

/** Everyone's own settings, on the account page. */
export const ACCOUNT_SETTINGS: { label: string; keywords: string }[] = [
  { label: "Password", keywords: "change password sign in" },
  { label: "Two-step sign-in", keywords: "2fa mfa authenticator qr code security recovery codes" },
  { label: "Email notifications", keywords: "emails alerts notify unsubscribe" },
  { label: "Calendar links", keywords: "ical google outlook apple calendar subscribe feed" },
];

/** The section of a settings area shown now, kept in the address (?tab=) so the layout's menu can switch it. */
export function useSettingsTab<T extends string>(keys: readonly T[], fallback: T): [T, (next: T) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const asked = params.get("tab") as T | null;
  const tab = asked && keys.includes(asked) ? asked : fallback;
  return [tab, (next) => router.replace(`${pathname}?tab=${next}`, { scroll: false })];
}
