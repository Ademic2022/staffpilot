import type { Article } from "../index";

const PAY: Article["audience"] = ["payroll", "hr"];

export const PAYROLL: Article[] = [
  {
    slug: "payroll-setup",
    title: "Setting up payroll",
    summary: "Pay groups, pay components and the salary split, statutory rules, and putting people in payroll.",
    audience: PAY,
    paths: ["/settings/payroll", "/payroll?tab=people"],
    body: `
Payroll works for companies in **Nigeria** and **Ghana**, paying monthly or every two weeks.

## Switch it on

Payroll is off until an owner switches on **Run payroll in HRMS** in **Settings** → **Company** → **General settings**. Until then, Payroll and My payslips are hidden and no payroll can be started. Switching it off later hides them again; payslips already published stay readable by their owners.

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
