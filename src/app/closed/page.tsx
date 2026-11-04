import type { Metadata } from "next";
import Image from "next/image";

import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Account closed" };

/** Shown on a company's address after it closed its StaffPilot account and its data was deleted. */
export default function ClosedPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <Image src={SITE.logo} alt={SITE.name} width={72} height={69} className="mx-auto mb-6" />
        <h1 className="font-display text-2xl font-medium text-ink">This account has closed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The company that used this address closed its {SITE.name} account, so nobody can sign in here any more.
          If you worked there and need a copy of your records, such as payslips, please ask the company directly.
        </p>
      </div>
    </main>
  );
}
