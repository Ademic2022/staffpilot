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
  tabs?: { key: string; label: string }[];
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
      { key: "info", label: "Company info" }, { key: "general", label: "General settings" },
      { key: "branding", label: "Logo and colour" }, { key: "security", label: "Login and security" },
      { key: "data", label: "Data and account" },
    ],
  },
  {
    href: "/settings/users", label: "Users and access", icon: faUserLock, permission: PERMS.usersManage,
    tabs: [{ key: "users", label: "Users" }, { key: "levels", label: "Access levels" }, { key: "api", label: "API keys" }],
  },
  {
    href: "/settings/approvals", label: "Approvals", icon: faListCheck, permission: PERMS.employeesManage,
    tabs: [
      { key: "pay_change", label: "Pay changes" }, { key: "job_change", label: "Job changes" },
      { key: "time_off", label: "Time off" }, { key: "info", label: "Information updates" },
    ],
  },
  { href: "/settings/alerts", label: "Email alerts", icon: faBell, permission: PERMS.employeesManage },
  { href: "/settings/directory", label: "Company directory", icon: faAddressBook, permission: PERMS.employeesManage },
  {
    href: "/settings/organization", label: "Job organization", icon: faSitemap, permission: PERMS.orgManage,
    tabs: [
      { key: "legalEntities", label: "Legal entities" }, { key: "locations", label: "Locations" },
      { key: "departments", label: "Departments" }, { key: "jobTitles", label: "Job titles" }, { key: "grades", label: "Grades and pay bands" },
      { key: "teams", label: "Teams" },
    ],
  },
  {
    href: "/settings/fields", label: "Employee fields", icon: faIdCard, permission: PERMS.employeesManage,
    tabs: [{ key: "fields", label: "Custom fields" }, { key: "lists", label: "Dropdown lists" }],
  },
  {
    href: "/settings/time-off", label: "Time off", icon: faCalendarDays, permission: PERMS.leaveManage,
    tabs: [{ key: "types", label: "Leave types" }, { key: "policies", label: "Policies" }, { key: "holidays", label: "Public holidays" }],
  },
  {
    href: "/settings/attendance", label: "Attendance", icon: faBusinessTime, permission: PERMS.attendanceManage,
    tabs: [{ key: "rules", label: "Rules" }, { key: "shifts", label: "Shifts and roster" }, { key: "projects", label: "Projects" }],
  },
  { href: "/settings/performance", label: "Performance", icon: faChartLine, permission: PERMS.performanceManage },
  {
    href: "/settings/expenses", label: "Expenses", icon: faReceipt, permission: PERMS.expensesManage,
    tabs: [{ key: "rules", label: "Rules" }, { key: "categories", label: "Categories" }],
  },
  {
    href: "/settings/payroll", label: "Payroll", icon: faMoneyCheckDollar, permission: PERMS.payrollManage, needsPayroll: true,
    tabs: [{ key: "groups", label: "Pay groups" }, { key: "components", label: "Pay components" }, { key: "rules", label: "Tax and contributions" }],
  },
  { href: "/settings/benefits", label: "Benefits", icon: faHeartPulse, permission: PERMS.employeesManage },
  {
    href: "/settings/checklists", label: "Onboarding and offboarding", icon: faClipboardList, permission: PERMS.employeesManage,
    tabs: [{ key: "ONBOARDING", label: "Onboarding" }, { key: "OFFBOARDING", label: "Offboarding" }],
  },
  { href: "/settings/training", label: "Training", icon: faGraduationCap, permission: PERMS.employeesManage },
  { href: "/settings/audit", label: "Audit log", icon: faClockRotateLeft, permission: PERMS.auditView },
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
