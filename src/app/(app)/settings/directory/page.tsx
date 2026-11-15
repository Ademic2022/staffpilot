"use client";

import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { SettingsIntro } from "@/components/settings/Intro";
import { Button, Checkbox, ErrorNote, Loading, Notice } from "@/components/ui";
import { graphql } from "@/gql";
import type { DirectorySettingsAdminQuery } from "@/gql/graphql";
import { errorMessage } from "@/lib/api";

const SettingsDocument = graphql(`
  query DirectorySettingsAdmin {
    directorySettings { directory orgChart roles fields }
    directoryFieldChoices { key label }
    roles { code name }
  }
`);

const SaveDocument = graphql(`
  mutation SaveDirectorySettings($settings: JSON!) {
    saveDirectorySettings(settings: $settings) { directory }
  }
`);

function Form({ data }: { data: DirectorySettingsAdminQuery }) {
  const s = data.directorySettings;
  const [directory, setDirectory] = useState(s.directory);
  const [orgChart, setOrgChart] = useState(s.orgChart);
  const [roles, setRoles] = useState<string[]>(s.roles);
  const [fields, setFields] = useState<string[]>(s.fields);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [{ fetching }, save] = useMutation(SaveDocument);
  const toggle = (list: string[], set: (v: string[]) => void, key: string) => set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  return (
    <div className="space-y-6">
      {message && (message.ok ? <Notice tone="success">{message.text}</Notice> : <ErrorNote error={message.text} />)}
      <section className="space-y-3">
        <Checkbox label="Company directory" description="Everyone can find colleagues' work details." checked={directory} onChange={setDirectory} />
        <Checkbox label="Org chart" description="A map of who reports to whom." checked={orgChart} onChange={setOrgChart} />
      </section>
      <section>
        <h3 className="text-[15px] font-semibold text-ink">Who sees them</h3>
        <p className="mb-2 text-sm text-muted">Tick none for everyone. People who can view employee records always see both.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.roles.map((r) => <Checkbox key={r.code} label={r.name} checked={roles.includes(r.code)} onChange={() => toggle(roles, setRoles, r.code)} />)}
        </div>
      </section>
      <section>
        <h3 className="text-[15px] font-semibold text-ink">What they show</h3>
        <p className="mb-2 text-sm text-muted">Names, photos and job titles always show. These settings come before access levels for the directory.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.directoryFieldChoices.map((f) => <Checkbox key={f.key} label={f.label} checked={fields.includes(f.key)} onChange={() => toggle(fields, setFields, f.key)} />)}
        </div>
      </section>
      <div className="flex justify-end">
        <Button busy={fetching} onClick={async () => {
          const r = await save({ settings: { directory, org_chart: orgChart, roles, fields } });
          setMessage(r.error ? { ok: false, text: errorMessage(r.error) ?? "" } : { ok: true, text: "Directory settings saved." });
        }}>Save</Button>
      </div>
    </div>
  );
}

export default function DirectorySettingsPage() {
  const [{ data, error }] = useQuery({ query: SettingsDocument });
  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="form" />;
  return (
    <>
      <SettingsIntro>Whether people see the directory and org chart, and which work details they show.</SettingsIntro>
      <Form data={data} />
    </>
  );
}
