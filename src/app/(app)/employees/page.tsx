"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "urql";

import { IconPlus } from "@/components/icons";
import { Directory } from "@/components/people/Directory";
import { OrgChart } from "@/components/people/OrgChart";
import { PeopleList } from "@/components/people/PeopleList";
import { ButtonLink, Loading, Notice, PageHeader, Tabs } from "@/components/ui";
import { graphql } from "@/gql";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

type View = "list" | "directory" | "chart";

const AccessDocument = graphql(`
  query MyDirectoryAccess { myDirectoryAccess { directory orgChart } }
`);

/** People, as BambooHR lays it out: the HR list, the company directory and the org chart under one roof. */
function People() {
  const { can } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // The list holds personal details, so it needs employees.view; everyone else starts on the directory.
  const full = can(PERMS.employeesView);
  // Settings → Company directory can switch the directory and org chart off, or limit who sees them.
  const [{ data: access }] = useQuery({ query: AccessDocument });
  const seesDirectory = access?.myDirectoryAccess.directory ?? true;
  const seesChart = access?.myDirectoryAccess.orgChart ?? true;
  const asked = params.get("view") as View | null;
  const allowed = (v: View) => (v === "list" ? full : v === "directory" ? seesDirectory : seesChart);
  const view: View = asked && allowed(asked) ? asked : full ? "list" : seesDirectory ? "directory" : "chart";
  const go = (next: View, focus?: string) => {
    const q = new URLSearchParams({ view: next });
    if (focus) q.set("focus", focus);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };
  const tabs: { key: View; label: string }[] = [
    ...(full ? [{ key: "list" as const, label: "List" }] : []),
    ...(seesDirectory ? [{ key: "directory" as const, label: "Directory" }] : []),
    ...(seesChart ? [{ key: "chart" as const, label: "Org chart" }] : []),
  ];

  return (
    <>
      <PageHeader title="People"
        actions={can(PERMS.employeesManage) ? <ButtonLink href="/employees/new" icon={<IconPlus size={16} />}>New employee</ButtonLink> : undefined} />
      {!tabs.length && <Notice title="Turned off">Your company has turned off the directory and org chart.</Notice>}
      {tabs.length > 0 && <Tabs value={view} onChange={(v) => go(v)} tabs={tabs} />}
      {view === "list" && full && <PeopleList />}
      {view === "directory" && seesDirectory && <Directory onChart={(id) => go(seesChart ? "chart" : "directory", id)} />}
      {view === "chart" && seesChart && <OrgChart focus={params.get("focus")} />}
    </>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<Loading shape="table" />}>
      <People />
    </Suspense>
  );
}
