import type { Metadata } from "next";
import Link from "next/link";

import { Clause, LegalPage } from "@/components/landing/Legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Terms of service · ${SITE.name}` },
  description: `The terms for using ${SITE.name}, HR and payroll software run by ${SITE.legalName}.`,
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const UPDATED = "4 November 2026";

export default function TermsPage() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage eyebrow="Legal" title="Terms of service" updated={UPDATED} intro={<p>
      These terms are an agreement between {SITE.legalName} ({SITE.location}), which runs {SITE.name}, and the company that
      signs up (&quot;you&quot;). By creating a company account or using {SITE.name}, you agree to them.
    </p>}>
      <Clause id="service" title="1. The service">
        <p>
          {SITE.name} is online software for employee records, leave, payroll, attendance, performance reviews and expense
          claims. We may improve, add or change features over time; we will tell you in advance before removing a feature
          you rely on.
        </p>
      </Clause>

      <Clause id="accounts" title="2. Your account">
        <ul>
          <li>The person who signs up must be allowed to act for the company, and becomes its first owner.</li>
          <li>You decide who in your company gets access and at what level, and you are responsible for what they do in the account.</li>
          <li>Keep passwords private, and turn on two-step sign-in for anyone who can see pay or personal data.</li>
          <li>Tell us at {mail} straight away if you think someone has got into your account.</li>
        </ul>
      </Clause>

      <Clause id="data" title="3. Your data">
        <p>
          The data you put into {SITE.name} belongs to you. We use it only to provide the service, as described in our{" "}
          <Link href="/privacy">privacy policy</Link>. For your employees&apos; personal data you are the data controller and we
          are your data processor under the Nigeria Data Protection Act 2023: you are responsible for having a lawful basis
          to record it and for telling your employees how it is used.
        </p>
        <p>You can download all of your data at any time from Settings.</p>
      </Clause>

      <Clause id="payroll" title="4. Payroll and tax figures">
        <p>
          {SITE.name} calculates pay, PAYE, pension, NHF and other deductions from the rules and the figures you enter. You
          remain responsible for checking each pay run before you approve it, for paying staff, and for filing and paying
          taxes and contributions to the authorities. {SITE.name} is not tax, legal or financial advice.
        </p>
      </Clause>

      <Clause id="use" title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use the service for anything unlawful, or to store data you have no right to hold;</li>
          <li>try to get into another company&apos;s account or data, or test our security without written permission;</li>
          <li>disrupt the service, overload it, or copy, resell or reverse engineer it;</li>
          <li>use its emails to send spam or anything other than workplace messages.</li>
        </ul>
        <p>We may suspend an account that breaks these rules or puts other customers at risk, and will tell you why.</p>
      </Clause>

      <Clause id="fees" title="6. Fees">
        <p>
          Any fees, and what they include, are shown before you are asked to pay. We will give at least 30 days&apos; notice
          by email before a price change applies to you.
        </p>
      </Clause>

      <Clause id="availability" title="7. Availability">
        <p>
          We work to keep {SITE.name} available and your data safe, with regular backups. The service may sometimes be
          unavailable for maintenance or for reasons outside our control, and is provided without a guarantee that it
          will always be uninterrupted or error-free.
        </p>
      </Clause>

      <Clause id="leaving" title="8. Closing your account">
        <p>
          An owner can close the company account at any time from Settings. The account then stays read-only for 30 days
          so you can download your data, then closes, and is deleted permanently one year later. We may close an account
          that breaks these terms, after giving notice where the law and the situation allow.
        </p>
      </Clause>

      <Clause id="liability" title="9. Liability">
        <p>
          As far as the law allows, {SITE.legalName} is not liable for indirect or consequential losses, such as lost
          profits or penalties caused by figures you approved, and our total liability for any claim is limited to the
          fees you paid us in the 12 months before it. Nothing in these terms limits liability that cannot be limited by
          law.
        </p>
      </Clause>

      <Clause id="law" title="10. Law, changes and contact">
        <p>These terms are governed by the laws of the Federal Republic of Nigeria, and disputes go to the Nigerian courts.</p>
        <p>
          If we change these terms we will update the date at the top and email company owners before an important change
          takes effect. Using {SITE.name} after that date means you accept the new terms.
        </p>
        <p>Questions: {SITE.legalName}, {SITE.location}, {mail}.</p>
      </Clause>
    </LegalPage>
  );
}
