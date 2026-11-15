"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "urql";

import { IconDownload } from "@/components/icons";
import { FavoriteStar } from "@/components/reports/Shell";
import { ResultView } from "@/components/reports/ResultView";
import { ButtonLink, Card, ErrorNote, Field, Input, Loading, PageHeader, Select } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { today } from "@/lib/forms";
import { ReportCatalogDocument } from "@/lib/reports";

const RunReportDocument = graphql(`
  query RunReport($key: String!, $params: ReportParams) {
    runReport(key: $key, params: $params) {
      title chart note start end rows
      columns { key label kind }
      summary { label value }
    }
  }
`);

const FilterOptionsDocument = graphql(`
  query ReportFilterOptions {
    legalEntities { id name isActive }
    locations { id name isActive }
    departments { id name isActive }
  }
`);

const GROUP_LABELS: Record<string, string> = {
  department: "Department", location: "Location", legal_entity: "Legal entity", grade: "Grade", employment_type: "Employment type",
};

export default function ReportPage() {
  const { key } = useParams<{ key: string }>();
  const [{ data: catalog }, refetchCatalog] = useQuery({ query: ReportCatalogDocument });
  const [{ data: options }] = useQuery({ query: FilterOptionsDocument });
  const info = catalog?.reportCatalog.find((r) => r.key === key);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState(today());
  const [groupBy, setGroupBy] = useState("department");
  const [entity, setEntity] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");

  const params = {
    start: info?.usesRange && start ? start : null, end: end || null, groupBy,
    legalEntityId: entity || null, locationId: location || null, departmentId: department || null,
  };
  const [{ data, error, fetching }] = useQuery({ query: RunReportDocument, variables: { key, params } });
  const result = data?.runReport;

  const query = new URLSearchParams(Object.entries({
    start: params.start ?? "", end: params.end ?? "", groupBy, legalEntity: entity, location, department,
  }).filter(([, v]) => v));
  const exportHref = (fmt: string) => `/api/reports/${key}/${fmt}/?${query}`;

  const active = <T extends { isActive: boolean }>(xs: T[] | undefined) => (xs ?? []).filter((x) => x.isActive);

  return (
    <>
      <PageHeader back={{ href: "/reports?tab=standard", label: "Reports" }} title={info?.title ?? "Report"}
        subtitle={result ? result.title : info?.description}
        actions={result && (
          <>
            {info && <FavoriteStar on={info.favorite} reportKey={info.key} label={info.title} onChanged={() => refetchCatalog({ requestPolicy: "network-only" })} />}
            <ButtonLink href={exportHref("pdf")} download variant="secondary" icon={<IconDownload size={16} />}>PDF</ButtonLink>
            <ButtonLink href={exportHref("xlsx")} download variant="secondary">Excel</ButtonLink>
            <ButtonLink href={exportHref("csv")} download variant="ghost">CSV</ButtonLink>
          </>
        )} />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {info?.usesRange && (
            <Field label="From"><Input type="date" value={start || result?.start || ""} max={end} onChange={(e) => setStart(e.target.value)} /></Field>
          )}
          <Field label={info?.usesRange ? "To" : "As of"}><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          {info && info.groupings.length > 0 && (
            <Field label="Group by">
              <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                {info.groupings.map((g) => <option key={g} value={g}>{GROUP_LABELS[g] ?? g}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Legal entity">
            <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">All</option>
              {active(options?.legalEntities).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All</option>
              {active(options?.locations).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All</option>
              {active(options?.departments).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      {error ? <ErrorNote error={errorMessage(error)} /> : !result ? <Loading shape="table" /> : <ResultView result={result} fetching={fetching} />}
    </>
  );
}
