import type { Article } from "../index";

const LEADS: Article["audience"] = ["manager", "hr"];

export const MANAGER: Article[] = [
  {
    slug: "approving-requests",
    title: "Approving time off and changes",
    summary: "Deciding leave requests, pay and job changes, and handing over while you are away.",
    audience: LEADS,
    paths: ["/leave/approvals"],
    body: `
Open **Approvals** in the menu. The count beside it is how many requests are waiting for you. You also get a notification and an email for each one.

## Time off

Each request shows the person, dates, type of leave, number of days and their note. Check the **Leave calendar** if you need to see who else is away, then **Approve** or **Reject** it. A reason helps when you reject.

Some leave types need more than one approval. After you approve, the request moves to the next manager up the line; where the line ends, HR decides. The person is told once it is fully decided.

## Pay and job changes

Changes that wait for approval before they take effect, such as a promotion, a transfer or a pay rise, also appear here under **Pay and job changes**, in the order your company has set (for example manager, then HR, then finance). Approve or reject each one. A change with a future date takes effect on that day.

## Away yourself?

Under **Hand over your approvals**, choose who covers for you and the dates. While you are away, they can approve or reject requests that are waiting for you.

> HR can tick **Show every pending request** to see and decide requests waiting for anyone.
`,
  },
  {
    slug: "requesting-changes",
    title: "Asking for a promotion, job or pay change",
    summary: "How managers ask for changes to someone in their team.",
    audience: LEADS,
    paths: [],
    body: `
Open the person's profile and choose **Request a Change**:

- **Promotion…**: a new job title, grade or department, recorded as a promotion. Ask for a pay rise separately with **Compensation…**.
- **Job information…**: a new department, location, manager or job title.
- **Compensation…**: a new salary or rate.

Enter the **effective date** and a comment, then send it. It goes through your company's approval steps (set by HR under Settings → Approvals) and shows under **Approvals** for each approver. You are told when it is decided; nothing changes on the record until then.

HR can make these changes directly from the same menu, which also has **Employment status…** (for probation, confirmation, leave and leaving) and **Asset request…**.
`,
  },
  {
    slug: "team-attendance",
    title: "Your team's attendance and timesheets",
    summary: "Who is in today, correcting time, approving overtime and timesheets.",
    audience: LEADS,
    paths: ["/attendance?tab=team", "/attendance?tab=approvals"],
    body: `
Open **Attendance** → **Team**.

## Who is in

The board shows everyone below you for a day: **In**, **Gone home**, **Not in yet**, **Late**, **Absent**, **On leave** or **Not working**, with their clock-in and clock-out times. Change the date to look back.

## Correcting someone's time

Click a person to see their days. Use the pencil on a day to add or change a clock-in and clock-out, for example when they forgot to clock out. Add a note to say why. Corrected days are marked **Edited** and recorded in the audit log.

## Overtime

When someone works longer than their shift by more than your company's threshold, the extra time is recorded when they clock out. It appears under **Attendance** → **Approvals** → **Overtime to approve**. Approve it to pay it in the next payroll, or reject it. Nobody can approve their own overtime.

## Timesheets

If your company uses timesheets:

- **Team** shows each person's week: **Not started**, **Not submitted**, **Waiting for approval**, **Approved** or **Sent back**.
- **Approvals** lists weeks waiting for you. Open one to see the hours by project and day, next to the hours they clocked. **Approve** it, or **Send back** with a note saying what to change.
- Found a mistake in an approved week? Open it and **Reopen** it.
`,
  },
  {
    slug: "approving-expenses",
    title: "Approving expense claims",
    summary: "Checking receipts and policy marks, and approving, sending back or rejecting.",
    audience: ["manager", "hr", "payroll"],
    paths: ["/expenses?tab=approve", "/expenses/"],
    body: `
Open **Expenses** → **To approve**. Each claim shows the person, total and any policy marks.

## Check a claim

Open the claim to see each item with its category, date, description and amount. Choose **View** to open a receipt. Items are marked when they are **over the limit**, **over the monthly limit** or have **no receipt**; a note at the top lists them.

## Decide

- **Approve**: the claim moves to the next step (usually finance), or is approved for payment if you are the last.
- **Send back**: it returns to the person as a draft with your reason, so they can fix it and submit again.
- **Reject**: it is closed for good. Say why.

Nobody approves their own claim. Once a claim is fully approved it is paid back with the next payroll or by bank transfer, depending on your company's settings.
`,
  },
  {
    slug: "writing-reviews",
    title: "Writing your team's reviews",
    summary: "Manager reviews, overall ratings, peer input, and sharing the review.",
    audience: LEADS,
    paths: ["/performance/reviews"],
    body: `
When HR starts a review cycle, each person's review appears under **Performance** → **Reviews** → **To do**. The **My team** list shows where each review is.

## Write the review

1. Open the review. Once the person submits their self review, you see it alongside.
2. Answer each question and give an **overall rating**. **Save draft** as you go; only you see a draft.
3. **Submit** when done. Every rating must be answered first.

## Ask for peer reviews

If the cycle includes peer reviews, use **Peer reviews** on the review page to add colleagues who work with the person, then **Ask**. They are emailed. Their answers reach you and HR only; the person never sees them.

## Share it

When the manager review is submitted, choose **Share with** the person. They can then read your review and their final rating, add comments and confirm they have read it. HR may adjust the rating during calibration before you share; the person only sees the final rating.
`,
  },
  {
    slug: "managing-your-team",
    title: "Goals, feedback and one-to-ones for your team",
    summary: "Setting goals for people, reading feedback about them and running one-to-ones.",
    audience: LEADS,
    paths: [],
    body: `
## Team goals

**Performance** → **Goals** → **My team's goals** lists the goals of everyone below you. Choose **Set a goal for someone** to give a person a goal, and open any goal to check in on it.

## Feedback about your team

On **Performance** → **Feedback**, use **Show feedback about** to pick someone in your team. You see all feedback about them, including feedback colleagues sent privately to managers.

## One-to-ones

On **Performance** → **One-to-ones**, choose **New one-to-one**, pick the person and the date. You both share the **agenda**, **notes** and **action items**. **Private notes** are yours alone. Upcoming one-to-ones are listed first, with open action items counted.
`,
  },
];
