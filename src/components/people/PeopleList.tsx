"use client";

import {
  faArrowDown, faArrowUp, faBolt, faChevronDown, faChevronRight, faEllipsis, faFileArrowDown, faFileImport, faFloppyDisk,
  faListCheck, faSliders, faTableColumns, faUsers, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "urql";

import { TenureFrame } from "@/components/TenureMark";
import { Photo } from "@/components/home/Widgets";
import { tenure } from "@/components/profile/Vitals";
import { useSnapshot } from "@/components/snapshot/Snapshot";
import { Button, Checkbox, CursorPager, Dialog, ErrorNote, Field, IconButton, Input, SearchInput, Select, StatusBadge, cx, Loading } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { formatDate, humanize } from "@/lib/format";
import { PERMS } from "@/lib/permissions";
import { useSession } from "@/lib/session";

import {
  AGE_OPTIONS, COLUMNS, DEFAULT_COLUMNS, GENDER_OPTIONS, PRESET_VIEWS, STATUS_OPTIONS, TENURE_OPTIONS, TYPE_OPTIONS,
  filterCount, toEmployeeFilter, type PeopleFilter, type Showing,
} from "./shared";

const ListDocument = graphql(`
  query PeopleList($filter: EmployeeFilter, $first: Int, $after: String, $sort: String, $descending: Boolean!) {
    employees(filter: $filter, first: $first, after: $after, sort: $sort, descending: $descending) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        id employeeNumber firstName lastName preferredName fullName photoUrl status employmentType hireDate foundingMember
        workEmail workPhone workPhoneExt phone gender dateOfBirth
        jobTitle { name } department { name } location { name } legalEntity { name } grade { name } manager { fullName }
      }
    }
  }
`);

const OptionsDocument = graphql(`
  query PeopleFilterOptions {
    departments { id name isActive }
    locations { id name isActive }
    legalEntities { id name isActive }
    jobTitles { id name isActive }
    grades { id name isActive }
    teams { id name isActive }
    employeeViews { id name filter columns }
  }
`);

const SaveViewDocument = graphql(`
  mutation SavePeopleView($input: EmployeeViewInput!) {
    saveEmployeeView(input: $input) { view { id name } errors { field message } }
  }
`);

const DeleteViewDocument = graphql(`
  mutation DeletePeopleView($id: ID!) {
    deleteEmployeeView(id: $id)
  }
`);

const PAGE = 50;

/** Remembered in this browser only: which view, columns and Showing choice someone last used. */
function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  };
  return [value, update] as const;
}

export function Menu({ trigger, children, width = "w-60" }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      {trigger(open, () => setOpen(!open))}
      {open && <div role="menu" className={cx("absolute right-0 top-full z-40 mt-2 rounded-xl border border-line bg-surface py-1.5 shadow-lg", width)}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

function MenuItem({ icon, onClick, href, download, children }: { icon: typeof faBolt; onClick?: () => void; href?: string; download?: boolean; children: ReactNode }) {
  const className = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-subtle";
  const body = <><FontAwesomeIcon icon={icon} fixedWidth className="text-muted" />{children}</>;
  if (href) return download ? <a role="menuitem" href={href} download className={className}>{body}</a> : <Link role="menuitem" href={href} className={className}>{body}</Link>;
  return <button role="menuitem" type="button" onClick={onClick} className={className}>{body}</button>;
}

/* ------------------------------------------------------------------- Filter panel */

function Group({ title, options, values, onChange }: {
  title: string; options: { value: string; label: string }[]; values: string[] | undefined; onChange: (v: string[]) => void;
}) {
  const chosen = values ?? [];
  const [open, setOpen] = useState(chosen.length > 0);
  if (!options.length) return null;
  return (
    <div className="border-b border-line py-1">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className={cx("flex flex-1 items-center gap-2.5 py-2.5 text-left text-[15px]", chosen.length ? "font-medium text-brand-ink" : "text-ink")}>
          <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight} className="w-3 text-[11px] text-muted" />
          {chosen.length ? `${chosen.length} ${title}` : title}
        </button>
        {chosen.length > 0 && (
          <IconButton label={`Clear ${title}`} onClick={() => onChange([])}><FontAwesomeIcon icon={faXmark} className="text-xs" /></IconButton>
        )}
      </div>
      {open && (
        <ul className="max-h-60 space-y-0.5 overflow-y-auto pb-2 pl-5">
          {options.map((o) => (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm text-ink hover:bg-subtle">
                <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={chosen.includes(o.value)}
                  onChange={() => onChange(chosen.includes(o.value) ? chosen.filter((v) => v !== o.value) : [...chosen, o.value])} />
                <span className={chosen.includes(o.value) ? "font-medium" : undefined}>{o.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FilterPanel({ filter, onChange, total, options, onClose }: {
  filter: PeopleFilter; onChange: (f: PeopleFilter) => void; total: number | undefined;
  options: { departments: Opt[]; locations: Opt[]; legalEntities: Opt[]; jobTitles: Opt[]; grades: Opt[]; teams?: Opt[] }; onClose?: () => void;
}) {
  const set = <K extends keyof PeopleFilter>(key: K, value: PeopleFilter[K]) => onChange({ ...filter, [key]: value });
  return (
    <aside className="w-full flex-none lg:w-64">
      <div className="flex items-center justify-between gap-2 rounded-xl bg-brand px-4 py-3 text-white">
        <span className="flex items-center gap-2.5 font-semibold"><FontAwesomeIcon icon={faUsers} />{total ?? "…"} {total === 1 ? "person" : "people"}</span>
        <span className="flex items-center gap-1">
          {filterCount(filter) > 0 && <button type="button" onClick={() => onChange({})} className="rounded px-2 text-xs text-white/85 hover:text-white hover:underline">Clear</button>}
          {onClose && <button type="button" onClick={onClose} aria-label="Close filters" className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15"><FontAwesomeIcon icon={faXmark} /></button>}
        </span>
      </div>
      <div className="mt-2 px-1">
        <Group title="Statuses" options={STATUS_OPTIONS} values={filter.statuses} onChange={(v) => set("statuses", v as PeopleFilter["statuses"])} />
        <Group title="Employment types" options={TYPE_OPTIONS} values={filter.employmentTypes} onChange={(v) => set("employmentTypes", v as PeopleFilter["employmentTypes"])} />
        <Group title="Departments" options={toOptions(options.departments)} values={filter.departmentIds} onChange={(v) => set("departmentIds", v)} />
        <Group title="Legal entities" options={toOptions(options.legalEntities)} values={filter.legalEntityIds} onChange={(v) => set("legalEntityIds", v)} />
        <Group title="Locations" options={toOptions(options.locations)} values={filter.locationIds} onChange={(v) => set("locationIds", v)} />
        <Group title="Job titles" options={toOptions(options.jobTitles)} values={filter.jobTitleIds} onChange={(v) => set("jobTitleIds", v)} />
        <Group title="Grades" options={toOptions(options.grades)} values={filter.gradeIds} onChange={(v) => set("gradeIds", v)} />
        <Group title="Teams" options={toOptions(options.teams ?? [])} values={filter.teamIds} onChange={(v) => set("teamIds", v)} />
        <Group title="Length of service" options={TENURE_OPTIONS} values={filter.tenureBands} onChange={(v) => set("tenureBands", v)} />
        <Group title="Age" options={AGE_OPTIONS} values={filter.ageBands} onChange={(v) => set("ageBands", v)} />
        <Group title="Gender" options={GENDER_OPTIONS} values={filter.genders} onChange={(v) => set("genders", v)} />
        <div className="py-3">
          <Checkbox label="Managers only" description="People with direct reports" checked={Boolean(filter.managersOnly)} onChange={(c) => set("managersOnly", c || undefined)} />
        </div>
      </div>
    </aside>
  );
}

type Opt = { id: string; name: string; isActive: boolean };
const toOptions = (rows: Opt[]) => rows.filter((r) => r.isActive).map((r) => ({ value: r.id, label: r.name })).sort((a, b) => a.label.localeCompare(b.label));

/* ----------------------------------------------------------------------- Dialogs */

function ColumnsDialog({ columns, onClose, onSave }: { columns: string[]; onClose: () => void; onSave: (c: string[]) => void }) {
  const [chosen, setChosen] = useState(columns);
  const move = (key: string, by: number) => {
    const i = chosen.indexOf(key);
    const j = i + by;
    if (j < 0 || j >= chosen.length) return;
    const next = [...chosen];
    [next[i], next[j]] = [next[j], next[i]];
    setChosen(next);
  };
  return (
    <Dialog open wide onClose={onClose} title="Customize view" description="Choose which columns this list shows, and their order."
      footer={<>
        <Button variant="ghost" onClick={() => setChosen(DEFAULT_COLUMNS)}>Reset</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(chosen.length ? chosen : DEFAULT_COLUMNS)}>Save</Button>
      </>}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Available columns</p>
          <ul className="max-h-80 space-y-0.5 overflow-y-auto rounded-xl border border-line p-2">
            {COLUMNS.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink hover:bg-subtle">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={chosen.includes(c.key)}
                    onChange={() => setChosen(chosen.includes(c.key) ? chosen.filter((k) => k !== c.key) : [...chosen, c.key])} />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Shown, in order</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
            {chosen.map((key, i) => (
              <li key={key} className="flex items-center gap-2 rounded-md bg-subtle px-2.5 py-1.5 text-sm text-ink">
                <span className="flex-1">{COLUMNS.find((c) => c.key === key)?.label ?? key}</span>
                <IconButton label="Move up" onClick={() => move(key, -1)} disabled={i === 0}><FontAwesomeIcon icon={faArrowUp} className="text-[11px]" /></IconButton>
                <IconButton label="Move down" onClick={() => move(key, 1)} disabled={i === chosen.length - 1}><FontAwesomeIcon icon={faArrowDown} className="text-[11px]" /></IconButton>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

function SaveViewDialog({ filter, columns, existing, onClose, onSaved }: {
  filter: PeopleFilter; columns: string[]; existing: { id: string; name: string } | null; onClose: () => void; onSaved: (id: string, name: string) => void;
}) {
  const [, save] = useMutation(SaveViewDocument);
  const [name, setName] = useState(existing?.name ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onClose={onClose} title={existing ? `Update “${existing.name}”` : "Save as a view"}
      description="Saved views are shared with everyone who can see the People list."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button busy={busy} onClick={async () => {
          setBusy(true);
          const { search: _search, ...saved } = filter;
          void _search;
          const result = await save({ input: { id: existing?.id ?? null, name, filter: saved, columns } });
          setBusy(false);
          const message = errorMessage(result.error) ?? result.data?.saveEmployeeView.errors[0]?.message;
          if (message) setError(message);
          else onSaved(result.data!.saveEmployeeView.view!.id, result.data!.saveEmployeeView.view!.name);
        }}>Save view</Button>
      </>}>
      <Field label="Name" error={error}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineers in Lagos" autoFocus /></Field>
    </Dialog>
  );
}

function ManageViewsDialog({ views, onClose, onChanged }: { views: { id: string; name: string }[]; onClose: () => void; onChanged: () => void }) {
  const [, remove] = useMutation(DeleteViewDocument);
  return (
    <Dialog open onClose={onClose} title="Manage views" description="Built-in views cannot be changed. Saved views are shared with HR and managers."
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}>
      {views.length ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {views.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-ink">{v.name}</span>
              <Button size="sm" variant="ghost" onClick={async () => { await remove({ id: v.id }); onChanged(); }}>Delete</Button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">No saved views yet. Filter the list, then choose “Save as a view” from the … menu.</p>}
    </Dialog>
  );
}

/* --------------------------------------------------------------------------- List */

export function PeopleList() {
  const { can } = useSession();
  const snapshot = useSnapshot();
  const manage = can(PERMS.employeesManage);
  const [viewKey, setViewKey] = useStored<string>("people:view", "all");
  const [filter, setFilter] = useStored<PeopleFilter>("people:filter", {});
  const [showing, setShowing] = useStored<Showing>("people:showing", "active");
  const [columns, setColumns] = useStored<string[]>("people:columns", DEFAULT_COLUMNS);
  const [panel, setPanel] = useStored<boolean>("people:panel", false);
  const [sort, setSort] = useState<{ key: string; descending: boolean }>({ key: "name", descending: false });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [dialog, setDialog] = useState<"columns" | "save" | "manage" | null>(null);
  const [{ data: options }, reloadOptions] = useQuery({ query: OptionsDocument });
  const search = useDeferredValue(filter.search ?? "");
  const variables = { filter: toEmployeeFilter({ ...filter, search }, showing), first: PAGE, after: cursors[cursors.length - 1], sort: sort.key, descending: sort.descending };
  const [{ data, error, fetching }] = useQuery({ query: ListDocument, variables });
  const list = data?.employees;
  const saved = options?.employeeViews ?? [];
  const savedView = saved.find((v) => `saved:${v.id}` === viewKey) ?? null;

  const change = (next: PeopleFilter) => { setFilter(next); setCursors([null]); };
  const chooseView = (key: string) => {
    if (key === "manage") return setDialog("manage");
    setViewKey(key);
    setCursors([null]);
    const preset = PRESET_VIEWS.find((p) => p.key === key);
    if (preset) {
      setFilter({ ...preset.filter(), search: filter.search });
      setShowing(preset.showing ?? "active");
    }
    const view = saved.find((v) => `saved:${v.id}` === key);
    if (view) {
      setFilter({ ...(view.filter as PeopleFilter), search: filter.search });
      if (view.columns.length) setColumns(view.columns);
    }
  };
  const sortBy = (key: string | undefined) => {
    if (!key) return;
    setSort((s) => ({ key, descending: s.key === key ? !s.descending : false }));
    setCursors([null]);
  };
  const exportHref = (format: "xlsx" | "csv") => {
    // The export follows the list on screen.
    const params = new URLSearchParams({ format, filter: JSON.stringify(toEmployeeFilter(filter, showing)) });
    return `/api/employees/export/?${params}`;
  };
  const shownColumns = columns.map((k) => COLUMNS.find((c) => c.key === k)).filter(Boolean) as typeof COLUMNS;
  const active = filterCount(filter);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setPanel(!panel)} aria-pressed={panel} aria-label="Filters" title="Filters"
            className={cx("relative grid h-11 w-11 place-items-center rounded-full border bg-surface text-ink hover:bg-subtle",
              panel || active ? "border-brand-ink ring-2 ring-brand/20" : "border-line-strong")}>
            <FontAwesomeIcon icon={faSliders} />
            {active > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">{active}</span>}
          </button>
          <Select aria-label="View" value={viewKey} onChange={(e) => chooseView(e.target.value)} className="h-11 w-56 rounded-full">
            {PRESET_VIEWS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            {saved.length > 0 && <optgroup label="Saved views">{saved.map((v) => <option key={v.id} value={`saved:${v.id}`}>{v.name}</option>)}</optgroup>}
            {manage && <option value="manage">Manage views…</option>}
          </Select>
          <span className="flex items-center gap-2 text-sm text-muted"><FontAwesomeIcon icon={faUsers} />{list?.totalCount ?? "…"}</span>
          <div className="w-64"><SearchInput placeholder="Search name, number or email" aria-label="Search people" value={filter.search ?? ""}
            onChange={(e) => change({ ...filter, search: e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Showing</span>
          <Select aria-label="Showing" value={showing} onChange={(e) => { setShowing(e.target.value as Showing); setCursors([null]); }} className="h-11 w-32 rounded-full">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </Select>
          <Menu width="w-64" trigger={(open, toggle) => (
            <button type="button" onClick={toggle} aria-expanded={open} aria-label="More actions"
              className={cx("grid h-11 w-11 place-items-center rounded-full border bg-surface text-ink hover:bg-subtle", open ? "border-brand-ink" : "border-line-strong")}>
              <FontAwesomeIcon icon={faEllipsis} />
            </button>
          )}>
            {(close) => (
              <>
                {manage && <MenuItem icon={faBolt} href="/employees/power-edit">Power edit employees</MenuItem>}
                <MenuItem icon={faTableColumns} onClick={() => { close(); setDialog("columns"); }}>Customize view</MenuItem>
                {manage && <MenuItem icon={faFloppyDisk} onClick={() => { close(); setDialog("save"); }}>{savedView ? `Update “${savedView.name}”` : "Save as a view"}</MenuItem>}
                <div className="my-1.5 border-t border-line" />
                <MenuItem icon={faFileArrowDown} href={exportHref("xlsx")} download>Export to Excel</MenuItem>
                <MenuItem icon={faFileArrowDown} href={exportHref("csv")} download>Export to CSV</MenuItem>
                {manage && (
                  <>
                    <div className="my-1.5 border-t border-line" />
                    <MenuItem icon={faFileImport} href="/employees/import">Import employees</MenuItem>
                    <MenuItem icon={faListCheck} href="/settings/fields">Custom fields</MenuItem>
                  </>
                )}
              </>
            )}
          </Menu>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {panel && options && (
          <FilterPanel filter={filter} onChange={change} total={list?.totalCount} onClose={() => setPanel(false)}
            options={{ departments: options.departments, locations: options.locations, legalEntities: options.legalEntities, jobTitles: options.jobTitles, grades: options.grades, teams: options.teams }} />
        )}
        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          {error ? <div className="p-5"><ErrorNote error={errorMessage(error)} /></div> : !list ? (
            <div className="p-4"><Loading shape="inline" rows={3} label="Loading people" /></div>
          ) : !list.nodes.length ? (
            <div className="px-6 py-14 text-center">
              <p className="font-display text-xl text-ink">No one matches</p>
              <p className="mt-1 text-sm text-muted">Try another view, clear some filters or change Showing.</p>
            </div>
          ) : (
            <div className={cx("overflow-x-auto transition-opacity", fetching && "opacity-60")}>
              <table className="w-full text-left text-sm">
                <thead className="bg-subtle/70">
                  <tr>
                    {shownColumns.map((c) => (
                      <th key={c.key} scope="col" aria-sort={sort.key === c.sort ? (sort.descending ? "descending" : "ascending") : undefined}
                        className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-ink first:pl-5">
                        {c.sort ? (
                          <button type="button" onClick={() => sortBy(c.sort)} className="flex items-center gap-1.5 hover:text-brand-ink">
                            {c.label}
                            <FontAwesomeIcon icon={sort.key === c.sort && sort.descending ? faArrowDown : faArrowUp}
                              className={cx("text-[10px]", sort.key === c.sort ? "text-brand-ink" : "text-transparent")} />
                          </button>
                        ) : c.label === "Photo" ? <span className="sr-only">Photo</span> : c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.nodes.map((e) => (
                    <tr key={e.id} className="transition hover:bg-subtle/50">
                      {shownColumns.map((c) => (
                        <td key={c.key} className="px-4 py-3 align-middle first:pl-5">{cell(c.key, e, () => snapshot.open(e.id))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {list && list.totalCount > PAGE && (
            <CursorPager page={cursors.length} pageSize={PAGE} total={list.totalCount} hasNext={list.pageInfo.hasNextPage} busy={fetching}
              onPrevious={() => setCursors((c) => c.slice(0, -1))} onNext={() => setCursors((c) => [...c, list.pageInfo.endCursor ?? null])} />
          )}
        </section>
      </div>

      {dialog === "columns" && <ColumnsDialog columns={columns} onClose={() => setDialog(null)} onSave={(c) => { setColumns(c); setDialog(null); }} />}
      {dialog === "save" && (
        <SaveViewDialog filter={filter} columns={columns} existing={savedView} onClose={() => setDialog(null)}
          onSaved={(id) => { setDialog(null); setViewKey(`saved:${id}`); reloadOptions({ requestPolicy: "network-only" }); }} />
      )}
      {dialog === "manage" && <ManageViewsDialog views={saved} onClose={() => setDialog(null)} onChanged={() => { reloadOptions({ requestPolicy: "network-only" }); setViewKey("all"); }} />}
    </>
  );
}

type Person = {
  id: string; employeeNumber: string; firstName: string; lastName: string; preferredName: string; fullName: string; photoUrl?: string | null;
  status: string; employmentType: string; hireDate: string; foundingMember?: boolean; workEmail: string; workPhone: string; workPhoneExt: string; phone: string;
  gender?: string | null; dateOfBirth?: string | null; jobTitle?: { name: string } | null; department?: { name: string } | null;
  location?: { name: string } | null; legalEntity: { name: string }; grade?: { name: string } | null; manager?: { fullName: string } | null;
};

function cell(key: string, e: Person, openSnapshot: () => void): ReactNode {
  const dash = <span className="text-muted">—</span>;
  switch (key) {
    case "photo": return <button type="button" onClick={openSnapshot} aria-label={`Snapshot of ${e.fullName}`}>
      <TenureFrame hireDate={e.hireDate} founding={e.foundingMember} radius="rounded-xl" markSize={18}><Photo name={e.fullName} src={e.photoUrl} size={52} /></TenureFrame></button>;
    case "number": return <span className="tabular-nums text-ink">{e.employeeNumber}</span>;
    case "name": return (
      <Link href={`/employees/${e.id}`} className="font-medium text-brand-ink hover:underline">
        {e.lastName}, {e.preferredName || e.firstName}
      </Link>
    );
    case "jobTitle": return e.jobTitle?.name ?? dash;
    case "location": return e.location?.name ?? dash;
    case "employmentType": return humanize(e.employmentType).replace("Full time", "Full-time").replace("Part time", "Part-time");
    case "department": return e.department?.name ?? dash;
    case "status": return <StatusBadge status={e.status} />;
    case "hireDate": return <span className="whitespace-nowrap tabular-nums">{formatDate(e.hireDate)}</span>;
    case "tenure": return <span className="whitespace-nowrap">{tenure(e.hireDate)}</span>;
    case "manager": return e.manager?.fullName ?? dash;
    case "legalEntity": return e.legalEntity.name;
    case "grade": return e.grade?.name ?? dash;
    case "workEmail": return e.workEmail ? <a href={`mailto:${e.workEmail}`} className="hover:underline">{e.workEmail}</a> : dash;
    case "workPhone": return e.workPhone ? `${e.workPhone}${e.workPhoneExt ? ` ext. ${e.workPhoneExt}` : ""}` : dash;
    case "mobile": return e.phone || dash;
    case "gender": return e.gender ? humanize(e.gender) : dash;
    case "dateOfBirth": return e.dateOfBirth ? formatDate(e.dateOfBirth) : dash;
    default: return dash;
  }
}
