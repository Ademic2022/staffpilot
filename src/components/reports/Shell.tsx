"use client";

import { faChartColumn, faClockRotateLeft, faPlus, faStar as faStarSolid, faTableList } from "@fortawesome/free-solid-svg-icons";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMutation } from "urql";

import { ButtonLink, cx } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { SetFavoriteReportDocument } from "@/lib/reports";
import { useSession } from "@/lib/session";

export type ReportsTab = "recent" | "standard" | "custom";

const TABS: { key: ReportsTab; label: string; icon: typeof faChartColumn }[] = [
  { key: "recent", label: "Recent", icon: faClockRotateLeft },
  { key: "standard", label: "Standard reports", icon: faChartColumn },
  { key: "custom", label: "Custom reports", icon: faTableList },
];

/** Reports, as BambooHR lays them out: a menu on the left and the chosen list on the right. */
export function ReportsShell({ tab, actions, children }: { tab: ReportsTab; actions?: ReactNode; children: ReactNode }) {
  const { can } = useSession();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.01em] text-ink sm:text-[30px]">Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {can(PERMS.employeesView) && <ButtonLink href="/reports/custom/new" icon={<FontAwesomeIcon icon={faPlus} />}>New report</ButtonLink>}
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav aria-label="Reports" className="flex gap-1 overflow-x-auto pr-8 lg:w-56 lg:flex-none lg:flex-col lg:pr-0 [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:[mask-image:none]">
          {TABS.filter((t) => t.key !== "custom" || can(PERMS.employeesView)).map((t) => (
            <Link key={t.key} href={`/reports?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
              className={cx("flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                tab === t.key ? "bg-brand text-white" : "text-ink hover:bg-subtle")}>
              <FontAwesomeIcon icon={t.icon} fixedWidth className={tab === t.key ? "text-white" : "text-muted"} />{t.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1 space-y-5">{children}</div>
      </div>
    </>
  );
}

/** The star that adds a report to Favourites. */
export function FavoriteStar({ on, reportKey, customId, label, onChanged }: {
  on: boolean; reportKey?: string; customId?: string; label: string; onChanged: () => void;
}) {
  const [{ fetching }, setFavorite] = useMutation(SetFavoriteReportDocument);
  return (
    <button type="button" disabled={fetching} aria-pressed={on} aria-label={on ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
      title={on ? "Remove from favorites" : "Add to favorites"}
      onClick={async () => { await setFavorite({ favorite: !on, key: reportKey ?? null, customId: customId ?? null }); onChanged(); }}
      className={cx("grid h-8 w-8 flex-none place-items-center rounded-full transition hover:bg-subtle", on ? "text-amber-500" : "text-muted hover:text-ink")}>
      <FontAwesomeIcon icon={on ? faStarSolid : faStar} />
    </button>
  );
}

export const viewedOn = (at: string | null | undefined) => (at ? formatDate(at.slice(0, 10)) : "—");

/** A titled white panel holding one list of reports. */
export function Panel({ title, icon, children, actions }: { title: string; icon?: typeof faChartColumn; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-brand-ink">
          {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-subtle text-[13px]"><FontAwesomeIcon icon={icon} /></span>}{title}
        </h2>
        {actions}
      </header>
      {children}
    </section>
  );
}
