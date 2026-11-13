"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import { CompanyLogo } from "@/components/CompanyLogo";
import { InstallBanner } from "@/components/ThisDevice";
import { graphql } from "@/gql";
import { formatDate, initials } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession, type Tenant } from "@/lib/session";

import { IconCalendarCheck, IconChart, IconCheck, IconClock, IconClose, IconFile, IconHome, IconLogout, IconMenu, IconReceipt, IconSettings, IconStar, IconUser, IconUsers, IconWallet } from "./icons";
import { HelpButton } from "./HelpButton";
import { Tour } from "./Tour";
import { NotificationBell } from "./Notifications";
import { GlobalSearch } from "@/components/GlobalSearch";
import { visibleAreas } from "@/components/settings/areas";
import { useSnapshot } from "./snapshot/Snapshot";
import { IconButton, Loading, Notice, cx } from "./ui";

const LogoutDocument = graphql(`
  mutation Logout {
    logout
  }
`);

const WaitingDocument = graphql(`
  query WaitingApprovals {
    leaveApprovals { id }
    pendingChanges { id canDecide }
  }
`);

interface NavItem {
  href: string;
  label: string;
  show: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** A count shown beside the label, such as requests waiting for you. */
  count?: number;
  /** Lights up for every page under this path, when that differs from href. */
  match?: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  hr_admin: "HR administrator",
  payroll_officer: "Payroll officer",
  manager: "Manager",
  employee: "Employee",
};

const StopViewAsDocument = graphql(`
  mutation StopViewAs { stopViewAs { permissions } }
`);

/** Shown while an admin sees the app as someone else (Settings → Users and access → View as). */
function ViewAsBanner({ name, realName, onStop }: { name: string; realName: string; onStop: () => void }) {
  const router = useRouter();
  const [{ fetching }, stop] = useMutation(StopViewAsDocument);
  return (
    <div role="status" className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-4 py-2 text-sm text-amber-950 shadow">
      <span><strong>Viewing as {name}.</strong> This is what they see. Changes are off. You are {realName}.</span>
      <button type="button" disabled={fetching} onClick={async () => { await stop({}); onStop(); router.push("/settings/users"); }}
        className="rounded-full bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-900">Stop viewing</button>
    </div>
  );
}

/** Everyone sees this while the company is closing; owners get the way to export or cancel. */
function ClosingBanner({ tenant, owner }: { tenant: Tenant; owner: boolean }) {
  return (
    <div role="status" className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-red-700 px-4 py-2 text-sm text-white shadow">
      <span><strong>{tenant.name} is closing on {formatDate(tenant.closesOn)}.</strong> StaffPilot is read-only until then; after that nobody can sign in.</span>
      {owner && <Link href="/settings/company?tab=data" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-50">Export or cancel</Link>}
    </div>
  );
}

function Crest({ tenant }: { tenant: Tenant | null }) {
  if (tenant?.logoUrl) {
    return <CompanyLogo src={tenant.logoUrl} className="h-9 w-9" />;
  }
  const label = tenant ? initials(tenant.name.replace(/\b(ltd|limited|plc|inc|the)\b\.?/gi, "")) || tenant.name[0] : "";
  return (
    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-brand font-display text-[15px] font-semibold text-white">
      {label}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { loading, me, tenant, can, reset } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [, logout] = useMutation(LogoutDocument);
  const [openOn, setOpenOn] = useState<string | null>(null);
  const drawerOpen = openOn === pathname;
  const snapshot = useSnapshot();
  // Refreshed on each page change, so the badge drops as requests are decided.
  const [{ data: waiting }, recount] = useQuery({ query: WaitingDocument, pause: !me });
  useEffect(() => {
    if (me) recount({ requestPolicy: "network-only" });
  }, [pathname, me, recount]);

  useEffect(() => {
    if (!loading && !me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, me, pathname, router]);

  useEffect(() => {
    if (tenant?.primaryColor) document.documentElement.style.setProperty("--brand", tenant.primaryColor);
  }, [tenant?.primaryColor]);

  if (loading || !me) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Loading />
      </div>
    );
  }

  const profileHref = me.employee ? `/employees/${me.employee.id}` : null;
  const waitingCount = (waiting?.leaveApprovals.length ?? 0) + (waiting?.pendingChanges.filter((c) => c.canDecide).length ?? 0);
  const settingsHref = visibleAreas(can, tenant)[0]?.href;
  const sections: { section: string; items: NavItem[] }[] = [
    {
      section: "",
      items: [
        { href: "/home", label: "Home", show: true, icon: IconHome },
        { href: profileHref ?? "", label: "My profile", show: !!profileHref, icon: IconUser },
        { href: "/payslips", label: "My payslips", show: !!me.employee && (Boolean(tenant?.payrollEnabled) || me.hasPayslips), icon: IconReceipt },
      ],
    },
    {
      section: "People",
      items: [
        // List, directory and org chart in one place, as BambooHR's People page; without employees.view it opens on the directory.
        { href: "/employees", label: "People", show: true, icon: IconUsers },
        // Change requests have no menu item: they reach HR through the bell, email and the home feed.
        {
          href: "/reports", label: "Reports", icon: IconChart,
          show: can(PERMS.employeesView, PERMS.leaveManage, PERMS.compensationView),
        },
        { href: "/performance", label: "Performance", show: !!me.employee || can(PERMS.performanceManage), icon: IconStar },
        { href: "/expenses", label: "Expenses", show: Boolean(tenant?.expensesEnabled) || can(PERMS.expensesManage), icon: IconReceipt },
        { href: "/payroll", label: "Payroll", show: Boolean(tenant?.payrollEnabled) && can(PERMS.payrollManage, PERMS.payrollApprove), icon: IconWallet },
        // Company files for everyone (HR also finds employee documents there).
        { href: "/files", label: "Files", show: true, icon: IconFile },
      ],
    },
    {
      section: "Time off",
      items: [
        { href: "/leave", label: "My time off", show: !!me.employee, icon: IconCalendarCheck },
        {
          href: "/leave/approvals", label: "Approvals", icon: IconCheck, count: waitingCount,
          show: waitingCount > 0 || can(PERMS.leaveManage) || me.roles.includes("manager"),
        },
        {
          href: "/attendance", label: "Attendance", icon: IconClock,
          show: Boolean(tenant?.attendanceEnabled || tenant?.timesheetsEnabled) || can(PERMS.attendanceManage),
        },
        { href: "/leave/calendar", label: "Leave calendar", show: !!me.employee || can(PERMS.leaveManage), icon: IconCalendarCheck },
      ],
    },
    {
      section: "Administration",
      items: [
        // Every setup page lives under Settings, as in BambooHR; it opens on the first area this person may change.
        { href: settingsHref ?? "", label: "Settings", show: !!settingsHref, icon: IconSettings, match: "/settings", tour: "nav-settings" },
      ],
    },
  ]
    .map((s) => ({ ...s, items: s.items.filter((i) => i.show) }))
    .filter((s) => s.items.length);

  // Show the most senior role; the full set is on the user's membership.
  const senior = ["owner", "hr_admin", "payroll_officer", "manager", "employee"].find((r) => me.roles.includes(r));
  const roleLabel = senior ? ROLE_LABELS[senior] : me.roles[0] ?? "";

  async function signOut() {
    await logout({});
    reset();
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        <Crest tenant={tenant} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{tenant?.name}</div>
          <div className="truncate text-xs text-muted">People and payroll</div>
        </div>
        <div className="hidden items-center lg:flex"><span data-tour="help"><HelpButton /></span><span data-tour="bell"><NotificationBell /></span></div>
      </div>
      <div className="px-3 pb-1 pt-1" data-tour="search"><GlobalSearch /></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main" data-tour="nav">
        {sections.map((s) => (
          <div key={s.section || "main"} className="mt-5 first:mt-1">
            {s.section && <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted/80">{s.section}</div>}
            <ul className="space-y-0.5">
              {s.items.map((item) => {
                // "My profile" is one employee page; it should not also light up when viewing a colleague.
                // Exact match for pages that have siblings below them (/leave vs /leave/approvals).
                const exact = item.href === profileHref || item.href === "/leave" || item.href === "/employees";
                const active = exact ? pathname === item.href : pathname.startsWith(item.match ?? item.href) && pathname !== profileHref;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-tour={"tour" in item ? item.tour : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                        active ? "bg-subtle text-ink" : "text-muted hover:bg-subtle/70 hover:text-ink",
                      )}
                    >
                      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-brand" aria-hidden />}
                      <Icon size={18} className={active ? "text-brand-ink" : "text-muted group-hover:text-ink"} />
                      {item.label}
                      {item.count ? (
                        <span className="ml-auto rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-[18px] text-white tabular-nums">{item.count}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5" data-tour="me">
          <Link href="/account" title="Your account and security" className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 transition hover:bg-subtle">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-subtle text-xs font-semibold text-ink ring-1 ring-line">{initials(me.user.fullName)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{me.user.fullName}</div>
              <div className="truncate text-xs text-muted">{roleLabel}</div>
            </div>
          </Link>
          <IconButton label="Sign out" onClick={signOut}>
            <IconLogout size={17} />
          </IconButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2">Skip to content</a>
      {/* Sticky makes its own stacking layer; lift it over page content (org chart lists use z-40) so the bell menu is not covered. Dialogs sit at z-50. */}
      <aside className="sticky top-0 z-[45] hidden h-screen border-r border-line bg-surface lg:block">{sidebar}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="ui-fade-in absolute inset-0 bg-black/40" onClick={() => setOpenOn(null)} aria-hidden />
          <div className="ui-slide-in absolute inset-y-0 left-0 w-[280px] border-r border-line bg-surface shadow-lg">
            <IconButton label="Close menu" className="absolute right-2 top-4 z-10" onClick={() => setOpenOn(null)}>
              <IconClose size={16} />
            </IconButton>
            {sidebar}
          </div>
        </div>
      )}

      {/* Room for the docked snapshot panel on wide screens. */}
      <div className={cx("min-w-0 transition-[padding] duration-200", snapshot.personId && "xl:pr-[392px]")}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <IconButton label="Open menu" onClick={() => setOpenOn(pathname)}>
            <IconMenu />
          </IconButton>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Crest tenant={tenant} />
            <span className="truncate text-sm font-semibold text-ink">{tenant?.name}</span>
          </div>
          <span data-tour="search"><GlobalSearch compact /></span>
          <span data-tour="help"><HelpButton /></span>
          <span data-tour="bell"><NotificationBell align="right" /></span>
        </header>

        {tenant?.status === "closing" && <ClosingBanner tenant={tenant} owner={can(PERMS.tenantManage)} />}
        {me.viewingAs && <ViewAsBanner name={me.viewingAs.name} realName={me.viewingAs.realName} onStop={reset} />}
        <main id="main" className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
          {pathname === "/home" && <InstallBanner />}
          {me.mfaSetupRequired && pathname !== "/account" && (
            <div data-tour="mfa"><Notice tone="warning" title="Set up two-step sign-in to use your admin access">
              {tenant?.name} requires it for your role. Until then you can use the app as an employee.{" "}
              <Link href="/account" className="font-semibold underline-offset-2 hover:underline">Set it up now</Link>
            </Notice></div>
          )}
          {children}
        </main>
        <Tour />
      </div>
    </div>
  );
}
