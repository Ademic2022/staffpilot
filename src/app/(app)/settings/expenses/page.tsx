"use client";

import { faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { useSettingsTab } from "@/components/settings/areas";
import { SettingsIntro } from "@/components/settings/Intro";
import { Badge, Button, Card, Checkbox, Dialog, ErrorNote, Field, IconButton, Input, Loading, Notice, Select, Table, TD, TH } from "@/components/ui";
import { graphql } from "@/gql";
import type { ExpenseSetupQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useSession } from "@/lib/session";

const SetupDocument = graphql(`
  query ExpenseSetup {
    expenseSettings { enabled managerApproval financeApproval receiptOver maxAgeDays payVia }
    expenseCategories(includeInactive: true) { id name description accountCode limitPerItem limitPerMonth receiptRequired mileageRate isActive used }
  }
`);
const SaveSettingsDocument = graphql(`
  mutation SaveExpenseSettings($input: ExpenseSettingsInput!) { saveExpenseSettings(input: $input) { enabled } }
`);
const SaveCategoryDocument = graphql(`
  mutation SaveExpenseCategory($input: ExpenseCategoryInput!) { saveExpenseCategory(input: $input) { category { id } errors { field message } } }
`);

type Category = ExpenseSetupQuery["expenseCategories"][number];
const num = (v: string) => (v.trim() ? v.replace(/,/g, "").trim() : null);

function Rules({ data, onSaved }: { data: ExpenseSetupQuery; onSaved: (m: string) => void }) {
  const s = data.expenseSettings;
  const { tenant } = useSession();
  const payroll = Boolean(tenant?.payrollEnabled);
  const [v, setV] = useState({ enabled: s.enabled, managerApproval: s.managerApproval, financeApproval: s.financeApproval,
    receiptOver: s.receiptOver && Number(s.receiptOver) > 0 ? String(s.receiptOver) : "", maxAgeDays: String(s.maxAgeDays), payVia: s.payVia });
  const [{ fetching, error }, save] = useMutation(SaveSettingsDocument);
  const submit = async () => {
    const res = await save({ input: { ...v, receiptOver: num(v.receiptOver) ?? "0", maxAgeDays: Number(v.maxAgeDays) || 0 } });
    if (!res.error) onSaved("Expense rules saved.");
  };
  return (
    <Card>
      <div className="grid gap-5">
        {error && <ErrorNote error={errorMessage(error)} />}
        <Checkbox checked={v.enabled} onChange={(enabled) => setV({ ...v, enabled })} label="Switch on expense claims" description="Adds Expenses to everyone's menu." />
        <div className="grid gap-2">
          <p className="text-sm font-medium text-ink">Who approves</p>
          <Checkbox checked={v.managerApproval} onChange={(managerApproval) => setV({ ...v, managerApproval })} label="Their manager"
            description="First, the person's manager. Skipped for people without one." />
          <Checkbox checked={v.financeApproval} onChange={(financeApproval) => setV({ ...v, financeApproval })} label="Finance"
            description="Then someone with the expenses permission (payroll officers, HR admins)." />
          {!v.managerApproval && !v.financeApproval && <Notice tone="warning">Claims will be approved as soon as they are submitted.</Notice>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Receipts needed above" optional hint="Leave empty to need one for every item in categories that ask for receipts.">
            <Input inputMode="decimal" value={v.receiptOver} onChange={(e) => setV({ ...v, receiptOver: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Oldest expense (days)" hint="Older expenses cannot be claimed. 0 for no limit.">
            <Input type="number" min={0} max={730} value={v.maxAgeDays} onChange={(e) => setV({ ...v, maxAgeDays: e.target.value })} />
          </Field>
          <Field label="Paid back" hint={payroll ? undefined : "Payroll is not run in HRMS (Settings → Company), so claims are paid back by transfer."}>
            <Select value={v.payVia} disabled={!payroll} onChange={(e) => setV({ ...v, payVia: e.target.value })}>
              {payroll && <option value="payroll">With the next payroll (not taxed)</option>}
              <option value="separately">Separately, by bank transfer</option>
            </Select>
          </Field>
        </div>
        <div><Button busy={fetching} onClick={submit}>Save</Button></div>
      </div>
    </Card>
  );
}

function CategoryEditor({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [v, setV] = useState({
    name: category?.name ?? "", description: category?.description ?? "", accountCode: category?.accountCode ?? "",
    limitPerItem: category?.limitPerItem ? String(category.limitPerItem) : "", limitPerMonth: category?.limitPerMonth ? String(category.limitPerMonth) : "",
    mileageRate: category?.mileageRate ? String(category.mileageRate) : "", receiptRequired: category?.receiptRequired ?? true, isActive: category?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [{ fetching }, save] = useMutation(SaveCategoryDocument);
  const submit = async () => {
    const res = await save({ input: { id: category?.id, name: v.name, description: v.description, accountCode: v.accountCode,
      limitPerItem: num(v.limitPerItem), limitPerMonth: num(v.limitPerMonth), mileageRate: num(v.mileageRate),
      receiptRequired: v.receiptRequired, isActive: v.isActive } });
    if (res.error) return setErrors({ "": errorMessage(res.error) ?? "Could not save." });
    const errs = res.data?.saveExpenseCategory.errors ?? [];
    if (errs.length) return setErrors(Object.fromEntries(errs.map((e) => [e.field ?? "", e.message])));
    onSaved(`Saved ${v.name}.`);
  };
  return (
    <Dialog open wide onClose={onClose} title={category ? `Edit ${category.name}` : "New category"}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button busy={fetching} onClick={submit}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {errors[""] && <div className="sm:col-span-2"><ErrorNote error={errors[""]} /></div>}
        <Field label="Name" error={errors.name}><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Ledger account" optional hint="For the accounting export."><Input value={v.accountCode} onChange={(e) => setV({ ...v, accountCode: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Description" optional><Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field></div>
        <Field label="Limit per item" optional error={errors.limitPerItem} hint="Items above it are flagged for approvers.">
          <Input inputMode="decimal" value={v.limitPerItem} onChange={(e) => setV({ ...v, limitPerItem: e.target.value })} />
        </Field>
        <Field label="Limit per person a month" optional error={errors.limitPerMonth}>
          <Input inputMode="decimal" value={v.limitPerMonth} onChange={(e) => setV({ ...v, limitPerMonth: e.target.value })} />
        </Field>
        <Field label="Mileage rate per km" optional error={errors.mileageRate} hint="Set it to claim by distance instead of amount.">
          <Input inputMode="decimal" value={v.mileageRate} onChange={(e) => setV({ ...v, mileageRate: e.target.value })} />
        </Field>
        <div className="grid content-end gap-2">
          <Checkbox checked={v.receiptRequired} onChange={(receiptRequired) => setV({ ...v, receiptRequired })} label="Needs a receipt" />
          <Checkbox checked={v.isActive} onChange={(isActive) => setV({ ...v, isActive })} label="In use" />
        </div>
      </div>
    </Dialog>
  );
}

export default function ExpenseSettingsPage() {
  const [tab] = useSettingsTab(["rules", "categories"] as const, "rules");
  const { tenant } = useSession();
  const [{ data, error }, reload] = useQuery({ query: SetupDocument });
  const [saved, setSaved] = useState<string>();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading />;
  const refresh = (m: string) => { setEditing(undefined); setSaved(m); reload({ requestPolicy: "network-only" }); };
  const money = (v: unknown) => (v ? formatMoney(String(v), tenant?.currency ?? "NGN") : "—");
  return (
    <>
      {saved && <Notice tone="success">{saved}</Notice>}
      {tab === "rules" ? (
        <><SettingsIntro>Who approves claims, when receipts are needed, and how approved claims are paid back.</SettingsIntro><Rules data={data} onSaved={refresh} /></>
      ) : (
        <>
          <SettingsIntro actions={<Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditing(null)}>New category</Button>}>
            What people can claim for, with limits. Items over a limit can still be claimed; approvers see them flagged.
          </SettingsIntro>
          <Card flush>
            <Table>
              <thead><tr><TH>Category</TH><TH>Per item</TH><TH>Per month</TH><TH>Receipt</TH><TH>Ledger</TH><TH align="right"><span className="sr-only">Actions</span></TH></tr></thead>
              <tbody>
                {data.expenseCategories.map((c) => (
                  <tr key={c.id} className={c.isActive ? undefined : "text-muted"}>
                    <TD className="font-medium">{c.name} {!c.isActive && <Badge>Off</Badge>}
                      <span className="block text-xs font-normal text-muted">{c.mileageRate ? `${money(c.mileageRate)} a km` : c.description}</span></TD>
                    <TD className="tabular-nums">{money(c.limitPerItem)}</TD>
                    <TD className="tabular-nums">{money(c.limitPerMonth)}</TD>
                    <TD>{c.mileageRate ? "—" : c.receiptRequired ? "Needed" : "Optional"}</TD>
                    <TD>{c.accountCode || "—"}</TD>
                    <TD align="right"><IconButton label={`Edit ${c.name}`} onClick={() => setEditing(c)}><FontAwesomeIcon icon={faPen} className="text-xs" /></IconButton></TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
      {editing !== undefined && <CategoryEditor category={editing} onClose={() => setEditing(undefined)} onSaved={refresh} />}
    </>
  );
}
