import type { Article } from "../index";

const PAY: Article["audience"] = ["payroll", "hr"];

export const PAYROLL: Article[] = [
  {
    slug: "how-payroll-works",
    title: "How payroll works",
    summary: "The whole picture: what payroll uses, how a payroll moves from draft to paid, and how each payslip is worked out, with a full example.",
    audience: PAY,
    paths: [],
    body: `
Payroll turns each person's salary, time off, overtime, expenses and loans into a payslip, using the tax rules of your country. It works out the figures and gives you a bank file; **you send the money** from your bank.

## What payroll uses

| What | Where it is set | What it does |
| --- | --- | --- |
| The payroll switch | Settings → Company → General settings | Payroll is off until an owner switches it on |
| Pay groups | Settings → Payroll | Who is paid together, how often (monthly or every two weeks) and on what day |
| Salary split | Settings → Payroll → Pay components | Divides gross pay into basic, housing, transport and other allowances. Starts at 50%, 25%, 10% and the rest |
| Statutory rules | Settings → Payroll → Statutory rules | Tax bands and contribution rates for Nigeria and Ghana, by date |
| Salary | Each profile → Job → Compensation | Monthly or yearly pay. Hourly pay is not supported yet |
| Payroll details | Payroll → People | Pay group, tax state, pension and NHF choices, rent and life insurance for tax relief, extra allowances and deductions |
| Bank and ID details | Each profile → Personal | Bank account, tax ID and pension PIN. Stored encrypted |
| Loans and advances | Payroll → Loans | Paid back from pay in instalments |

See [Setting up payroll](/help/payroll-setup) for each of these step by step.

## From draft to paid

Every payroll moves through the same steps, and **two different people** must take part: the person who prepares a payroll can never approve it.

| Step | Who | What happens |
| --- | --- | --- |
| 1. Draft | Payroll officer | Choose the pay group and period. Every payslip is worked out at once. Fix records and **Recalculate** as often as you need |
| 2. In review | Payroll officer | **Send for approval**. Approvers are told |
| 3. Approved | A different approver | Checks the figures and approves. Payslips are now frozen. Loans that reach zero are closed and expense claims are marked paid. Or **Send back** to draft with a note |
| 4. Payslips published | Approver | Everyone in the payroll is told their payslip is ready, under **My payslips** |
| 5. Paid | Payroll officer | Pay everyone from the **bank file**, then **Mark paid** |

A draft or in-review payroll can be **cancelled**; an approved one cannot. For back pay or a bonus, start an **off-cycle** payroll in the same period. More in [Running payroll](/help/running-payroll).

## How a payslip is worked out

For each person, in this order:

1. **This period's pay.** Monthly salary for a monthly group; monthly salary × 12 ÷ 26 for a two-weekly group.
2. **The share they are paid for**, counted in working days. Days before they joined or after they left, **unpaid leave**, and **absences without leave** (only if your company treats those as unpaid) are taken off. Each case shows as a note on the payslip.
3. **Earnings.** The salary split (basic, housing, transport, other), then **approved overtime** at their hourly rate times your overtime rate, their **extra allowances**, and, when someone leaves, **unused leave paid out**.
4. **Pension and contributions.** In Nigeria, pension of 8% from the employee and 10% from the employer, on basic, housing and transport, and NHF of 2.5% of basic. In Ghana, SSNIT of 5.5% and 13% on basic. Anyone marked as not in the pension scheme or not paying NHF is skipped.
5. **Tax (PAYE).** Taxable pay, less pension, NHF and reliefs (rent relief and life insurance in Nigeria), is run through the tax bands. Nigeria's bands are yearly, so the month is scaled to a year, taxed, and divided back to a month. In Nigeria, anyone earning the national minimum wage or less pays no tax.
6. **Other deductions.** Loan and advance instalments (someone leaving repays the whole balance) and their extra deductions.
7. **Paid back on top.** Approved expense claims. They are not pay, so they are not taxed.

**Net pay** is gross pay less everything the employee pays. **Employer cost** is gross pay plus the employer's pension, levies such as NSITF, and expenses paid back.

Every payslip keeps its **workings** (each base, relief and tax band used) and the version of the rules it used, so any figure can be checked later.

## A full example (Nigeria)

Someone on **₦500,000 a month**, with the standard salary split, in pension and NHF, with no rent relief:

| Line | Amount |
| --- | --- |
| Basic salary (50%) | 250,000 |
| Housing allowance (25%) | 125,000 |
| Transport allowance (10%) | 50,000 |
| Other allowances (the rest) | 75,000 |
| **Gross pay** | **500,000** |
| Pension: 8% of 425,000 (basic, housing and transport) | −34,000 |
| NHF: 2.5% of 250,000 (basic) | −6,250 |
| PAYE income tax | −65,255 |
| **Net pay** | **394,495** |
| Employer's pension: 10% of 425,000 | 42,500 |
| NSITF: 1% of 500,000 | 5,000 |
| **Cost to the company** | **547,500** |

How the PAYE is worked out:

1. Chargeable pay is 500,000 − 34,000 − 6,250 = **459,750** a month, which is **5,517,000** over a year.
2. The first 800,000 is taxed at 0%: **0**.
3. The next 2,200,000 at 15%: **330,000**.
4. The remaining 2,517,000 at 18%: **453,060**.
5. That is **783,060** a year, or **65,255** a month.

> If this person paid ₦1,200,000 a year in rent, 20% of it (₦240,000) would come off their chargeable income, and their tax would fall by ₦3,600 a month.

## Checks before you approve

- **Warnings** on payslips: no salary record, joined or left mid-period, unpaid leave or absences taken off, deductions more than pay, final settlements.
- **Changes since last payroll**: each person's net pay against the previous payroll. Moves of 10% or more, new people and people missing since last time are flagged.
- **Records to complete** on Home lists anyone without bank details, a tax ID or a pension PIN. Fix those before approving.

## What payroll gives you

- **Payslips** (one A4 page each), published to each person.
- **Payroll register**: every line for every person, for checking and your records.
- **Bank file**: name, bank, account number and amount for each person, ready for your bank's bulk transfer. Opening it is recorded in the audit log.
- **Remittance schedules**: PAYE (with tax IDs and states), pension (with PINs), NHF and, in Ghana, SSNIT.

See [Payroll files and payments](/help/payroll-files).

## Good to know

- Only **Nigeria** and **Ghana** are supported. A payroll for an entity in another country cannot be started.
- **Hourly pay** is not worked out yet: enter it as an allowance.
- Tax is worked out on **each period's pay as if it continued all year**. If someone's pay changes during the year, earlier months are not adjusted.
- The tax rules follow the published law (Nigeria Tax Act 2025; Ghana's Act 1178). Have your accountant check your first payroll before you pay from it.
`,
  },
  {
    slug: "payroll-setup",
    title: "Setting up payroll",
    summary: "Pay groups, pay components and the salary split, statutory rules, and putting people in payroll.",
    audience: PAY,
    paths: ["/settings/payroll", "/payroll?tab=people"],
    body: `
Payroll works for companies in **Nigeria** and **Ghana**, paying monthly or every two weeks.

## Switch it on

Payroll is off until an owner switches on **Run payroll in StaffPilot** in **Settings** → **Company** → **General settings**. Until then, Payroll and My payslips are hidden and no payroll can be started. Switching it off later hides them again; payslips already published stay readable by their owners.

## Pay groups

**Settings** → **Payroll** → **Pay groups**. A pay group is people paid together, on one schedule, from one legal entity. Make one for each legal entity and pay frequency, for example "Lagos monthly". Set:

- The **legal entity**. Its country decides the tax rules.
- **How often**: monthly or every two weeks.
- For monthly: the **first day of a period** and the **pay day** (the last day when a month is shorter). For every two weeks: the first period's start; later periods follow every 14 days, paid on the last day.

## Pay components and the salary split

**Pay components** are the lines on a payslip.

- The **salary split** divides gross pay into **basic**, **housing**, **transport** and **other** by share of gross. In Nigeria, pension is worked out on basic, housing and transport, so set at least those three.
- Add your own **earnings** (adds to pay, such as a meal allowance) and **deductions** (taken from net pay, such as a union due). Mark each as **taxable** and whether it **counts towards pension**.

## Statutory rules

**Statutory rules** shows the tax bands and contribution rates payroll uses, by country: PAYE, pension, NHF and NSITF in Nigeria; PAYE and SSNIT in Ghana. New versions are added when the law changes; past payslips keep the rules they used.

## Putting people in payroll

**Payroll** → **People** lists everyone and their pay group. Select people and **Put in group**. For each person you can also set:

- **Pays NHF**, **Not in the pension scheme**, the **pension provider** and **NHF number**.
- **Annual rent**: in Nigeria, 20% of it (up to ₦500,000) reduces tax.
- **Annual life insurance** premiums, which also reduce tax.
- **Extra allowances and deductions** that repeat each period, from your pay components, with start and end dates.

Their salary comes from their **Compensation** record on their profile. Their tax ID, pension PIN and bank account are in their **Bank and ID details**.
`,
  },
  {
    slug: "running-payroll",
    title: "Running payroll",
    summary: "Starting a payroll, checking it, approval by a second person, payslips and payment.",
    audience: PAY,
    paths: ["/payroll", "/payroll/runs"],
    body: `
## 1. Start the payroll

On **Payroll**, choose **New payroll**. Pick the **pay group** and **a day in the period** (the pay period that contains it is used). Tick **Off-cycle payroll** for an extra run in the same period, for back pay or corrections.

Payroll works out everyone's pay from their pay records, leave, attendance, expense claims, loans and payroll details. See [What goes into someone's pay](/help/what-goes-into-pay).

## 2. Check it

The payroll page shows totals (people, gross pay, deductions, net pay, cost to employer) and each person's payslip. Open a person and **Show lines** for the detail.

- **Check before approving**: payslips with notes, such as joiners, leavers, unpaid leave or someone with no pay record.
- **Net pay against the last payroll** flags people **new this period**, people **paid last time, not now**, and pay that **changed by 10% or more**.

Fix anything at its source (their profile, payroll details or leave), then **Work out again**.

## 3. Send for approval

Choose **Send for approval**. Someone with payroll approval, **other than whoever prepared it**, must approve it. They can **Approve**, or **Send back** with a note for you to change it.

## 4. After approval

- Download the **bank payment file** and statutory schedules. See [Payroll files](/help/payroll-files).
- **Publish payslips**: everyone in the payroll can see their payslip under My payslips and is notified.
- **Mark as paid** once the bank has paid everyone.

Approving also settles loans that are fully repaid and marks expense claims in the payroll as paid.

## Cancelling

A payroll that is not yet approved can be **cancelled**. Approved payrolls cannot; use an off-cycle payroll to correct one.
`,
  },
  {
    slug: "payroll-files",
    title: "Payroll files and statutory schedules",
    summary: "The payroll register, bank payment file, and PAYE, pension, NHF and SSNIT schedules.",
    audience: PAY,
    paths: [],
    body: `
On the payroll page, each file downloads as **Excel** or **CSV**.

- **Payroll register**: every person with every line, for checking and filing. Available at any time.
- **Bank payment file**: who to pay, their bank, account number and net pay, with a narration. Available once the payroll is approved. Showing account numbers is recorded in the audit log. Check that everyone has an account number on their Bank and ID details first.
- **Statutory schedules**: what to remit, and for whom, with each person's ID numbers.
  - **PAYE**: tax by person, for the state or revenue authority.
  - **Pension**: employee and employer contributions, with pension PINs and providers.
  - **NHF**: National Housing Fund contributions (Nigeria).
  - **SSNIT**: social security contributions (Ghana).

> The bank file is a general layout. Check it against your bank's upload format before sending.
`,
  },
  {
    slug: "loans-and-advances",
    title: "Loans and salary advances",
    summary: "Recording a loan or advance and how it is repaid through payroll.",
    audience: PAY,
    paths: ["/payroll?tab=loans"],
    body: `
**Payroll** → **Loans and advances** lists every loan and salary advance, what is **still owed** and what is **taken each period**.

## Record one

Choose **New loan or advance** and enter:

- The **employee** and the **type**: a loan or a **salary advance**.
- The **amount** and the **reason**.
- The amount **taken each period**.
- **First repayment in the period containing** a date.

The money itself is paid out outside payroll. Each payroll from then on takes the repayment from net pay until it is repaid. The person sees the balance on **My payslips**.

## Leaving and early repayment

Anyone leaving repays the rest from their last pay. If someone repays outside payroll, record it so the balance is right, or close the loan.
`,
  },
  {
    slug: "what-goes-into-pay",
    title: "What goes into someone's pay",
    summary: "Proration, unpaid leave, overtime, absences, expenses, loans and final settlements.",
    audience: PAY,
    paths: [],
    body: `
For each person in the pay group, a payroll works out:

## Earnings

- **Salary** from their compensation record, split into basic, housing, transport and other by your salary split.
- **Joining or leaving** in the period: they are paid for the working days they were employed.
- **Unpaid leave** is taken off, by working day.
- **Overtime**: approved overtime in the period, at their hourly rate (from their shift's hours) times your overtime pay rate.
- **Absences**: if your company treats unexplained absences as unpaid, those days are taken off.
- **Extra allowances** set on their payroll details.
- **Unused leave paid out on leaving**, for leave types set to pay out.

## Deductions

- **PAYE** income tax, after reliefs (pension, NHF, rent relief and life insurance in Nigeria). In Nigeria, people earning the national minimum wage or less pay no tax.
- **Pension** (Nigeria: 8% employee and 10% employer, on basic, housing and transport), **NHF** (2.5% of basic), and **SSNIT** in Ghana (5.5% employee, 13% employer, on basic).
- **Loan and advance repayments**, and other deductions on their payroll details.

## Paid back on top

- **Expense claims** approved and set to be paid through payroll. They are not pay, so they are not taxed or pensioned; they are added to net pay.

> Hourly pay is not supported yet: people paid by the hour need their pay entered as an allowance.
`,
  },
];
