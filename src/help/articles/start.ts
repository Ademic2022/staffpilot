import type { Article } from "../index";

export const START: Article[] = [
  {
    slug: "getting-around",
    title: "Getting around",
    summary: "Signing in, the menu, search and notifications.",
    audience: ["employee", "manager", "hr", "payroll"],
    paths: ["/notifications"],
    body: `
> New here? The first time you open Home, a one-minute tour shows you around. Take it again any time with **Take the tour** on the [Help](/help) page.

## Signing in

Your company has its own web address (HR sends it with your invitation). Sign in there with your work email and password. If you were invited, the email has a link to set your password first. Forgot it? Use **Forgot password** on the sign-in page and follow the link we email you.

If your role needs two-step sign-in, you are asked for a code from your authenticator app after your password. See [Your account and security](/help/your-account).

## The menu

The menu on the left only shows what you can use. Depending on your role you will see:

- **Home**: announcements, who is away, birthdays and your shortcuts.
- **My profile** and **My payslips**: your own record and pay.
- **People**: the employee list, directory and org chart.
- **Performance**, **Expenses**, **Payroll**, **Reports** and **Files**.
- **My time off**, **Approvals**, **Attendance** and the **Leave calendar**.
- **Settings**, for HR and admins.

On a phone, the menu opens from the button at the top left.

## Search

Press **⌘K** on a Mac or **Ctrl K** on Windows, or click **Search** at the top of the menu. Type two letters or more to find people, files, reports and settings, then press Enter to open one.

![Search finds people, reports and settings as you type.](shot:search)

## Notifications

The bell at the top of the menu shows what needs you: requests to approve, decisions on your own requests, reviews to write and files to read. Most also arrive by email. Open the bell and choose **See all notifications** for the full list, or **Mark all read** to clear the count.

> You can stop some emails (not the in-app notifications) in [Your account](/help/your-account).

## Getting help

The **?** button beside the bell opens the help article for the page you are on. From there you can search the whole guide.
`,
  },
  {
    slug: "your-account",
    title: "Your account and security",
    summary: "Password, two-step sign-in, recovery codes, email preferences and calendar feeds.",
    audience: ["employee", "manager", "hr", "payroll"],
    paths: ["/account"],
    body: `
Open **Your account** by clicking your name at the bottom of the menu.

## Change your password

Enter your current password and the new one, then **Change password**. Other devices you were signed in on need to sign in again.

## Two-step sign-in

Two-step sign-in asks for a six-digit code from an app on your phone each time you sign in, so a stolen password is not enough. Owners and HR can require it for everyone with admin access.

1. Install an authenticator app, such as Google Authenticator, Microsoft Authenticator or 1Password.
2. On Your account, choose **Set up two-step sign-in**.
3. Scan the code with the app (or type the key it shows).
4. Enter the code the app shows to finish.
5. Save the **recovery codes** somewhere safe. Each one works once if you lose your phone.

Run low on recovery codes? Choose **Make new codes**; the old ones stop working.

![Scan the code, or type the key into your authenticator app, then enter the code it shows.](shot:two-step-setup)

## Email preferences

You always see notifications in the app. Under email preferences you can stop the email copies for groups you do not need, such as time off requests, files to read, review reminders or expense claims. Messages about your security and sign-in are always sent.

## Calendar links

See time off and company dates in Google Calendar, Outlook or Apple Calendar. Under **Calendar links**, choose **Make a calendar link**, pick what it shows (who's out, birthdays, work anniversaries, public holidays), then add the link to your calendar app as a subscription. Anyone with a link can read it, so keep it private. **Delete link** stops it working.
`,
  },
  {
    slug: "home-page",
    title: "Your home page",
    summary: "Announcements, widgets, shortcuts and arranging your page.",
    audience: ["employee", "manager", "hr", "payroll"],
    paths: ["/home"],
    body: `
Home is the first page you see after signing in.

## Reminders

Set yourself reminders for follow-ups, renewals and deadlines. **Only you see them**, never the person they are about.

- On Home, **My reminders** → **Add**. Pick a day: tomorrow, next week, in a month or any date.
- On someone's profile, **More actions** → **Remind me…** links the reminder to them, and your reminders about them show at the top of their record.
- When adding an HR note, choose **Remind me to follow up** to set one from the note.
- On the day, the reminder appears under the bell and you get an email. Tick it off when done, or move it to tomorrow or a week later.

![A new reminder: say what to do and pick the day.](shot:reminder-new)

## What is on it

Home is made of widgets. Depending on your role you will see:

- **What's happening**: announcements from HR and new joiners.
- **Time off**: your balances, with a button to request time off.
- **My stuff**: things waiting for you, such as approvals and files to read.
- **Who's out**, **Celebrations** (birthdays and work anniversaries) and **Welcome** (new people).
- **Company links** HR has added, such as the handbook.
- For managers and HR: **Headcount, direct reports and turnover**, **Time off requests**, **Time off used**, **Pay raise**, **Certifications**, **Location** and **Onboarding**.

## Arrange your page

Choose to edit your page, then drag widgets to reorder them, hide the ones you do not need, or add more from the drawer (department, employment type, gender, age, benefit enrollments and public holidays). Only you see your layout.

## Announcements (HR)

HR and admins post from the **New** menu beside the greeting (**New announcement**). Announcements show on everyone's home page. The same menu starts a new employee or a new report.
`,
  },
];
