"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "urql";
import { z } from "zod";

import { Button, Dialog, ErrorNote, Field, Input, Loading, Select } from "@/components/ui";
import { graphql } from "@/gql";
import type { EmployeeProfileQuery, EmployeeStatus, EmploymentType, JobChangeType, OvertimeStatus, PayFrequency, PaySchedule, PayType } from "@/gql/graphql";
import { genderOptions } from "@/components/profile/fields";
import { ListInput } from "@/components/settings/OptionLists";
import { reportErrors, today } from "@/lib/forms";
import { useSession } from "@/lib/session";

export type ProfileEmployee = EmployeeProfileQuery["employee"];

interface DialogProps {
  employee: ProfileEmployee;
  onClose: () => void;
  /** Called after a successful save, so the page can reload the record; with a message when it was not applied straight away. */
  onSaved: (message?: string) => void;
}

const optionalDate = z.union([z.literal(""), z.iso.date("Enter a valid date.")]);
const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address.")]);

/* ------------------------------------------------------------ Personal details */

const UpdateEmployeeDocument = graphql(`
  mutation UpdateEmployee($input: UpdateEmployeeInput!) {
    updateEmployee(input: $input) {
      employee { id }
      errors { field message }
    }
  }
`);

const personalSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  middleName: z.string().trim(),
  lastName: z.string().trim().min(1, "Enter a last name."),
  preferredName: z.string().trim(),
  workEmail: optionalEmail,
  personalEmail: optionalEmail,
  phone: z.string().trim().max(20, "Use at most 20 characters."),
  dateOfBirth: optionalDate,
  gender: z.union([z.literal(""), z.enum(["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNDISCLOSED"])]),
});

type PersonalValues = z.infer<typeof personalSchema>;
const PERSONAL_FIELDS = Object.keys(personalSchema.shape) as (keyof PersonalValues)[];

export function EditPersonalDialog({ employee: e, onClose, onSaved }: DialogProps) {
  const { tenant } = useSession();
  const [, update] = useMutation(UpdateEmployeeDocument);
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstName: e.firstName, middleName: e.middleName, lastName: e.lastName, preferredName: e.preferredName,
      workEmail: e.workEmail, personalEmail: e.personalEmail, phone: e.phone, dateOfBirth: e.dateOfBirth ?? "",
      gender: e.gender ?? "",
    },
  });

  async function onSubmit(v: PersonalValues) {
    setFormError(undefined);
    const result = await update({
      input: { id: e.id, ...v, dateOfBirth: v.dateOfBirth || null, gender: v.gender || null },
    });
    const failed = reportErrors(result, result.data?.updateEmployee.errors, PERSONAL_FIELDS,
      (f, message) => setError(f, { message }), setFormError);
    if (!failed) onSaved();
  }

  const text = (name: keyof PersonalValues, label: string, type = "text", optional = false) => (
    <Field label={label} error={errors[name]?.message} optional={optional}>
      <Input type={type} aria-invalid={!!errors[name]} {...register(name)} />
    </Field>
  );

  return (
    <Dialog open wide onClose={onClose} title="Edit personal details" description="Job and pay changes have their own effective-dated forms."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="personal-form" busy={isSubmitting}>Save</Button>
      </>}>
      <form id="personal-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("firstName", "First name")}
          {text("lastName", "Last name")}
          {text("middleName", "Middle name", "text", true)}
          {text("preferredName", "Preferred name", "text", true)}
          {text("workEmail", "Work email", "email", true)}
          {text("personalEmail", "Personal email", "email", true)}
          {text("phone", "Phone", "tel", true)}
          {text("dateOfBirth", "Date of birth", "date", true)}
          <Field label="Gender" optional>
            <Select {...register("gender")}>
              <option value="">Not recorded</option>
              {genderOptions(Boolean(tenant?.expandedGender), e.gender).map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ Job change */

export const JobOptionsDocument = graphql(`
  query JobOptions {
    legalEntities { id name isActive }
    departments { id name isActive legalEntity { id } }
    locations { id name isActive legalEntity { id } }
    jobTitles { id name isActive }
    grades { id name isActive }
    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }
  }
`);

/** Active units only, plus the one currently assigned so a retired unit still shows by name. */
export function activeOptions<T extends { id: string; isActive: boolean }>(items: T[] | undefined, keep?: string | null) {
  return (items ?? []).filter((i) => i.isActive || i.id === keep);
}

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const RequestJobDocument = graphql(`
  mutation RequestJobChange($input: ChangeJobInput!) {
    requestJobChange(input: $input) { waitingForApproval errors { field message } }
  }
`);

const RequestPayDocument = graphql(`
  mutation RequestPayChange($input: ChangeCompensationInput!) {
    requestPayChange(input: $input) { waitingForApproval errors { field message } }
  }
`);

const ChangeJobDocument = graphql(`
  mutation ChangeEmployeeJob($input: ChangeJobInput!) {
    changeEmployeeJob(input: $input) {
      employee { id }
      waitingForApproval
      errors { field message }
    }
  }
`);

const CHANGE_TYPES: { value: JobChangeType; label: string }[] = [
  { value: "PROMOTION", label: "Promotion" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "CHANGE", label: "Other job change" },
];

const jobSchema = z.object({
  effectiveDate: z.iso.date("Choose the date the change takes effect."),
  changeType: z.enum(["PROMOTION", "TRANSFER", "CHANGE"]),
  reason: z.string().trim().max(255),
  legalEntityId: z.string().min(1, "Choose a legal entity."),
  departmentId: z.string(),
  locationId: z.string(),
  jobTitleId: z.string(),
  gradeId: z.string(),
  managerId: z.string(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
});

type JobValues = z.infer<typeof jobSchema>;
const JOB_FIELDS = Object.keys(jobSchema.shape) as (keyof JobValues)[];
const JOB_REFS = ["legalEntityId", "departmentId", "locationId", "jobTitleId", "gradeId", "managerId", "employmentType"] as const;

/** request: a manager asking for the change, which always waits for approval, instead of HR making it. */
export function ChangeJobDialog({ employee: e, onClose, onSaved, changeType = "PROMOTION", request = false }: DialogProps & {
  changeType?: "PROMOTION" | "TRANSFER" | "CHANGE"; request?: boolean;
}) {
  const [{ data }] = useQuery({ query: JobOptionsDocument });
  const [, makeJob] = useMutation(ChangeJobDocument);
  const [, askJob] = useMutation(RequestJobDocument);
  const [formError, setFormError] = useState<string>();
  const current: Pick<JobValues, (typeof JOB_REFS)[number]> = {
    legalEntityId: e.legalEntity.id, departmentId: e.department?.id ?? "", locationId: e.location?.id ?? "",
    jobTitleId: e.jobTitle?.id ?? "", gradeId: e.grade?.id ?? "", managerId: e.manager?.id ?? "",
    employmentType: e.employmentType,
  };
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<JobValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { effectiveDate: today(), changeType, reason: "", ...current },
  });
  const entityId = useWatch({ control, name: "legalEntityId" });

  async function onSubmit(v: JobValues) {
    setFormError(undefined);
    // Only what changed goes in, so the history and audit log show the real change.
    const changed = Object.fromEntries(
      JOB_REFS.filter((k) => v[k] !== current[k]).map((k) => [k, v[k] || null]),
    );
    if (!Object.keys(changed).length) {
      setFormError("Nothing has changed. Pick a new job title, department, manager or other detail.");
      return;
    }
    const input = { id: e.id, effectiveDate: v.effectiveDate, changeType: v.changeType, reason: v.reason || null, ...changed };
    const result = request ? await askJob({ input }) : await makeJob({ input });
    const payload = result.data && ("requestJobChange" in result.data ? result.data.requestJobChange : result.data.changeEmployeeJob);
    const waiting = payload?.waitingForApproval;
    const failed = reportErrors(result, payload?.errors, JOB_FIELDS,
      (f, message) => setError(f, { message }), setFormError);
    if (!failed) onSaved(waiting ? "Sent for approval. It takes effect once every approver agrees." : undefined);
  }

  const choice = (name: keyof JobValues, label: string, options: { id: string; name: string }[], empty = "None") => (
    <Field label={label} error={errors[name]?.message}>
      <Select aria-invalid={!!errors[name]} {...register(name)}>
        <option value="">{empty}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </Select>
    </Field>
  );
  const inEntity = <T extends { id: string; isActive: boolean; legalEntity: { id: string } }>(items: T[] | undefined, keep: string) =>
    activeOptions(items, keep).filter((i) => i.legalEntity.id === entityId);

  return (
    <Dialog open wide onClose={onClose} title={changeType === "PROMOTION" ? "Promotion" : "Change job information"}
      description="Records a new entry in the employment history. A future date takes effect on that day."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="job-form" busy={isSubmitting} disabled={!data}>Save change</Button>
      </>}>
      <form id="job-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type of change">
            <Select {...register("changeType")}>
              {CHANGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Effective from" error={errors.effectiveDate?.message}>
            <Input type="date" aria-invalid={!!errors.effectiveDate} {...register("effectiveDate")} />
          </Field>
        </div>
        {/* The selects mount once their options are here: mounted earlier, they would show "None" and keep it. */}
        {!data ? <div className="border-t border-line pt-4"><Loading /></div> : (
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          {choice("jobTitleId", "Job title", activeOptions(data?.jobTitles, current.jobTitleId))}
          {choice("gradeId", "Grade", activeOptions(data?.grades, current.gradeId))}
          {choice("legalEntityId", "Legal entity", activeOptions(data?.legalEntities, current.legalEntityId), "Choose…")}
          {choice("departmentId", "Department", inEntity(data?.departments, current.departmentId))}
          {choice("locationId", "Location", inEntity(data?.locations, current.locationId))}
          {choice("managerId", "Manager",
            (data?.employees.nodes ?? []).filter((m) => m.id !== e.id).map((m) => ({ id: m.id, name: m.fullName })))}
          <Field label="Employment type">
            <Select {...register("employmentType")}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
        </div>
        )}
        <Field label="Reason" optional hint="Shown in the employment history.">
          <ListInput id="job-reason" listKey="JOB_CHANGE_REASON" {...register("reason")} placeholder="Promotion" />
        </Field>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ Pay change */

const ChangePayDocument = graphql(`
  mutation ChangeEmployeeCompensation($input: ChangeCompensationInput!) {
    changeEmployeeCompensation(input: $input) {
      employee { id }
      waitingForApproval
      errors { field message }
    }
  }
`);

export const FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Per month" },
  { value: "ANNUAL", label: "Per year" },
  { value: "HOURLY", label: "Per hour" },
];

export const PAY_TYPES: { value: PayType; label: string }[] = [
  { value: "SALARY", label: "Salary" }, { value: "HOURLY", label: "Hourly" },
  { value: "COMMISSION", label: "Commission only" }, { value: "CONTRACT", label: "Contract" },
];
export const PAY_SCHEDULES: { value: PaySchedule; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" }, { value: "SEMIMONTHLY", label: "Twice a month" },
  { value: "BIWEEKLY", label: "Every other week" }, { value: "WEEKLY", label: "Weekly" },
];
export const OVERTIME: { value: OvertimeStatus; label: string }[] = [
  { value: "EXEMPT", label: "Exempt" }, { value: "NON_EXEMPT", label: "Non-exempt" },
];

const paySchema = z.object({
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 450000 or 450000.50."),
  frequency: z.enum(["MONTHLY", "ANNUAL", "HOURLY"]),
  payType: z.enum(["SALARY", "HOURLY", "COMMISSION", "CONTRACT"]),
  paySchedule: z.enum(["", "MONTHLY", "SEMIMONTHLY", "BIWEEKLY", "WEEKLY"]),
  overtime: z.enum(["", "EXEMPT", "NON_EXEMPT"]),
  effectiveDate: z.iso.date("Choose the date the new pay starts."),
  reason: z.string().trim().max(255),
  comment: z.string().trim().max(500),
});

type PayValues = z.infer<typeof paySchema>;

export function ChangePayDialog({ employee: e, currency, onClose, onSaved, request = false }: DialogProps & { currency: string; request?: boolean }) {
  const [, makePay] = useMutation(ChangePayDocument);
  const [, askPay] = useMutation(RequestPayDocument);
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: {
      amount: "", frequency: e.compensation?.frequency ?? "MONTHLY", payType: e.compensation?.payType ?? "SALARY",
      paySchedule: e.compensation?.paySchedule ?? "", overtime: e.compensation?.overtime ?? "",
      effectiveDate: today(), reason: "", comment: "",
    },
  });

  async function onSubmit(v: PayValues) {
    setFormError(undefined);
    const input = { id: e.id, amount: v.amount, frequency: v.frequency, effectiveDate: v.effectiveDate, reason: v.reason || null,
      currency: e.compensation?.currency ?? currency, payType: v.payType, paySchedule: v.paySchedule || null,
      overtime: v.overtime || null, comment: v.comment || null };
    const result = request ? await askPay({ input }) : await makePay({ input });
    const payload = result.data && ("requestPayChange" in result.data ? result.data.requestPayChange : result.data.changeEmployeeCompensation);
    const waiting = payload?.waitingForApproval;
    const failed = reportErrors(result, payload?.errors, Object.keys(paySchema.shape) as (keyof PayValues)[],
      (f, message) => setError(f, { message }), setFormError);
    if (!failed) onSaved(waiting ? "Sent for approval. It takes effect once every approver agrees." : undefined);
  }

  return (
    <Dialog open onClose={onClose} title="Change pay" description="Adds a new pay record. Earlier records stay in the pay history."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="pay-form" busy={isSubmitting}>Save pay</Button>
      </>}>
      <form id="pay-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label={`New base pay (${e.compensation?.currency ?? currency})`} error={errors.amount?.message}>
            <Input inputMode="decimal" className="tabular-nums" aria-invalid={!!errors.amount} {...register("amount")} />
          </Field>
          <Field label="Frequency">
            <Select {...register("frequency")}>
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pay type">
            <Select {...register("payType")}>
              {PAY_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
          <Field label="Pay schedule" optional>
            <Select {...register("paySchedule")}>
              <option value="">Not set</option>
              {PAY_SCHEDULES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
          <Field label="Overtime" optional>
            <Select {...register("overtime")}>
              <option value="">Not set</option>
              {OVERTIME.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Effective from" error={errors.effectiveDate?.message}>
          <Input type="date" aria-invalid={!!errors.effectiveDate} {...register("effectiveDate")} />
        </Field>
        <Field label="Reason" optional>
          <ListInput id="pay-reason" listKey="PAY_CHANGE_REASON" {...register("reason")} placeholder="Annual increase" />
        </Field>
        <Field label="Comment" optional>
          <Input {...register("comment")} />
        </Field>
      </form>
    </Dialog>
  );
}

/* --------------------------------------------------------------- Status change */

const ChangeStatusDocument = graphql(`
  mutation ChangeEmployeeStatus($input: ChangeStatusInput!) {
    changeEmployeeStatus(input: $input) {
      employee { id }
      errors { field message }
    }
  }
`);

// Mirrors STATUS_TRANSITIONS in apps/core_hr/models.py; the API has the final say.
const NEXT_STATUSES: Record<EmployeeStatus, { value: EmployeeStatus; label: string }[]> = {
  CANDIDATE: [{ value: "PROBATION", label: "Start probation" }, { value: "ACTIVE", label: "Make active" }, { value: "TERMINATED", label: "Did not join" }],
  PROBATION: [{ value: "ACTIVE", label: "Confirm (probation passed)" }, { value: "ON_LEAVE", label: "Put on leave" }, { value: "TERMINATED", label: "End employment" }],
  ACTIVE: [{ value: "ON_LEAVE", label: "Put on leave" }, { value: "TERMINATED", label: "End employment" }],
  ON_LEAVE: [{ value: "ACTIVE", label: "Return to work" }, { value: "PROBATION", label: "Return on probation" }, { value: "TERMINATED", label: "End employment" }],
  TERMINATED: [],
};

export function canChangeStatus(status: EmployeeStatus) {
  return NEXT_STATUSES[status].length > 0;
}

const statusSchema = z.object({
  status: z.enum(["CANDIDATE", "PROBATION", "ACTIVE", "ON_LEAVE", "TERMINATED"]),
  effectiveDate: z.iso.date("Choose a date."),
  reason: z.string().trim().max(255),
  terminationKind: z.enum(["VOLUNTARY", "INVOLUNTARY", "OTHER"]),
}).refine((v) => v.status !== "TERMINATED" || v.reason.length > 0, {
  path: ["reason"], message: "Give a reason for leaving. It is kept on the record.",
});

type StatusValues = z.infer<typeof statusSchema>;

export function ChangeStatusDialog({ employee: e, onClose, onSaved }: DialogProps) {
  const [, changeStatus] = useMutation(ChangeStatusDocument);
  const [formError, setFormError] = useState<string>();
  const options = NEXT_STATUSES[e.status];
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<StatusValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: options[0]?.value, effectiveDate: today(), reason: "", terminationKind: "VOLUNTARY" },
  });
  const status = useWatch({ control, name: "status" });
  const leaving = status === "TERMINATED";

  async function onSubmit(v: StatusValues) {
    setFormError(undefined);
    const result = await changeStatus({ input: {
      id: e.id, status: v.status, effectiveDate: v.effectiveDate, reason: v.reason || null,
      terminationKind: v.status === "TERMINATED" ? v.terminationKind : null,
    } });
    const failed = reportErrors(result, result.data?.changeEmployeeStatus.errors, ["status", "effectiveDate", "reason"] as const,
      (f, message) => setError(f, { message }), setFormError);
    if (!failed) onSaved();
  }

  return (
    <Dialog open onClose={onClose} title="Change status" description={`${e.fullName} is currently ${statusWord(e.status)}.`}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="status-form" variant={leaving ? "danger" : "primary"} busy={isSubmitting}>
          {leaving ? "End employment" : "Save status"}
        </Button>
      </>}>
      <form id="status-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <ErrorNote error={formError} />}
        <Field label="New status" error={errors.status?.message}>
          <Select {...register("status")}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label={leaving ? "Last working day" : "Effective from"} error={errors.effectiveDate?.message}>
          <Input type="date" aria-invalid={!!errors.effectiveDate} {...register("effectiveDate")} />
        </Field>
        {leaving && (
          <Field label="Type of leaving" hint="Counted in turnover as voluntary, involuntary or other.">
            <Select {...register("terminationKind")}>
              <option value="VOLUNTARY">Voluntary (resigned)</option>
              <option value="INVOLUNTARY">Involuntary (dismissed or made redundant)</option>
              <option value="OTHER">Other (end of contract, retirement, death)</option>
            </Select>
          </Field>
        )}
        <Field label={leaving ? "Reason for leaving" : "Note"} optional={!leaving} error={errors.reason?.message}
          hint={leaving ? "Their direct reports move to their manager. This cannot be undone." : undefined}>
          {leaving
            ? <ListInput id="leave-reason" listKey="TERMINATION_REASON" aria-invalid={!!errors.reason} {...register("reason")} placeholder="Resigned" />
            : <Input aria-invalid={!!errors.reason} {...register("reason")} />}
        </Field>
      </form>
    </Dialog>
  );
}

function statusWord(status: EmployeeStatus) {
  return { CANDIDATE: "a candidate", PROBATION: "on probation", ACTIVE: "active", ON_LEAVE: "on leave", TERMINATED: "no longer employed" }[status];
}
