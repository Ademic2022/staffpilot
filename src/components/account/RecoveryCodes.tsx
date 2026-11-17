"use client";

import { Button, Notice } from "@/components/ui";

/** Recovery codes, shown once: copy, download, then confirm they are saved. */
export function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const text = codes.join("\n");
  return (
    <div className="space-y-4">
      <Notice tone="warning" title="Save these recovery codes now">
        Each code signs you in once if you lose your phone or passkey. They will not be shown again.
      </Notice>
      <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-subtle/60 p-4 font-mono text-sm sm:grid-cols-5">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(text)}>Copy</Button>
        <a className="inline-flex h-10 items-center rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink shadow-sm hover:bg-subtle"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text + "\n")}`} download="recovery-codes.txt">Download</a>
        <Button onClick={onDone}>I have saved them</Button>
      </div>
    </div>
  );
}
