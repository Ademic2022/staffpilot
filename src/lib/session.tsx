"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Provider, useQuery } from "urql";

import { graphql } from "@/gql";
import type { MeQuery } from "@/gql/graphql";

import { makeClient } from "./api";
import { setFormatPrefs } from "./format";

export const MeDocument = graphql(`
  query Me {
    me {
      permissions
      roles
      user { id email fullName }
      employee { id fullName jobTitle { name } }
      hasPayslips
      mfaEnabled mfaSetupRequired recoveryCodesLeft
      viewingAs { name realName startedAt }
    }
    tenant {
      name slug primaryColor country currency logoUrl
      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn
    }
  }
`);

export type Me = NonNullable<MeQuery["me"]>;
export type Tenant = NonNullable<MeQuery["tenant"]>;

interface SessionValue {
  loading: boolean;
  me: Me | null;
  tenant: Tenant | null;
  can: (...perms: string[]) => boolean;
  /** Throw away cached data and load the session again (after sign-in or sign-out). */
  reset: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const noop = () => () => {};

/** False during server rendering and hydration, true afterwards. Queries wait for it. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function SessionState({ children, reset }: { children: ReactNode; reset: () => void }) {
  const mounted = useMounted();
  const [{ data, fetching, error }] = useQuery({ query: MeDocument, pause: !mounted });
  const value = useMemo<SessionValue>(() => {
    const me = data?.me ?? null;
    // The company's date and money style (General settings) applies to every formatted value from here on.
    if (data?.tenant) setFormatPrefs({ dateFormat: data.tenant.dateFormat, showCurrencyCode: data.tenant.showCurrencyCode });
    const granted = new Set(me?.permissions ?? []);
    return {
      loading: !mounted || (fetching && !data && !error),
      me,
      tenant: data?.tenant ?? null,
      can: (...perms) => perms.some((p) => granted.has(p)),
      reset,
    };
  }, [data, fetching, error, mounted, reset]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState(makeClient);
  const reset = useCallback(() => setClient(makeClient()), []);
  return (
    <Provider value={client}>
      <SessionState reset={reset}>{children}</SessionState>
    </Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
