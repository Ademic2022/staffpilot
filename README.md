# hrms-client

Next.js (App Router) + TypeScript web app for the HRMS. Talks to `../hrms-server` over
GraphQL with [urql](https://commerce.nearform.com/open-source/urql/).

## Run locally

Start the API first (see `../hrms-server/README.md`), then:

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://acme.localhost:3000 (the subdomain picks the tenant). Next.js forwards
`/graphql` and `/api/*` to Django, so the browser only ever talks to one origin.

## GraphQL types

Types and typed documents in `src/gql/` are generated from the server's `schema.graphql`.
After the API changes:

```sh
npm run schema    # copies ../hrms-server/schema.graphql and runs codegen
```

Write queries with `graphql(\`...\`)` from `@/gql`; never hand-write API types.

## Checks

```sh
npm run lint
npm run typecheck
npm test
```

## Notes

- Permission checks in the UI (`useSession().can(...)`) only shape what is shown. The API
  enforces every rule.
- `src/proxy.ts` sends visitors without a session cookie to `/login`.

## Where things are

| Path | Page |
|---|---|
| `/home` | Widget home page (customizable per person) |
| `/employees` | People: List (filters, saved views, power edit), Directory, Org chart |
| `/employees/[id]` | Profile with customizable tabs; snapshot panel opens from anywhere |
| `/leave`, `/leave/approvals`, `/leave/calendar` | Time off, approvals inbox (leave plus pay/job changes), calendar |
| `/reports` | Recent, standard and custom reports |
| `/payroll`, `/payroll/runs/[id]` | Pay runs, payroll people, loans and advances |
| `/payslips` | My payslips and loans |
| `/attendance` | My time (clock in and out), weekly timesheet, team board and timesheets, overtime and timesheet approvals |
| `/performance`, `/performance/reviews/[id]`, `/performance/cycles/[id]` | Goals, reviews, feedback, one-to-ones; HR review cycles and calibration |
| `/expenses`, `/expenses/[id]` | Expense claims, approvals, finance payments and exports |
| `/help`, `/help/[slug]` | The in-app user guide (articles in `src/help/articles/`); the ? button beside the bell opens the article for the current page |
| `/files` | Company files and (for HR) employee documents |
| `/settings/*` | Company, users and access levels, approvals, email alerts, directory, job organization, employee fields, time off, benefits, onboarding, training, payroll, attendance, performance, expenses, audit log |
| `/account` | Password, two-step sign-in, calendar links |

Settings areas and their sections are listed in `src/components/settings/areas.ts`.
