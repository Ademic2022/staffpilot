"use client";

import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { IconDownload } from "@/components/icons";
import { FavoriteStar } from "@/components/reports/Shell";
import { ResultView } from "@/components/reports/ResultView";
import { Badge, Button, ButtonLink, Dialog, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { CustomReportsDocument } from "@/lib/reports";

const RunDocument = graphql(`
  query RunCustomReport($id: ID!) {
    runCustomReport(id: $id) { title chart note rows columns { key label kind } summary { label value } }
  }
`);

const DeleteDocument = graphql(`
  mutation DeleteCustomReport($id: ID!) {
    deleteCustomReport(id: $id)
  }
`);

export default function CustomReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [{ data: list }, refetchList] = useQuery({ query: CustomReportsDocument, requestPolicy: "cache-and-network" });
  const [{ data, error, fetching }] = useQuery({ query: RunDocument, variables: { id }, requestPolicy: "network-only" });
  const [removing, remove] = useMutation(DeleteDocument);
  const [confirm, setConfirm] = useState(false);
  const report = list?.customReports.find((r) => r.id === id);
  const exportHref = (fmt: string) => `/api/reports/custom/${id}/${fmt}/`;

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="table" />;

  return (
    <>
      <PageHeader back={{ href: "/reports?tab=custom", label: "Custom reports" }} title={data.runCustomReport.title}
        subtitle={report && <>
          {report.description && <span>{report.description}</span>}
          <span>{report.mine ? "Made by you" : `Made by ${report.ownerName}`}</span>
          {report.shared && <Badge tone="brand">Shared with the company</Badge>}
        </>}
        actions={<>
          {report && <FavoriteStar on={report.favorite} customId={report.id} label={report.name} onChanged={() => refetchList({ requestPolicy: "network-only" })} />}
          {report?.mine && <ButtonLink href={`/reports/custom/${id}/edit`} variant="secondary" icon={<FontAwesomeIcon icon={faPen} />}>Edit</ButtonLink>}
          <ButtonLink href={exportHref("pdf")} download variant="secondary" icon={<IconDownload size={16} />}>PDF</ButtonLink>
          <ButtonLink href={exportHref("xlsx")} download variant="secondary">Excel</ButtonLink>
          <ButtonLink href={exportHref("csv")} download variant="ghost">CSV</ButtonLink>
          {report?.mine && <Button variant="ghost" onClick={() => setConfirm(true)} icon={<FontAwesomeIcon icon={faTrash} />}>Delete</Button>}
        </>} />
      <ResultView result={data.runCustomReport} fetching={fetching} empty="No one matches this report's filters." />
      {confirm && (
        <Dialog open onClose={() => setConfirm(false)} title="Delete this report?"
          description={report?.shared ? "It is shared, so it disappears for everyone." : "This cannot be undone."}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Keep it</Button>
            <Button variant="danger" busy={removing.fetching} onClick={async () => {
              const result = await remove({ id });
              if (result.data?.deleteCustomReport) router.push("/reports?tab=custom");
            }}>Delete report</Button>
          </>}>
          {removing.error && <ErrorNote error={errorMessage(removing.error)} />}
        </Dialog>
      )}
    </>
  );
}
