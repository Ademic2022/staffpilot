import type { Article } from "../index";

const HR: Article["audience"] = ["hr"];

export const ADMIN: Article[] = [
  {
    slug: "setting-up",
    title: "Setting up your company",
    summary: "A checklist for the first days: company details, structure, people, leave and access.",
    audience: HR,
    paths: ["/settings"],
    body: `
Everything you set up lives under **Settings** in the menu. You only see the areas your access level can change. A good order for a new company:

1. **Company**: your name, logo and colour, time zone, currency, date and name formats, and sign-in security. See [Company settings](/help/company-settings).
2. **Job organization**: legal entities, locations, departments, job titles, grades and teams. See [Organization structure](/help/organization).
3. **People**: add employees one by one or import a spreadsheet. See [Adding and updating people](/help/people-records).
4. **Time off**: leave types, policies and public holidays. See [Setting up time off](/help/time-off-setup).
5. **Users and access**: invite people to sign in and give them access levels. See [Users and access levels](/help/users-and-access).
6. Then, as you need them: approvals, email alerts, onboarding checklists, benefits, training, attendance, performance and expenses.
7. To run payroll here, switch on **Run payroll in StaffPilot** (Company → General settings), then see [Setting up payroll](/help/payroll-setup).

![The setup checklist at the top of Settings. Each step ticks itself when it is done.](shot:setup-checklist)

## What a new company starts with

So you are not starting from an empty page, a new company already has these. Change or remove any of them.

- **Your legal entity** and a **Head office** location, in your country's time zone.
- **Your own employee record**, at the head office.
- **Leave types**: annual (20 days), sick (12 days, the Labour Act minimum), maternity (60 working days, 12 weeks), paternity (10 working days), compassionate and unpaid.
- **Public holidays** for this year and next, for a Nigerian company. See [Setting up time off](/help/time-off-setup).
- **Document categories**: contract, ID, certificates, work permit and disciplinary.

## Features you switch on

These are off for a new company. Until one is switched on, its menu item is hidden from everyone.

| Feature | Where to switch it on |
|---|---|
| Clocking in and out | **Settings** → **Attendance** → **Rules** → **Switch on clocking in and out** |
| Weekly timesheets | **Settings** → **Attendance** → **Rules** → **Switch on weekly timesheets** |
| Expense claims | **Settings** → **Expenses** → **Rules** → **Switch on expense claims** |
| Payroll and payslips | **Settings** → **Company** → **General settings** → **Run payroll in StaffPilot** (owners) |
| Employees change their own photo | **Settings** → **Company** → **General settings** |
| Employees upload their own files | **Settings** → **Company** → **General settings** |

> On any settings page, the **?** button beside the bell opens its article.
`,
  },
  {
    slug: "company-settings",
    title: "Company settings",
    summary: "Company details, general settings, logo and colour, and sign-in security.",
    audience: HR,
    paths: ["/settings/company"],
    body: `
**Settings** → **Company**. Only owners can change these.

## Company info

Your company's name (shown on the sign-in page, in emails and on reports), country code, currency for new pay records, and time zone (leave days, reminders and reports follow it).

## General settings

How dates, amounts and names read for everyone, and what employees may do themselves:

- **Date format** and **Display names as** (preferred names can stand in for first names).
- **Show currency codes on amounts**: NGN 450,000.00 instead of ₦450,000.00, clearer when you pay in more than one currency.
- **Let employees change their own photo**.
- **Let employees upload files to their own record**: they land in an Employee uploads category the employee and HR can see.
- **Show expanded gender options**: adds Non-binary and a pronouns field.
- **Run payroll in StaffPilot**: adds Payroll and My payslips. Leave it off if you pay people elsewhere; expense claims are then paid back by bank transfer, and payslips already published stay readable.

## Logo and colour

Upload a PNG, JPG or WebP logo (up to 2 MB) and choose your colour. They appear on the sign-in page, the menu and emails. A transparent background works well: empty margins are trimmed, and a white logo is shown on a dark tile so it stays visible.

![Upload your logo (1) and pick your colour (2). The preview shows how it will look.](shot:company-branding)

## Login and security

- **Admins must use two-step sign-in**: everyone with admin access must set up an authenticator app. Set it up for yourself first on Your account.
- **Sign people out after** a period of no activity. Shorter is safer on shared computers.
- **Only allow these networks**: restrict sign-in to your office network addresses.

## Data and account

Export everything your company keeps, or close the account. See [Exporting your data and closing the account](/help/data-and-closing).
`,
  },
  {
    slug: "users-and-access",
    title: "Users and access levels",
    summary: "Inviting people one by one or all at once, access levels, field access, data scope, View as and API keys.",
    audience: HR,
    paths: ["/settings/users"],
    body: `
**Settings** → **Users and access** controls who can sign in, what they can do and whose records they reach.

## Invite someone

On **Users**, choose **Invite someone**. Enter their name and work email, choose their **access level**, and link **their employee record** so they see their own profile, leave and documents. They get an email to set a password. You can **cancel an invitation** that has not been used.

An employee record and a login are separate: people in **People** cannot sign in until they are invited, so they are not on the Users list yet.

## Invite many employees at once

Choose **Invite employees** to invite everyone who has a work email and no login yet. Everyone is ticked; untick anyone who should wait, then **Send invitations**. Each person gets the **Employee** access level and is linked to their own record. People who have left, people already invited, and people with no work email are not listed (add a work email on their record to invite them).

Managers, HR and payroll need more than the Employee level: invite them with **Invite someone**, or change their level once they have joined.

To stop someone signing in, turn off **Can sign in**. Their access ends straight away; their records stay. The list shows each person's **last sign-in**, and **Export** downloads it.

## Access levels

An access level is a set of permissions, such as managing employees, seeing pay, setting up leave, running payroll or managing expenses. Built-in levels include **Owner**, **HR admin**, **Payroll officer**, **Line manager**, **Employee** and **Former employee**. On **Access levels** you can create your own, duplicate one to start from it, or delete one nobody uses.

### Field access

For each group of fields (personal, contact, address, emergency, pay, bank and ID, custom fields) an access level says **None**, **View** or **Edit**, separately for **other people's** records and for the person's **own**.

### Whose records

Each level reaches everyone, or only the person's own team, or only their direct reports. Under **Limit to part of the organization** you can also restrict someone to some legal entities, locations or departments.

## View as

Use **View as** (the eye button beside a user) to see the app exactly as that person does, to check their access. It is read-only, ends after an hour, and is recorded in the audit log. Choose **Stop viewing** in the yellow bar to return.

## API keys

On **API keys**, make a key for another system, such as accounting, to use your company's data. A key acts as the person who made it, with their access. Keys are **read-only** unless you choose **Read and write**. Copy the key when it is shown; it is not shown again. Delete a key to stop it working.
`,
  },
  {
    slug: "people-records",
    title: "Adding and updating people",
    summary: "New employees, imports, power edit, job and pay changes, leaving and archiving.",
    audience: HR,
    paths: ["/employees/new", "/employees/import", "/employees/power-edit", "/employees/requests"],
    body: `
## Add someone

From **People**, choose **New employee**. Fill in their legal name, hire date, legal entity, department, location, job title, manager, employment type and starting pay. Their job history and audit trail start from the day they join. To let them sign in, invite them from Settings → Users and access.

## Import many at once

From the **…** menu on People, choose **Import employees**. **Download template** (it has a column for every field, with notes, and three grey example rows using your own organization names), fill in one row per person, and upload it as Excel or CSV. The example rows are numbered **EXAMPLE-1** to **EXAMPLE-3** and are never imported, so it does not matter if you leave them in. Legal entities, departments and job titles must match the names under Job organization. Every row is checked first: if any row has a problem, nothing is imported and you get a list to fix.

![Download the template, fill in one row per person, then upload it.](shot:employee-import)

## Change many at once

**Power edit employees** shows a spreadsheet of everyone, so you can change a field for many people quickly, for example after a reorganization.

## The People list

Filter the list, choose columns with **Customize view**, and save a filtered list as a **view** to come back to. **Export to CSV** or **Export to Excel** downloads what you see.

## Job, pay and status changes

On a person's profile, **Request a Change** has:

- **Job information…** and **Promotion…**: dated entries in their employment history. A future date takes effect on that day.
- **Compensation…**: a new pay record. Earlier records stay in the pay history.
- **Employment status…**: probation, confirmation, leave and leaving. When someone leaves, record the **type of leaving** (voluntary, involuntary or other); it is used in turnover reports.
- **Asset request…**: equipment such as a laptop.

If your company has approval steps for pay or job changes, they wait for approval first. See [Approval settings](/help/approval-settings).

## Change requests from employees

When people change their legal name, bank details or ID numbers, the change waits for HR under **Change requests** (and in your notifications). Check the new details against a document before approving: they go straight into payroll.

## Archive a record

**Archive record** (in the **…** menu on a profile) hides a record from the employee list but keeps its history, pay and audit entries for reporting.
`,
  },
  {
    slug: "organization",
    title: "Organization structure",
    summary: "Legal entities, locations, departments, job titles, grades and pay bands, and teams.",
    audience: HR,
    paths: ["/settings/organization"],
    body: `
**Settings** → **Job organization** holds the structure every employee record points to.

- **Legal entities**: the companies that employ people, each with its country and currency. Payroll uses the country's tax rules.
- **Locations**: offices and sites, with their time zone and public holidays. For attendance, a location can have a **clock-in area**: its latitude, longitude and radius in metres.
- **Departments**: can sit under other departments.
- **Job titles**, each with a **job description** (up to 4,000 characters, about 600 words) that shows on the Job tab of everyone with that title. **Write with AI** drafts one from the title, using anything you have typed as notes; read it and adjust it before saving, or choose **Undo**. Only the title and your notes are sent to write it.
- **Grades and pay bands**: ranked grades, each with a minimum, midpoint and maximum pay. The **Pay bands** report shows who is outside their band.
- **Teams**: groups that cut across departments, such as project teams. Everyone can see them.
`,
  },
  {
    slug: "time-off-setup",
    title: "Setting up time off",
    summary: "Leave types, policies, carry-over, approvals, public holidays and adjusting balances.",
    audience: HR,
    paths: ["/settings/time-off"],
    body: `
**Settings** → **Time off** has three tabs. Start with annual and sick leave.

## Leave types

Each type has a name and a colour on the calendar, and says:

- Whether it **tracks a balance** (days are earned under a policy and drawn down) or is **granted case by case**.
- **Approvals**: none (booked as soon as it is requested), the line manager, the line manager then theirs, or three levels up the line. Where the line ends, HR decides.
- Whether unused days are **paid out on leaving**: added to the last payslip as part of the final settlement.

Inactive types cannot be requested; their history is kept.

## Policies

A policy says how many days a year a group of people earns. Each employee gets the most specific active policy that matches them (by location, contract type and so on). A policy sets:

- Days a year, earned **all on 1 January** or **monthly**. Someone who joins mid-year gets the share of the year left.
- **Carry over up to** a number of days into next year, and whether carried days **expire** after some months.
- **Long-service days**: extra days after a number of years.

Changing a policy does not change the day count of requests already made.

## Public holidays

Add the days everyone is off, for every location or just some. Holidays are not counted as leave days.

A Nigerian company starts with the federal public holidays for this year and next, and each new year is added automatically. A fixed holiday that falls on a weekend also gets the next working day, marked **(observed)**. Eid el-Fitr, Eid el-Kabir and Eid el-Maulud follow the moon, so their expected dates are marked **(to be confirmed)**: change them when the Federal Government announces the dates. A year you have already filled in yourself is never changed.

## Adjusting a balance

On a person's **Time off** tab, choose **Adjust leave balance** to add or remove days, with a reason. It shows in their ledger. Use it for opening balances when you start using StaffPilot.
`,
  },
  {
    slug: "approval-settings",
    title: "Approval settings",
    summary: "Who approves pay changes, job changes, time off and information updates.",
    audience: HR,
    paths: ["/settings/approvals"],
    body: `
**Settings** → **Approvals** decides who approves what.

- **Pay changes** and **Job changes**: a chain of steps in order, for example the person's manager, then HR, then a named finance person. Waiting changes show under **Approvals** for each approver in turn.
- **Time off**: approved up the reporting line. How many managers approve (1 to 3) is set per leave type in [Setting up time off](/help/time-off-setup).
- **Information updates**: changes people ask for to their own name, bank or ID details go to everyone who can change employee records, in their notifications and on Home.
`,
  },
  {
    slug: "email-alerts",
    title: "Email alerts",
    summary: "Birthday, anniversary, probation and other date reminders by email.",
    audience: HR,
    paths: ["/settings/alerts"],
    body: `
**Settings** → **Email alerts** sends reminders about dates on employee records, each morning, in the app and by email. Start with birthdays or probation ending.

Choose **New alert**, then:

- What it is about: **birthdays**, **work anniversaries**, **new starters**, a **monthly summary** of birthdays and anniversaries, or **a date on the record** (such as probation end, hire date or one of your own date fields).
- **Days before**, for dates: 0 sends it on the day.
- **Recipients**: named people, everyone with an access level, the person's manager, or the person themselves.
`,
  },
  {
    slug: "onboarding",
    title: "Onboarding and offboarding",
    summary: "Checklists of tasks for people joining and leaving.",
    audience: HR,
    paths: ["/settings/checklists"],
    body: `
## Set up the tasks

**Settings** → **Onboarding and offboarding** holds the tasks copied onto a record when you start someone's checklist. Each task has a name, details, a category, who it is **assigned to** (HR, the manager, the employee, IT or finance) and when it is **due**, in days from the start or leaving date.

A task can apply to everyone, or only to people in some **departments** or **locations**. Tasks not **in use** are left out of new checklists.

## Run a checklist

On a person's **Onboarding** or **Offboarding** tab, choose **Start onboarding** (or offboarding). Their tasks are copied from the list. Tick tasks off as they are done, and add one-off tasks with **Add task**. People see their own tasks on Home under **My stuff**, and the **Onboarding** widget shows who is starting and who has overdue tasks.
`,
  },
  {
    slug: "files-and-documents",
    title: "Company files and employee documents",
    summary: "Sharing files, read confirmations, document categories and expiry reminders.",
    audience: HR,
    paths: ["/files?view=employee"],
    body: `
## Company files

On **Files**, make **folders** and **upload files** (PDF, Word, Excel, images or text). Tick **Share with employees** for everyone to see and download a file; otherwise only HR can.

To make sure people read something, such as a new policy, open the file's menu and choose **Ask everyone to confirm they read it**. Everyone is notified, and the file shows how many have confirmed.

## Employee documents

Documents about one person, such as contracts, IDs, permits and certificates, are uploaded from their profile's **Documents** tab. HR sees them all under **Files** → employee documents.

Each **category** decides who besides HR can see its documents:

- **The employee can see these**.
- **Their managers can see these** (anyone above them in the reporting line).
- **Needs an expiry date**: for documents that run out. HR is reminded 30 and 7 days before, and on the day. **Expired or expiring** lists them.

Removing a document hides it; the file is kept for the records.
`,
  },
  {
    slug: "training",
    title: "Training",
    summary: "The training catalogue, required courses and what is due.",
    audience: HR,
    paths: ["/settings/training"],
    body: `
**Settings** → **Training** is your catalogue of courses. For each course:

- **Required**: shows as due or overdue for the people it applies to, and in the **Training due** report.
- **How often** it must be repeated, if ever.
- **First due, days after hire**: empty means no first deadline.
- Who it applies to: some departments or locations, or everyone.

People record completions in the **Training** table on their profile, using the course name. Each person's profile shows what is due soon or overdue.
`,
  },
  {
    slug: "benefits",
    title: "Benefits",
    summary: "Benefit plans and enrolling people.",
    audience: HR,
    paths: ["/settings/benefits"],
    body: `
**Settings** → **Benefits** lists the plans the company offers, such as pension, health and life cover: the type, provider, and what the employer and employee each pay (as a percentage of pay).

Enrol people from the **Benefits** tab of their record: choose the plan, the cover (employee only, employee and spouse, employee and children, family) and the start date. When cover stops, set its status to **Ended** instead of deleting it, so you keep a record. The **Benefit summary** and **Benefit enrollments** reports show who is covered.
`,
  },
  {
    slug: "reports",
    title: "Reports",
    summary: "Standard reports, custom reports, favourites and exports.",
    audience: ["hr", "payroll", "manager"],
    paths: ["/reports"],
    body: `
Open **Reports** in the menu. **Recent** shows reports you opened; star a report to keep it under **Favorites**.

## Standard reports

Ready-made reports, each with filters (dates, departments, locations and so on):

- **People**: Headcount, Additions and terminations, Employee turnover, Workforce make-up, Birthdays, Years of service, Job history, Missing data, Change history.
- **Pay**: Pay summary, Pay bands, Salary history.
- **Benefits**: Benefit summary, Benefit enrollments.
- **Time off**: Time off used, Time off balances.
- **Training**: Training due.

You only see the reports and columns your access allows.

## Custom reports

Under **Custom reports**, **Build one** from any employee fields: pick the columns, filters and sort order, then save it. A custom report is yours unless you share it with the company (everyone who may see employee records).

## Export

Every report downloads as **CSV**, **Excel** or **PDF**.
`,
  },
  {
    slug: "attendance-setup",
    title: "Setting up attendance and timesheets",
    summary: "Clocking rules, overtime, payroll links, shifts and rosters, and projects.",
    audience: HR,
    paths: ["/settings/attendance"],
    body: `
Attendance is off for a new company: nobody sees **Attendance** or the clock button on Home until you switch it on under **Rules** below. **Settings** → **Attendance** has three tabs.

## Rules

- **Switch on clocking in and out**: adds Attendance to everyone's menu.
- **Switch on weekly timesheets**: people log hours against projects each week; managers approve them. Works with or without clocking.
- **Grace (minutes)**: clocking in this late still counts as on time.
- **Overtime counts after (minutes)**: shorter extra time is ignored.
- **Overtime pay rate**: times the hourly rate, for example 1.5.
- **Pay approved overtime through payroll**.
- **Treat unexplained absences as unpaid days**: working days with no clock-in and no approved leave are taken off pay.

These two only take effect when your company runs payroll in StaffPilot.
- **Refuse clock-ins away from the site**: only where a location has a clock-in area (Job organization → Locations). Otherwise they are just flagged.

## Shifts and roster

Everyone works **Standard hours** (9 to 5, Monday to Friday, with an hour's break) unless you put them on another shift. Choose **New shift** for other working hours, such as nights or weekends. To put people on a shift from a date, use the people button on that shift. A new roster entry ends the one before it.

Each person's shift decides when they are late, how much is overtime, and their hourly rate for overtime pay.

## Projects

The projects and cost centres people log timesheet hours against. Each can have a code, client, **cost centre** and a **billable** flag, and can be limited to chosen people. Close a project to stop new time being logged to it.

## Exports

On **Attendance** → **Team**, **Export project hours** downloads approved hours by project, person and day for the period.
`,
  },
  {
    slug: "performance-setup",
    title: "Running review cycles",
    summary: "Templates, starting a cycle, following progress, calibration and closing.",
    audience: HR,
    paths: ["/settings/performance", "/performance?tab=cycles", "/performance/cycles"],
    body: `
## Templates

**Settings** → **Performance** holds review templates: the questions and the rating scale. Every company starts with **Standard review**. For each question choose **Written** or **Rating**, and who answers it: **Self review**, **Manager review**, **Peer review** or several. The scale has 2 to 7 points, lowest first; managers also give an overall rating on it.

## Start a cycle

1. **Performance** → **Review cycles** → **New cycle**.
2. Name it and choose the kind (annual, mid-year, quarterly, probation, other), the period, and the due dates for self and manager reviews.
3. Choose the template and **who is reviewed**: everyone, some departments, or chosen people (needed for probation reviews).
4. Choose whether it includes **self reviews** and **peer reviews**.
5. Save. Nothing is sent yet; check the number of people on the cycle page, then choose **Start cycle**.

Starting emails everyone. Each person's manager at that moment writes their review, so check everyone has a manager first: people without one show **No reviewer**. Reminders go out three days before each due date, and weekly once overdue.

## Follow progress

The cycle page shows how many self reviews, manager reviews and shares are done.

## Calibration

The **Rating spread** shows how many people sit at each rating, before and after calibration. In **Reviews and calibration**, adjust a rating that is out of line with similar work elsewhere, and give a reason. People only see the final rating once their manager shares the review.

## Close the cycle

**Close cycle** when you are done. Unfinished reviews can no longer be written; shared reviews stay readable.
`,
  },
  {
    slug: "expenses-setup",
    title: "Setting up and paying expenses",
    summary: "Expense rules, categories and limits, and paying claims back.",
    audience: ["hr", "payroll"],
    paths: ["/settings/expenses", "/expenses?tab=all"],
    body: `
Expense claims are off for a new company: nobody sees **Expenses** until you switch them on under **Rules**.

## Rules

**Settings** → **Expenses** → **Rules**:

- **Switch on expense claims**: adds Expenses to everyone's menu.
- **Who approves**: the person's **manager**, then **finance** (people with the expenses permission, such as payroll officers and HR admins). Turn off either step. With both off, claims are approved as soon as they are submitted.
- **Receipts needed above**: receipts are only needed above this amount. Leave it empty to need one for every item, in categories that ask for receipts.
- **Oldest expense (days)**: older expenses cannot be claimed.
- **Paid back**: **with the next payroll** (added to net pay, not taxed) or **separately, by bank transfer**. Without payroll in StaffPilot, claims are always paid back separately.

## Categories

Every company starts with Travel, Accommodation, Meals, Fuel and mileage, Phone and internet, Office supplies and Other. For each category set:

- A **limit per item** and a **limit per person a month**. Items over a limit can still be claimed; approvers see them marked.
- Whether it **needs a receipt**.
- A **mileage rate per km**, to claim by distance instead of amount.
- A **ledger account**, for the accounting export.

## Paying claims back

- **With payroll**: approved claims are added to the next payroll as **Expense claims** and marked paid when that payroll is approved. If the payroll is cancelled, they wait for the next one.
- **Separately**: on **Expenses** → **All claims**, choose **Approved, to be paid**. Download the **Bank file**, make the transfers, then select the claims and **Record as paid** with the transfer reference. Each person is told.

**Accounting export** downloads every approved and paid item with its category and ledger account.
`,
  },
  {
    slug: "employee-fields",
    title: "Employee fields, record tabs and the directory",
    summary: "Custom fields and tables, dropdown lists, arranging record tabs and directory settings.",
    audience: HR,
    paths: ["/settings/fields", "/settings/directory"],
    body: `
## Custom fields and tables

**Settings** → **Employee fields** → **Custom fields** adds extra details your company keeps on every employee, such as a uniform size or a staff ID. A **custom table** is a list each employee can have several entries in, such as certifications, assets or bonuses.

## Dropdown lists

**Dropdown lists** are the choices offered for reasons, relationships and degrees, such as the reasons for leaving or relationships for emergency contacts. Add, rename or retire choices.

## Arranging record tabs

On any profile, choose **Customize tabs**. Drag to reorder tabs and sections; built-in tabs can be renamed and moved, and your own can be removed. Changes apply to every employee's record.

## Company directory

**Settings** → **Company directory** decides whether people see the directory and org chart, and which work details they show (such as work phone, email and location).
`,
  },
  {
    slug: "data-and-closing",
    title: "Exporting your data and closing the account",
    summary: "Downloading everything your company keeps, and what happens when you close the account.",
    audience: HR,
    paths: ["/settings/company?tab=data"],
    body: `
Both are under **Settings** → **Company** → **Data and account**, and only owners can use them.

## Export all company data

Choose **Export all data**. StaffPilot prepares one ZIP file in the background and emails you when it is ready, usually within minutes. It holds:

- **tables/**: a spreadsheet (CSV, opens in Excel) for every kind of record: employees, job and pay history, leave requests and balances, payroll runs and payslip lines, attendance, timesheets, reviews, goals, feedback, expense claims, documents, settings and the audit log. A **people_who_can_sign_in** file lists everyone's name, email and access level.
- **files/**: every stored file: employee documents, company files, receipts, photos and logos.
- **payslips/**: a PDF of every approved payslip, by month.
- **README.txt**: what each file holds and how the tables link together.

Passwords, two-step sign-in secrets, API keys and calendar links are never included.

Choose **Download** when it is ready. Each download link works for 10 minutes and is recorded in the audit log. The file is deleted after 7 days; make a new export if you need it again (up to five a day).

> Keep the export somewhere safe: it holds bank details, ID numbers and pay for everyone.

## Close the account

Choose **Close the account…**, type the company name, enter your password and, if you like, say why. Then:

1. StaffPilot becomes **read-only** for everyone straight away, with a red banner saying when it closes. People can still sign in, read everything and download, and owners can still export.
2. Owners are emailed now, and reminded 7 days and 1 day before.
3. Any owner can **Cancel the closure** during the 30 days; everything then works as before.
4. On the closing day the account **closes**: nobody can sign in, and your company's address shows that the account has closed. The data is kept, hidden, for **one year** in case you come back. To restore it, contact StaffPilot; everything comes back as it was.
5. A month before the year is up, the owners are reminded. Then every record and stored file is deleted for good, logins used only for your company are removed, and the owners get a **deletion confirmation** by email to keep.
6. Encrypted backups that still hold copies age out on their own within about five weeks after that; they are never restored for anyone.
`,
  },
  {
    slug: "audit-log",
    title: "The audit log",
    summary: "Who changed what, and when.",
    audience: HR,
    paths: ["/settings/audit"],
    body: `
**Settings** → **Audit log** records changes and sensitive views: record changes, pay changes, approvals, payroll actions, exports, downloads of bank details, and View as sessions. Search by name, email or summary, filter by area and date, and **Export this page** to CSV.

Entries cannot be changed or deleted.
`,
  },
];
