import { useMemo } from "react";
import { useQuery } from "urql";

import { graphql } from "@/gql";
import type { PeopleOrgQuery } from "@/gql/graphql";

/** Everyone at work here, with work details only: the directory and the org chart share this. */
const PeopleOrgDocument = graphql(`
  query PeopleOrg {
    orgChart {
      id fullName jobTitle departmentId department locationId location legalEntityId legalEntity place timezone
      workEmail workPhone workPhoneExt photoUrl managerId managerName directReportCount outUntil employeeNumber hireDate foundingMember mobile linkedinUrl twitter facebook
    }
  }
`);

export type OrgPerson = PeopleOrgQuery["orgChart"][number];

export function useOrgPeople() {
  const [{ data, error }] = useQuery({ query: PeopleOrgDocument });
  const people = useMemo(() => data?.orgChart ?? [], [data]);
  const tree = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]));
    const children = new Map<string, OrgPerson[]>();
    const roots: OrgPerson[] = [];
    for (const p of people) {
      // Someone whose manager has left (or is not listed) starts a tree of their own.
      if (p.managerId && byId.has(p.managerId)) children.set(p.managerId, [...(children.get(p.managerId) ?? []), p]);
      else roots.push(p);
    }
    roots.sort((a, b) => b.directReportCount - a.directReportCount || a.fullName.localeCompare(b.fullName));
    return { byId, children, roots };
  }, [people]);
  return { people, ...tree, loaded: Boolean(data), error };
}

/** The time where they work, such as "3:42 PM", or null when their location has no time zone. */
export function localTime(timezone: string | null | undefined, now = new Date()) {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(now);
  } catch {
    return null;
  }
}

export const outLabel = (until: string) =>
  `Out until ${new Date(`${until}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
