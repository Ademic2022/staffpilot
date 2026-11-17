"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Field, Input, Select } from "@/components/ui";
import { graphql } from "@/gql";

const BanksDocument = graphql(`
  query Banks { banks }
`);

const LookUpDocument = graphql(`
  mutation LookUpBankAccount($bank: String!, $number: String!) {
    lookUpBankAccount(bankName: $bank, accountNumber: $number) { available accountName message }
  }
`);

type Key = "bankName" | "bankAccountNumber" | "bankAccountName";

/**
 * Bank, account number and account name. When bank checks are set up (Paystack), the bank is
 * picked from the list and the name comes from the bank itself once the ten digits are in; the
 * server checks again on save, so the name shown is the one payroll pays to.
 */
export function BankFields({ values, onChange, errors, numberHint }: {
  values: Record<Key, string>; onChange: (key: Key, value: string) => void; errors: Record<string, string>; numberHint?: string;
}) {
  const [{ data }] = useQuery({ query: BanksDocument });
  const [, lookUp] = useMutation(LookUpDocument);
  // The bank's answer, for the bank and number it was about: a new bank or number starts over.
  const [answer, setAnswer] = useState<{ key: string; name?: string; problem?: string } | null>(null);
  const banks = data?.banks ?? [];
  const listed = banks.length > 0;
  const number = values.bankAccountNumber.replace(/\s/g, "");
  const key = `${values.bankName}|${number}`;
  const wanted = listed && Boolean(values.bankName) && /^\d{10}$/.test(number);
  const found = answer?.key === key ? answer : null;
  const checking = wanted && !found;

  useEffect(() => {
    if (!wanted) return;
    let current = true;
    const timer = setTimeout(async () => {
      const r = await lookUp({ bank: values.bankName, number });
      if (!current) return;
      const reply = r.data?.lookUpBankAccount;
      if (r.error) return setAnswer({ key, problem: r.error.graphQLErrors[0]?.message ?? "The bank could not be reached. You can still save." });
      if (!reply?.available) return setAnswer({ key });
      if (reply.accountName) {
        setAnswer({ key, name: reply.accountName });
        onChange("bankAccountName", reply.accountName);
      } else setAnswer({ key, problem: reply.message ?? "The bank does not know this number." });
    }, 400);
    return () => { current = false; clearTimeout(timer); };
    // onChange is a fresh function each render; the lookup depends only on the bank and number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, key, lookUp]);

  const options = listed && values.bankName && !banks.includes(values.bankName) ? [values.bankName, ...banks] : banks;
  return (
    <>
      <Field label="Bank" error={errors.bankName}>
        {listed ? (
          <Select value={values.bankName} aria-invalid={!!errors.bankName} onChange={(e) => onChange("bankName", e.target.value)}>
            <option value="">Choose the bank</option>
            {options.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        ) : (
          <Input value={values.bankName} aria-invalid={!!errors.bankName} autoComplete="off" onChange={(e) => onChange("bankName", e.target.value)} />
        )}
      </Field>
      <Field label="Account number" error={errors.bankAccountNumber ?? found?.problem}
        hint={checking ? "Checking with the bank…" : numberHint}>
        <Input value={values.bankAccountNumber} inputMode="numeric" maxLength={listed ? 10 : 34} autoComplete="off"
          aria-invalid={!!(errors.bankAccountNumber ?? found?.problem)} onChange={(e) => onChange("bankAccountNumber", e.target.value)} />
      </Field>
      <Field label="Account name" error={errors.bankAccountName}
        hint={found?.name ? "Confirmed by the bank." : undefined}>
        <Input value={values.bankAccountName} readOnly={Boolean(found?.name)} autoComplete="off" aria-invalid={!!errors.bankAccountName}
          onChange={(e) => onChange("bankAccountName", e.target.value)} />
      </Field>
    </>
  );
}
