import type { Metadata } from "next";

import { BASE_DOMAIN } from "@/lib/hosts";
import { SITE } from "@/lib/site";

import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: { absolute: `Set up your company | ${SITE.name}` },
  description: `Start using ${SITE.name} in minutes: add your company, import your people from Excel and invite your team.`,
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
};

export default function SignUpPage() {
  const suffix = BASE_DOMAIN === "localhost" ? ".localhost:3000" : `.${BASE_DOMAIN}`;
  return <SignUpForm addressSuffix={suffix} />;
}
