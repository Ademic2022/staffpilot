"use client";

import { useParams } from "next/navigation";
import { useQuery } from "urql";

import type { PeopleFilter, Showing } from "@/components/people/shared";
import { CustomBuilder } from "@/components/reports/CustomBuilder";
import { ErrorNote, Loading, Notice } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { CustomReportsDocument } from "@/lib/reports";

export default function EditCustomReportPage() {
  const { id } = useParams<{ id: string }>();
  const [{ data, error }] = useQuery({ query: CustomReportsDocument, requestPolicy: "network-only" });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  const report = data.customReports.find((r) => r.id === id);
  if (!report || !report.mine) return <Notice tone="warning" title="Not yours to change">Only whoever made a report can change it.</Notice>;
  return (
    <CustomBuilder initial={{
      id: report.id, name: report.name, description: report.description, fields: report.fields,
      filter: report.filter as PeopleFilter, showing: report.showing as Showing, shared: report.shared,
    }} />
  );
}
