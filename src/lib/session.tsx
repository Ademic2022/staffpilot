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
      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads showTenure attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn
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

function SessionState({ children, reset, version }: { children: ReactNode; reset: () => void; version: number }) {
  const mounted = useMounted();
  // Each answer is tagged with the session version that asked for it. After signing in the hook
  // still holds the "signed out" answer until the new one comes: that is "loading", never "signed
  // out" (which would send someone who has just signed in back to the sign-in page).
  const context = useMemo(() => ({ sessionVersion: version }), [version]);
  const [{ data, error, operation }] = useQuery({ query: MeDocument, pause: !mounted, context });
  const current = operation?.context.sessionVersion === version;
  const value = useMemo<SessionValue>(() => {
    // An older answer still stands if it says someone is signed in (settings saved, cache refreshed:
    // no flicker). An older "signed out" does not: it is waiting for the answer after signing in.
    const fresh = current || data?.me ? data : undefined;
    const me = fresh?.me ?? null;
    // The company's date and money style (General settings) applies to every formatted value from here on.
    if (fresh?.tenant) setFormatPrefs({ dateFormat: fresh.tenant.dateFormat, showCurrencyCode: fresh.tenant.showCurrencyCode });
    const granted = new Set(me?.permissions ?? []);
    return {
      loading: !mounted || (!fresh && !(current && error)),
      me,
      tenant: fresh?.tenant ?? null,
      can: (...perms) => perms.some((p) => granted.has(p)),
      reset,
    };
  }, [data, error, current, mounted, reset]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // A new client after signing in or out, so nothing cached from the other person is shown.
  // The app is not remounted: that would wipe pages mid-way and could cancel the move to Home.
  const [{ client, version }, setSession] = useState(() => ({ client: makeClient(), version: 0 }));
  const reset = useCallback(() => setSession((s) => ({ client: makeClient(), version: s.version + 1 })), []);
  return (
    <Provider value={client}>
      <SessionState reset={reset} version={version}>{children}</SessionState>
    </Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
