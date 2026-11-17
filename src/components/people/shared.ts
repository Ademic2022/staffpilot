import type { EmployeeFilter, EmployeeStatus, EmploymentType } from "@/gql/graphql";

/** The People list's filter, in the API's own field names (so it can be saved and exported as is). */
export type PeopleFilter = {
  search?: string;
  statuses?: EmployeeStatus[];
  employmentTypes?: EmploymentType[];
  departmentIds?: string[];
  locationIds?: string[];
  legalEntityIds?: string[];
  jobTitleIds?: string[];
  gradeIds?: string[];
  teamIds?: string[];
  genders?: string[];
  ageBands?: string[];
  tenureBands?: string[];
  managersOnly?: boolean;
  hiredFrom?: string;
  hiredTo?: string;
};

export type Showing = "active" | "inactive" | "all";

export const SHOWING_STATUSES: Record<Showing, EmployeeStatus[] | null> = {
  active: ["ACTIVE", "PROBATION", "ON_LEAVE"],
  inactive: ["TERMINATED"],
  all: null,
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

/** Built-in views, as BambooHR ships them. Saved views from HR follow these. */
export const PRESET_VIEWS: { key: string; name: string; filter: () => PeopleFilter; showing?: Showing }[] = [
  { key: "all", name: "All employees", filter: () => ({}) },
  { key: "contractors", name: "Contractors", filter: () => ({ employmentTypes: ["CONTRACT"] }) },
  { key: "part_time", name: "Part-time employees", filter: () => ({ employmentTypes: ["PART_TIME"] }) },
  { key: "interns", name: "Interns", filter: () => ({ employmentTypes: ["INTERN"] }) },
  { key: "managers", name: "Managers", filter: () => ({ managersOnly: true }) },
  { key: "new", name: "New employees", filter: () => ({ hiredFrom: daysFromNow(-90), hiredTo: daysFromNow(0) }) },
  { key: "probation", name: "On probation", filter: () => ({ statuses: ["PROBATION"] }) },
  { key: "terminated", name: "Terminated people", filter: () => ({}), showing: "inactive" },
  { key: "upcoming", name: "Upcoming employees", filter: () => ({ hiredFrom: daysFromNow(1) }), showing: "all" },
];

/** The API filter for what is on screen: the chosen filter plus the Showing choice. */
export function toEmployeeFilter(filter: PeopleFilter, showing: Showing): EmployeeFilter {
  const statuses = filter.statuses?.length ? filter.statuses : SHOWING_STATUSES[showing];
  return {
    ...filter,
    search: filter.search?.trim() || null,
    statuses: statuses?.length ? statuses : null,
  };
}

export const filterCount = (f: PeopleFilter) =>
  (["statuses", "employmentTypes", "departmentIds", "locationIds", "legalEntityIds", "jobTitleIds", "gradeIds", "teamIds", "genders", "ageBands", "tenureBands"] as const)
    .reduce((n, k) => n + (f[k]?.length ?? 0), 0) + (f.managersOnly ? 1 : 0) + (f.hiredFrom || f.hiredTo ? 1 : 0);

export const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" }, { value: "PROBATION", label: "On probation" }, { value: "ON_LEAVE", label: "On leave" },
  { value: "CANDIDATE", label: "Candidate (not started)" }, { value: "TERMINATED", label: "Terminated" },
];
export const TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" }, { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" }, { value: "INTERN", label: "Intern" },
];
export const GENDER_OPTIONS = [
  { value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "non_binary", label: "Non-binary" }, { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" }, { value: "none", label: "Not recorded" },
];
export const AGE_OPTIONS = ["Under 25", "25–34", "35–44", "45–54", "55 and over", "Not recorded"].map((v) => ({ value: v, label: v }));
export const TENURE_OPTIONS = ["Under 1 year", "1–3 years", "3–5 years", "5–10 years", "10 years or more"].map((v) => ({ value: v, label: v }));

/** Columns the list can show. The first six are BambooHR's default. */
export const COLUMNS: { key: string; label: string; sort?: string }[] = [
  { key: "photo", label: "Photo" },
  { key: "number", label: "Employee #", sort: "number" },
  { key: "name", label: "Name", sort: "name" },
  { key: "jobTitle", label: "Job title", sort: "job_title" },
  { key: "location", label: "Location", sort: "location" },
  { key: "employmentType", label: "Employment type", sort: "employment_type" },
  { key: "department", label: "Department", sort: "department" },
  { key: "status", label: "Status", sort: "status" },
  { key: "hireDate", label: "Hire date", sort: "hire_date" },
  { key: "tenure", label: "Length of service", sort: "hire_date" },
  { key: "manager", label: "Reports to" },
  { key: "legalEntity", label: "Legal entity" },
  { key: "grade", label: "Grade" },
  { key: "workEmail", label: "Work email" },
  { key: "workPhone", label: "Work phone" },
  { key: "mobile", label: "Mobile phone" },
  { key: "gender", label: "Gender" },
  { key: "dateOfBirth", label: "Date of birth" },
];
export const DEFAULT_COLUMNS = ["photo", "number", "name", "jobTitle", "location", "employmentType"];
