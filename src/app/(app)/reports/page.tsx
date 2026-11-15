"use client";

import { faChartColumn, faClockRotateLeft, faStar, faTableList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useQuery } from "urql";

import { FavoriteStar, Panel, ReportsShell, viewedOn, type ReportsTab } from "@/components/reports/Shell";
import { ErrorNote, Loading, SearchInput, Tabs, cx } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { PERMS } from "@/lib/permissions";
import { CATEGORIES, CustomReportsDocument, ReportCatalogDocument } from "@/lib/reports";
import { useSession } from "@/lib/session";

type Entry = {
  id: string; title: string; href: string; kind: "standard" | "custom"; favorite: boolean; lastViewed?: string | null;
  owner?: string; reportKey?: string; customId?: string;
};

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cx("px-4 py-2.5 text-left text-[13px] font-semibold text-ink first:pl-5", className)}>{children}</th>;
}

function ReportRows({ rows, owner, onChanged }: { rows: Entry[]; owner?: boolean; onChanged: () => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-subtle/70">
        <tr><Th>Name</Th><Th className="w-40">Last viewed</Th>{owner && <Th className="w-48">Owner</Th>}<Th className="w-14"><span className="sr-only">Favorite</span></Th></tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => (
          <tr key={r.id} className="transition hover:bg-subtle/50">
            <td className="px-4 py-2.5 pl-5">
              <Link href={r.href} className="flex items-center gap-2.5 font-medium text-brand-ink hover:underline">
                <FontAwesomeIcon icon={r.kind === "custom" ? faTableList : faChartColumn} className="text-xs text-muted" />{r.title}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">{viewedOn(r.lastViewed)}</td>
            {owner && <td className="px-4 py-2.5 text-muted">{r.owner}</td>}
            <td className="px-2 py-1.5"><FavoriteStar on={r.favorite} reportKey={r.reportKey} customId={r.customId} label={r.title} onChanged={onChanged} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Reports() {
  const { can } = useSession();
  const params = useSearchParams();
  const asked = params.get("tab") as ReportsTab | null;
  const tab: ReportsTab = asked === "standard" || (asked === "custom" && can(PERMS.employeesView)) ? asked : "recent";
  const [{ data: catalog, error }, refetchCatalog] = useQuery({ query: ReportCatalogDocument });
  const [{ data: custom }, refetchCustom] = useQuery({ query: CustomReportsDocument, pause: !can(PERMS.employeesView) });
  const [owner, setOwner] = useState<"mine" | "company">("mine");
  const [search, setSearch] = useState("");
  const refresh = () => { refetchCatalog({ requestPolicy: "network-only" }); refetchCustom({ requestPolicy: "network-only" }); };

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!catalog) return <Loading shape="cards" />;

  const standard: Entry[] = catalog.reportCatalog.map((r) => ({
    id: r.key, title: r.title, href: `/reports/${r.key}`, kind: "standard", favorite: r.favorite, lastViewed: r.lastViewed, reportKey: r.key,
    owner: "Standard report",
  }));
  const customs: Entry[] = (custom?.customReports ?? []).map((r) => ({
    id: `custom:${r.id}`, title: r.name, href: `/reports/custom/${r.id}`, kind: "custom", favorite: r.favorite, lastViewed: r.lastViewed,
    owner: r.mine ? "Me" : r.ownerName, customId: r.id,
  }));
  const all = [...standard, ...customs];
  const favorites = all.filter((r) => r.favorite);
  const recent = all.filter((r) => r.lastViewed).sort((a, b) => b.lastViewed!.localeCompare(a.lastViewed!)).slice(0, 12);
  const q = search.trim().toLowerCase();

  return (
    <ReportsShell tab={tab}>
      {tab === "recent" && (
        <>
          <Panel title="Favorites" icon={faStar}>
            {favorites.length ? (
              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
                {favorites.map((r) => (
                  <Link key={r.id} href={r.href} className="group flex min-h-28 flex-col justify-between rounded-xl border border-line p-4 transition hover:border-brand-ink hover:shadow-sm">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-subtle text-brand-ink"><FontAwesomeIcon icon={r.kind === "custom" ? faTableList : faChartColumn} /></span>
                    <span className="mt-3 font-medium text-ink group-hover:text-brand-ink">{r.title}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="px-5 pb-5 text-sm text-muted">Star a report to keep it here.</p>}
          </Panel>
          <Panel title="Recent" icon={faClockRotateLeft}>
            {recent.length ? <ReportRows rows={recent} owner={customs.length > 0} onChanged={refresh} />
              : <p className="px-5 pb-5 text-sm text-muted">Reports you open show up here. Start with the <Link href="/reports?tab=standard" className="font-medium text-brand-ink hover:underline">standard reports</Link>.</p>}
          </Panel>
        </>
      )}

      {tab === "standard" && CATEGORIES.map((category) => {
        const rows = standard.filter((r) => catalog.reportCatalog.find((c) => c.key === r.id)?.category === category);
        return rows.length ? <Panel key={category} title={category}><ReportRows rows={rows} onChanged={refresh} /></Panel> : null;
      })}

      {tab === "custom" && (
        <Panel title="Custom reports" icon={faTableList}
          actions={<div className="w-64"><SearchInput aria-label="Filter custom reports" placeholder="Filter by name or owner" value={search} onChange={(e) => setSearch(e.target.value)} /></div>}>
          <div className="px-5"><Tabs value={owner} onChange={setOwner} tabs={[
            { key: "mine", label: "My reports", count: customs.filter((r) => r.owner === "Me").length },
            { key: "company", label: "Company reports", count: customs.filter((r) => r.owner !== "Me").length },
          ]} /></div>
          {(() => {
            const rows = customs.filter((r) => (owner === "mine") === (r.owner === "Me"))
              .filter((r) => !q || r.title.toLowerCase().includes(q) || r.owner?.toLowerCase().includes(q));
            return rows.length ? <div className="mt-2"><ReportRows rows={rows} owner onChanged={refresh} /></div> : (
              <p className="px-5 py-6 text-sm text-muted">
                {owner === "mine" ? <>No custom reports yet. <Link href="/reports/custom/new" className="font-medium text-brand-ink hover:underline">Build one</Link> from any employee fields.</> : "No one has shared a report with the company yet."}
              </p>
            );
          })()}
        </Panel>
      )}
    </ReportsShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<Loading shape="cards" />}>
      <Reports />
    </Suspense>
  );
}
