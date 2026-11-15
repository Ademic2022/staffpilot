"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "urql";
import { z } from "zod";

import { EMPLOYMENT_TYPES, JobOptionsDocument, activeOptions, titlesFor } from "@/components/employees/EmployeeDialogs";
import { Button, Card, ErrorNote, Field, FormActions, FormSection, Input, Loading, Notice, PageHeader, Select } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const HireDocument = graphql(`
  mutation HireEmployee($input: HireEmployeeInput!) {
    hireEmployee(input: $input) {
      employee { id }
      errors { field message }
    }
  }
`);


const schema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  workEmail: z.union([z.literal(""), z.email("Enter a valid email address.")]),
  hireDate: z.iso.date("Choose a start date."),
  probationEndDate: z.union([z.literal(""), z.iso.date()]),
  legalEntityId: z.string().min(1, "Choose a legal entity."),
  departmentId: z.string(),
  locationId: z.string(),
  jobTitleId: z.string(),
  gradeId: z.string(),
  managerId: z.string(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  salary: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, "Enter an amount like 450000 or 450000.50."),
});

type Values = z.infer<typeof schema>;
type FieldName = keyof Values;

export default function HirePage() {
  const router = useRouter();
  const { can, tenant } = useSession();
  const [{ data, fetching }] = useQuery({ query: JobOptionsDocument });
  const [, hire] = useMutation(HireDocument);
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, control, setError, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "", lastName: "", workEmail: "", hireDate: "", probationEndDate: "", legalEntityId: "",
      departmentId: "", locationId: "", jobTitleId: "", gradeId: "", managerId: "", employmentType: "FULL_TIME",
      salary: "",
    },
  });
  const entityId = useWatch({ control, name: "legalEntityId" });
  const departmentId = useWatch({ control, name: "departmentId" });
  const jobTitleId = useWatch({ control, name: "jobTitleId" });
  const titles = titlesFor(data?.jobTitles, data?.departments, departmentId);
  // A title that does not belong to the chosen department is cleared, so a mismatch cannot be saved.
  useEffect(() => {
    if (data && jobTitleId && !titles.some((t) => t.id === jobTitleId)) setValue("jobTitleId", "");
  }, [data, jobTitleId, titles, setValue]);

  if (!can(PERMS.employeesManage)) return <Notice tone="warning">You do not have permission to add employees.</Notice>;
  if (!data && fetching) return <Loading shape="form" />;

  async function onSubmit(v: Values) {
    setFormError(undefined);
    const blank = (s: string) => s || null;
    const result = await hire({
      input: {
        firstName: v.firstName, lastName: v.lastName, workEmail: blank(v.workEmail), hireDate: v.hireDate,
        probationEndDate: blank(v.probationEndDate), legalEntityId: v.legalEntityId,
        departmentId: blank(v.departmentId), locationId: blank(v.locationId), jobTitleId: blank(v.jobTitleId),
        gradeId: blank(v.gradeId), managerId: blank(v.managerId), employmentType: v.employmentType,
        compensation: v.salary ? { amount: v.salary } : null,
      },
    });
    if (result.error) {
      setFormError(errorMessage(result.error));
      return;
    }
    const payload = result.data?.hireEmployee;
    if (payload?.errors.length) {
      // Field errors from the API land on the matching input; the rest go above the form.
      for (const err of payload.errors) {
        if (err.field && err.field in schema.shape) setError(err.field as FieldName, { message: err.message });
        else setFormError(err.message);
      }
      return;
    }
    if (payload?.employee) router.push(`/employees/${payload.employee.id}`);
  }

  const inEntity = <T extends { id: string; name: string; isActive: boolean; legalEntity: { id: string } }>(items: T[] | undefined) =>
    activeOptions(items).filter((i) => i.legalEntity.id === entityId);

  function text(name: FieldName, label: string, type = "text", hint?: string, optional?: boolean) {
    return (
      <Field label={label} error={errors[name]?.message} hint={hint} optional={optional}>
        <Input type={type} aria-invalid={!!errors[name]} {...register(name)} />
      </Field>
    );
  }

  function choice(name: FieldName, label: string, options: { id: string; name: string }[], empty = "None") {
    return (
      <Field label={label} error={errors[name]?.message}>
        <Select aria-invalid={!!errors[name]} {...register(name)}>
          <option value="">{empty}</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </Field>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader back={{ href: "/employees", label: "Employees" }} title="Add employee"
        subtitle="Their job history and audit trail start from the date they join." />
      {formError ? <div className="mt-4"><ErrorNote error={formError} /></div> : null}

      <Card className="mt-5">
        <FormSection title="Person" description="Legal names as they appear on official documents.">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("firstName", "First name")}
            {text("lastName", "Last name")}
            {text("workEmail", "Work email", "email", undefined, true)}
          </div>
        </FormSection>

        <FormSection title="Job" description="Department and location list only the units of the chosen legal entity.">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("hireDate", "Start date", "date")}
            {text("probationEndDate", "Probation ends", "date", "Leave blank if there is no probation.", true)}
            {choice("legalEntityId", "Legal entity", activeOptions(data?.legalEntities), "Choose…")}
            <Field label="Employment type">
              <Select {...register("employmentType")}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            {choice("departmentId", "Department", inEntity(data?.departments))}
            {choice("jobTitleId", "Job title", titles)}
            {choice("locationId", "Location", inEntity(data?.locations))}
            {choice("gradeId", "Grade", activeOptions(data?.grades))}
            {choice("managerId", "Manager", (data?.employees.nodes ?? []).map((e) => ({ id: e.id, name: e.fullName })))}
          </div>
        </FormSection>

        {can(PERMS.compensationManage) ? (
          <FormSection title="Pay" description="Starting pay, effective from the start date. Only people with pay access can see it.">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("salary", `Monthly base pay (${tenant?.currency ?? ""})`, "text", "You can add it later.", true)}
            </div>
          </FormSection>
        ) : null}
      </Card>

      <FormActions>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" busy={isSubmitting}>{isSubmitting ? "Saving…" : "Add employee"}</Button>
      </FormActions>
    </form>
  );
}
