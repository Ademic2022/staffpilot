import type { Metadata } from "next";

import { Clause, LegalPage } from "@/components/landing/Legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Privacy policy · ${SITE.name}` },
  description: `How ${SITE.name} collects, uses, protects and deletes personal data, under the Nigeria Data Protection Act 2023.`,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const UPDATED = "4 November 2026";

export default function PrivacyPage() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated={UPDATED} intro={<p>
      {SITE.name} is HR and payroll software run by {SITE.legalName} ({SITE.location}). This policy explains what personal
      data we hold, why, who we share it with, how long we keep it and the rights you have, in line with the Nigeria Data
      Protection Act 2023 (NDPA).
    </p>}>
      <Clause id="who" title="1. Who is responsible">
        <p>
          <strong>Your employer is in charge of employee records.</strong> When a company uses {SITE.name}, that company decides
          what goes into its employee records and why. Under the NDPA the company is the <em>data controller</em>, and{" "}
          {SITE.legalName} is its <em>data processor</em>: we store and process those records only to run the service for
          that company, on its instructions.
        </p>
        <p>
          <strong>We are in charge of our own customer data:</strong> the details of the people who sign their company up,
          use this website or contact us. For that data {SITE.legalName} is the data controller.
        </p>
        <p>
          If you are an employee and want to see, correct or delete your record, ask your employer&apos;s HR team first;
          they control it. You can also write to us at {mail} and we will pass your request on and help them answer it.
        </p>
      </Clause>

      <Clause id="what" title="2. What we hold">
        <p>Inside each company&apos;s account, depending on the features the company uses:</p>
        <ul>
          <li>Identity and contact details: name, photo, work and personal email, phone numbers, address, date of birth, gender, marital status, nationality, emergency contacts.</li>
          <li>Employment details: job title, department, manager, hire and leaving dates, pay history, training, onboarding tasks, documents the company uploads.</li>
          <li>Payroll details: salary, allowances, deductions, bank name and account number, tax ID, national ID, pension provider and ID, NHF number, payslips, loans and advances.</li>
          <li>Time and performance: leave requests and balances, clock-in and clock-out times, timesheets, overtime, goals, reviews, feedback and one-to-one notes.</li>
          <li>Expenses: claims, amounts and the receipts attached to them.</li>
          <li>Account and security records: sign-in email, a hashed password (we never see the password itself), two-step sign-in settings, sign-in times, IP addresses and an audit log of changes.</li>
        </ul>
        <p>
          For our own customers we also hold the company name, the web address it chose, the name and email of the person
          who set it up, any company details the owner adds in Settings, and any messages you send us.
        </p>
        <p>
          We do not use advertising or analytics trackers, and we do not buy, rent or sell personal data.
        </p>
      </Clause>

      <Clause id="why" title="3. Why we use it">
        <ul>
          <li><strong>To provide the service</strong> each company signed up for: records, leave, payroll, attendance, performance, expenses and self-service. Basis: our contract with the company, and the company&apos;s own lawful basis as employer.</li>
          <li><strong>To keep accounts secure</strong>: sign-in, two-step sign-in, fraud and abuse checks, audit logs. Basis: legitimate interest and legal obligation.</li>
          <li><strong>To send service emails</strong>: invitations, password resets, approvals, reminders and payslip notices. These are part of the service; we do not send marketing from inside the app.</li>
          <li><strong>To support you and run our business</strong>: answering messages, billing, and meeting legal, tax and accounting duties.</li>
        </ul>
      </Clause>

      <Clause id="share" title="4. Who we share it with">
        <p>We use a small number of providers to run {SITE.name}. Each processes data only for us and under a written agreement:</p>
        <ul>
          <li>Vercel, which hosts this website and the app&apos;s pages.</li>
          <li>Our server and database hosting provider, which runs the application and stores its database.</li>
          <li>Cloudflare, whose R2 service stores uploaded files such as photos, documents, receipts and payslips.</li>
          <li>Mailjet, which delivers the service&apos;s emails.</li>
          <li>Groq, which drafts text when you ask for writing help, such as a job description. Only the job title and the notes you typed are sent, never records about people.</li>
          <li>Namecheap, which hosts our support mailbox.</li>
        </ul>
        <p>
          Some of these providers process data outside Nigeria. Where they do, we rely on the safeguards the NDPA allows,
          such as contractual protections, and we choose providers with recognised security standards.
        </p>
        <p>
          We disclose data to authorities only when the law requires it, and we tell the affected company when we are
          allowed to.
        </p>
      </Clause>

      <Clause id="security" title="5. How we protect it">
        <ul>
          <li>All traffic is encrypted with HTTPS.</li>
          <li>Bank account numbers, national IDs, tax IDs, pension IDs and two-step sign-in secrets are encrypted again inside the database.</li>
          <li>Each company&apos;s data is kept apart from every other company&apos;s, and the database itself enforces that separation.</li>
          <li>Access inside a company follows its access levels; people see only what their role allows.</li>
          <li>Two-step sign-in is available to every user, and every change to a record is written to an audit log.</li>
          <li>Uploaded files are private and are only served through short-lived links to signed-in users who may see them.</li>
        </ul>
        <p>If a breach puts personal data at risk, we will tell the affected companies and the regulator as the NDPA requires.</p>
      </Clause>

      <Clause id="keep" title="6. How long we keep it">
        <ul>
          <li>While a company uses {SITE.name}, we keep its data for as long as the company keeps it in the app. The company decides when records are removed.</li>
          <li>A company&apos;s owner can download all of its data, as a ZIP of spreadsheets, files and payslips, at any time from Settings.</li>
          <li>When a company closes its account, it has 30 days of read-only access to download its data. The account is then closed and hidden, and is deleted permanently one year later. The owner is emailed before deletion.</li>
          <li>Backups are kept for up to 35 days, so deleted data disappears from backups within 35 days after it is deleted from the live system.</li>
        </ul>
      </Clause>

      <Clause id="rights" title="7. Your rights">
        <p>Under the NDPA you can ask to:</p>
        <ul>
          <li>be told what personal data is held about you, and get a copy;</li>
          <li>have wrong or incomplete data corrected;</li>
          <li>have data deleted, or its use restricted, where the law allows;</li>
          <li>receive your data in a common format, or have it sent to another provider;</li>
          <li>object to processing based on legitimate interest, and withdraw any consent you gave.</li>
        </ul>
        <p>
          For data in an employer&apos;s account, ask the employer; for anything else, write to {mail}. We answer within 30
          days. If you are not satisfied, you may complain to the Nigeria Data Protection Commission (ndpc.gov.ng).
        </p>
      </Clause>

      <Clause id="cookies" title="8. Cookies">
        <p>
          We use only the cookies the service needs to work: one that keeps you signed in (it expires after 12 hours) and
          one that protects forms against cross-site request forgery. We use no advertising, analytics or tracking cookies,
          so there is nothing to opt out of.
        </p>
      </Clause>

      <Clause id="children" title="9. Children">
        <p>{SITE.name} is a workplace tool for adults. It is not meant for children, and we do not knowingly collect children&apos;s personal data.</p>
      </Clause>

      <Clause id="changes" title="10. Changes and contact">
        <p>
          If we change this policy we will update the date at the top, and tell company owners by email before an important
          change takes effect.
        </p>
        <p>Questions or requests: {SITE.legalName}, {SITE.location}, {mail}.</p>
      </Clause>
    </LegalPage>
  );
}
