"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { visibleAreas } from "@/components/settings/areas";
import { SetupBar } from "@/components/settings/SetupChecklist";
import { Loading, Notice, cx } from "@/components/ui";
import { useSession } from "@/lib/session";

/** Settings, as BambooHR lays it out: the areas on the left, the chosen one in a panel with its own sections. */
function Shell({ children }: { children: ReactNode }) {
  const { can, tenant } = useSession();
  const pathname = usePathname();
  const params = useSearchParams();
  const areas = visibleAreas(can, tenant);
  const area = areas.find((a) => pathname.startsWith(a.href));
  const tab = params.get("tab") ?? area?.tabs?.[0].key;

  return (
    <>
      <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.01em] text-ink sm:text-[30px]">Settings</h1>
      <SetupBar />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto pr-8 lg:w-60 lg:flex-none lg:flex-col lg:pr-0 [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:[mask-image:none]">
          {areas.map((a) => {
            const active = a === area;
            return (
              <Link key={a.href} href={a.href} aria-current={active ? "page" : undefined}
                className={cx("flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  active ? "bg-brand text-white" : "text-ink hover:bg-subtle")}>
                <FontAwesomeIcon icon={a.icon} fixedWidth className={active ? "text-white" : "text-muted"} />{a.label}
              </Link>
            );
          })}
        </nav>
        <section className="min-w-0 flex-1 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          {!area ? <Notice tone="warning" title="Not available">You do not have permission to change these settings.</Notice> : (
            <>
              <h2 className="border-b border-line pb-3 font-display text-2xl text-brand-ink">{area.label}</h2>
              <div className={cx("mt-5", area.tabs && "flex flex-col gap-6 md:flex-row md:items-start")}>
                {area.tabs && (
                  <nav aria-label={`${area.label} sections`} className="flex gap-1 overflow-x-auto md:w-48 md:flex-none md:flex-col">
                    {area.tabs.map((t) => (
                      <Link key={t.key} href={`${area.href}?tab=${t.key}`} scroll={false} aria-current={tab === t.key ? "page" : undefined}
                        className={cx("whitespace-nowrap rounded-lg px-3 py-2 text-sm transition",
                          tab === t.key ? "bg-subtle font-semibold text-brand-ink" : "text-ink hover:bg-subtle/60")}>
                        {t.label}
                      </Link>
                    ))}
                  </nav>
                )}
                {/* A fresh page per section, so a "saved" note from one does not linger on the next. */}
                <div key={tab} className="min-w-0 flex-1 space-y-5">{children}</div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
