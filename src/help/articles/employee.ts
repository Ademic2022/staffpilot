import type { Article } from "../index";

const EVERYONE: Article["audience"] = ["employee", "manager", "hr", "payroll"];

export const EMPLOYEE: Article[] = [
  {
    slug: "my-profile",
    title: "Your profile and details",
    summary: "What is on your record, what you can change yourself and what HR checks first.",
    audience: EVERYONE,
    paths: ["/employees/"],
    body: `
Open **My profile** in the menu. Your record is split into tabs: **Personal**, **Job**, **Time off**, **Documents**, **Emergency**, **Training**, **Benefits**, **Assets** and more. Your company may rename, reorder or add tabs, and hides the ones you are not allowed to see.

## Update your details

Choose **Update my details** on your profile.

- **Contact details**, such as your phone number, personal email and address, are saved straight away.
- Your **legal name, bank details and ID numbers** feed payroll and tax filings, so HR approves changes before they apply. Until then the change shows as **Waiting for HR**, and you can **Withdraw it**. If HR does not approve it, you see why on your profile.

## Emergency contacts

Keep at least one emergency contact on the **Emergency** tab, so HR knows who to call.

## Your photo

If your company allows it (HR switches on **Let employees change their own photo** in **Settings** → **Company** → **General settings**), click your photo on your profile and choose **Change photo**. Pick a JPG, PNG or WebP picture, drag it and zoom until your face fills most of the square, then **Save photo**; a bar shows the upload's progress. Otherwise ask HR.

## Documents

The **Documents** tab shows documents HR has shared with you, such as your contract. If your company allows it (**Let employees upload files to their own record**, in the same General settings), you can also upload files to your own record; they go into an **Employee uploads** category that only you and HR can see.

## Job and pay

The **Job** tab shows your job title, department, manager, employment history and, if you are allowed to see it, your pay. Changes to job and pay are made by HR, or by your manager through an approval.

> Something wrong that you cannot change? Ask HR, or use **Update my details** and say what needs fixing.
`,
  },
  {
    slug: "requesting-time-off",
    title: "Requesting time off",
    summary: "Making a request, half days, approvals, cancelling, and how balances work.",
    audience: EVERYONE,
    paths: ["/leave"],
    body: `
Open **My time off** in the menu. You see your balances for each type of leave, your requests and the public holidays ahead.

## Make a request

1. Choose **Request time off** (on My time off or the Time off widget on Home).
2. Pick the **type of leave**, the **first** and **last day**, and tick **Half day** if you need one.
3. Check the number of days. Weekends and public holidays are not counted.
4. Add a **note for your manager** if it helps, then **Send request**.

Your request goes to your manager. Some leave types need more than one approval (for example your manager, then theirs); you can follow each step on the request. Some types need no approval and are booked straight away. You get a notification when it is decided.

![The request form. The days are counted for you.](shot:leave-request)

## Cancel a request

Open the request and choose **Cancel**. A request that is still waiting, or approved leave that has not started, can be cancelled and the days go back to your balance. Once leave has started, only HR can cancel it.

## Balances

- Days are **earned** under your company's leave policy: all at the start of the year, or a share each month.
- Someone who joins during the year gets the share of the year that is left.
- Unused days may **carry over** to next year, up to a limit, and may expire after some months.
- Some leave, such as sick or compassionate leave, may be **granted case by case**, with no balance.
- The **ledger** shows every change to a balance: days earned, taken, carried over and adjusted by HR.

## The leave calendar

**Leave calendar** shows who is away each month, by department, with weekends and public holidays shaded. Use it before you book to see who else is out.

> Your days are counted on the working days of your location. If a count looks wrong, ask HR.
`,
  },
  {
    slug: "payslips",
    title: "Your payslips",
    summary: "Seeing and downloading payslips, what each line means, and loans or advances.",
    audience: EVERYONE,
    paths: ["/payslips"],
    body: `
If your company runs payroll in StaffPilot, open **My payslips** in the menu. Each payslip appears once payroll has approved and published that month's payroll; you get a notification when it does.

> No **My payslips** in the menu? Payroll is off until an owner switches on **Run payroll in StaffPilot** in **Settings** → **Company** → **General settings**. See [Setting up payroll](/help/payroll-setup). If your company pays you outside StaffPilot, your payslips come from there.

## Reading a payslip

Choose a payslip to see its lines, or download the **PDF**.

- **Earnings**: your basic pay and allowances (such as housing and transport), overtime and any one-off payments. Together they make **gross pay**.
- **Deductions**: income tax (PAYE), pension, the National Housing Fund in Nigeria or SSNIT in Ghana, loan repayments and other deductions.
- **Expenses paid back**: approved expense claims. These are not pay, so they are not taxed; they are added to your net pay.
- **Net pay**: what is paid into your bank account.

The PDF also says what your employer pays on top, such as the employer's pension contribution.

## Joining, leaving and unpaid leave

In a month you join or leave, you are paid for the working days you were employed. Unpaid leave, and unexplained absences if your company uses attendance that way, are taken off. Your payslip says so.

## Loans and advances

If you have a salary advance or a staff loan, **My payslips** shows what is left to repay. Repayments are taken from each payslip until it is settled. Anyone leaving repays the rest from their last pay.

> Questions about a payslip? Contact your payroll team. Your bank details are on your profile under **Bank and ID details**.
`,
  },
  {
    slug: "clocking-in",
    title: "Clocking in and out",
    summary: "Using My time, location checks, lateness and fixing mistakes.",
    audience: EVERYONE,
    paths: ["/attendance", "/attendance?tab=mine"],
    body: `
If your company uses attendance, open **Attendance** in the menu. **My time** shows your shift for today, a clock button and your last two weeks. Once attendance is on, a clock button also sits at the top of Home.

> No **Attendance** in the menu? It is off until HR or an admin switches it on: **Settings** → **Attendance** → **Rules** → **Switch on clocking in and out**. See [Setting up attendance](/help/attendance-setup).

## Clock in and out

1. Choose **Clock in** when you start. Your browser may ask to share your location; allow it if your workplace checks that you are on site.
2. The page shows how long you have been working.
3. Choose **Clock out** when you finish. You can clock in and out more than once a day, for example around a long break.

This works on a phone too: open the same web address in your phone's browser.

![On Home, the button at the top shows whether you are clocked in. Click it to clock in or out.](shot:clock-in)

## Location

Some offices have a clock-in area. If you are outside it, your clock-in is either marked **Away from site** or refused, depending on your company's rules. If your phone cannot get a location, allow location access for this site in your browser settings.

## Lateness and overtime

- Clocking in after your shift starts (plus a few minutes' grace) marks the day **Late**.
- If you work longer than your shift by more than your company's threshold, the extra time is recorded as **overtime** when you clock out. It goes to your manager to approve and, once approved, is paid in the next payroll.

## Forgot to clock in or out?

Ask your manager or HR. They can add or correct your time, and the day is marked **Edited**.
`,
  },
  {
    slug: "timesheets",
    title: "Filling in your timesheet",
    summary: "Logging hours against projects each week and submitting them.",
    audience: EVERYONE,
    paths: ["/attendance?tab=timesheet"],
    body: `
If your company uses timesheets, open **Attendance** → **Timesheet**. Each timesheet is one week, Monday to Sunday.

> No **Timesheet** tab? Timesheets are off until HR or an admin switches them on: **Settings** → **Attendance** → **Rules** → **Switch on weekly timesheets**. They work with or without clocking in. See [Setting up attendance](/help/attendance-setup).

## Log your hours

1. Use the arrows to choose the week.
2. **Add a project** for each piece of work. You only see projects you are allowed to log time to.
3. Type hours in each day: **7.5** or **7:30** both mean seven and a half hours. A day cannot go over 24 hours.
4. **Save** as you go. Totals for each project and each day add up as you type.

If you also clock in and out, a **Clocked** row shows the hours you clocked each day, so you can check they match.

## Submit the week

Choose **Submit week** at the end of the week. It goes to your manager to approve, and you cannot change it while it waits.

If your manager **sends it back**, their note shows at the top of the week. Change it and submit again. If you find a mistake after it has been approved, ask your manager to reopen it.
`,
  },
  {
    slug: "claiming-expenses",
    title: "Claiming expenses",
    summary: "Starting a claim, adding receipts, submitting and getting paid back.",
    audience: EVERYONE,
    paths: ["/expenses"],
    body: `
If your company uses expense claims, open **Expenses** in the menu.

> No **Expenses** in the menu? Expense claims are off until HR or an admin switches them on: **Settings** → **Expenses** → **Rules** → **Switch on expense claims**. See [Setting up expenses](/help/expenses-setup).

## Start a claim

A claim groups expenses from one trip or one month. Choose **New claim**, give it a name such as "Abuja client visit", then add each expense.

## Add an expense

1. Choose **Add expense**.
2. Pick the **category**. Its limit, if it has one, is shown underneath.
3. Enter the **date**, **what it was for** and the **amount**. For mileage, enter the **distance** instead and the amount is worked out.
4. Add the **receipt**: on a phone choose **Take photo**; on a computer choose a photo or PDF.
5. **Save**.

Items are marked if they are **over the limit**, **over the monthly limit** or have **no receipt**. You can still claim an item over a limit; your approver sees the mark. An item that needs a receipt cannot be submitted without one, and expenses older than your company's limit (often 90 days) cannot be claimed.

## Submit and approval

Choose **Submit for approval**. The claim usually goes to your manager, then to finance. You can **Withdraw** it while it waits. If it is **sent back for changes**, the note tells you what to fix; change it and submit again. A rejected claim cannot be submitted again.

## Getting paid back

Once approved, the claim is paid back either **with your next pay** (shown on your payslip under expenses paid back, and not taxed) or **by bank transfer**, depending on your company. The claim shows **Paid** when it is done.
`,
  },
  {
    slug: "goals",
    title: "Setting and tracking goals",
    summary: "Goals, key results, check-ins and lining goals up with the company's.",
    audience: EVERYONE,
    paths: ["/performance", "/performance?tab=goals"],
    body: `
Open **Performance** → **Goals**. You see your goals, your team's goals if you manage people, and the company's goals.

## Set a goal

1. Choose **New goal**.
2. Write what will be achieved, with details if they help, and a start and due date.
3. Under **Supports**, line it up with a company goal or one of your manager's goals, so everyone can see how the work fits together.
4. Add **key results** if the goal can be measured: each has a start, a current value, a target and a unit (for example %, ₦ or customers). Progress is worked out from them. Without key results, you set progress by hand.
5. **Save goal**.

## Check in

Open a goal to post a **check-in**: update the key results or progress, set the status (**On track**, **At risk**, **Behind**, **Done** or **Cancelled**) and add a note on what moved or what is in the way. Check-ins build up a history your manager can see.

## Who sees your goals

You, your managers and HR. Company goals are visible to everyone and set by HR.
`,
  },
  {
    slug: "your-reviews",
    title: "Your performance reviews",
    summary: "Writing your self review, peer reviews, and reading your manager's review.",
    audience: EVERYONE,
    paths: ["/performance?tab=reviews", "/performance/reviews"],
    body: `
When HR starts a review cycle, you get an email and a task under **Performance** → **Reviews** → **To do**.

## Your self review

1. Open **Your self review**.
2. Answer each question. Rating questions use your company's scale (for example 1 Needs improvement to 5 Outstanding); written questions are free text.
3. **Save draft** as often as you like. Only you can see a draft.
4. **Submit** when you are done. Every rating must be answered first, and you cannot change it after submitting. Your manager then sees it.

## Peer reviews

Your manager may ask you to review a colleague. Only that colleague's managers and HR read what you write; the colleague does not. If you cannot give useful feedback, **Decline**.

## Reading your review

When your manager has written your review, they **share** it with you. You then see their answers and your final rating. Add any comments and choose **I have read my review**. You never see peer reviews about you.

> Reminders arrive three days before a review is due and weekly once it is overdue.
`,
  },
  {
    slug: "feedback-and-one-to-ones",
    title: "Feedback and one-to-ones",
    summary: "Giving feedback at any time, and your one-to-ones with your manager.",
    audience: EVERYONE,
    paths: ["/performance?tab=feedback", "/performance?tab=one_on_ones"],
    body: `
## Give feedback

Open **Performance** → **Feedback**. Pick a colleague, write your praise or advice, and **Send feedback**. They are notified and can read it.

Tick **Only for their manager** to send it privately: the person does not see it, but their managers and HR do. You can delete feedback you gave.

The page also shows feedback you have **received** and **given**.

## One-to-ones

Open **Performance** → **One-to-ones**. Your manager plans them; you both see the date, **agenda** and **shared notes**, and you can both add to them. **Action items** can be ticked off by either of you, with an owner for each. Your manager may also keep **private notes** that only they see.
`,
  },
  {
    slug: "company-files",
    title: "Company files",
    summary: "Finding policies and handbooks, and confirming you have read them.",
    audience: EVERYONE,
    paths: ["/files"],
    body: `
Open **Files** in the menu for the documents HR shares with everyone: the handbook, policies, forms and templates. Browse the **folders** or **search files**, and sort newest or oldest first.

## Files you must read

Some files ask you to confirm you have read them. You get a notification and see them on Home. Open the file, read it, then choose **I have read this**. The file then shows **You have read this**, and HR can see who has and has not.

## Your own documents

Documents about you, such as your contract, are on your profile under **Documents**, not here.
`,
  },
  {
    slug: "directory-and-org-chart",
    title: "Directory and org chart",
    summary: "Finding colleagues, their contact details and who reports to whom.",
    audience: EVERYONE,
    paths: ["/employees"],
    body: `
Open **People** in the menu. Depending on your access you see the employee **list**, the **directory** and the **org chart**.

## Directory

Search by name, or filter by **department** and **location**. Each person shows the work details your company has chosen to share, such as job title, work email, phone and who they report to.

## Org chart

The org chart shows who reports to whom. Use **Jump to an employee** to find someone; the chart highlights the line from them up to the top. Hover a name for their details. **Export** the chart as a PDF or picture, or as a file for Visio or Lucidchart.

> If People shows **Turned off**, your company has switched the directory off.
`,
  },
];
