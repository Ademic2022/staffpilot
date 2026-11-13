"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "urql";

import { IconBell, IconDownload, IconPhone } from "@/components/icons";
import { Badge, Button, Card, ErrorNote } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import {
  canPromptInstall, currentPushSubscription, isInstalled, isIos, onPwaChange, promptInstall, pushSupported, pwaVersion, subscribePush,
} from "@/lib/pwa";
import { useMounted } from "@/lib/session";

const PushKeyDocument = graphql(`query PushPublicKey { pushPublicKey }`);
const SavePushDocument = graphql(`
  mutation SavePushSubscription($endpoint: String!, $p256dh: String!, $auth: String!, $userAgent: String!) {
    savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth, userAgent: $userAgent)
  }
`);
const RemovePushDocument = graphql(`mutation RemovePushSubscription($endpoint: String!) { removePushSubscription(endpoint: $endpoint) }`);

/** True once in the browser (window-only checks), re-rendering when the install prompt arrives or is used. */
function usePwa() {
  useSyncExternalStore(onPwaChange, pwaVersion, () => 0);
  return useMounted();
}

/** On "Your account": install StaffPilot on this device, and turn its push notifications on or off. */
export function ThisDevice() {
  const ready = usePwa();
  const [{ data }] = useQuery({ query: PushKeyDocument });
  const [, save] = useMutation(SavePushDocument);
  const [, remove] = useMutation(RemovePushDocument);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    if (!pushSupported()) return;
    void currentPushSubscription().then((s) => setEndpoint(s?.endpoint ?? null));
  }, []);

  async function turnOn() {
    if (!data?.pushPublicKey) return;
    setBusy(true);
    setProblem(undefined);
    try {
      const sub = await subscribePush(data.pushPublicKey);
      if (typeof sub === "string") return setProblem(sub);
      const r = await save({ ...sub, userAgent: navigator.userAgent.slice(0, 300) });
      if (r.error) return setProblem(errorMessage(r.error));
      setEndpoint(sub.endpoint);
    } catch {
      setProblem("Notifications could not be turned on in this browser.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    const sub = await currentPushSubscription();
    if (sub) {
      await remove({ endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    setEndpoint(null);
    setBusy(false);
  }

  if (!ready) return null;
  const installed = isInstalled();
  const pushOn = data?.pushPublicKey && pushSupported();
  return (
    <Card title={<span className="flex items-center gap-2"><IconPhone size={15} className="text-muted" />This device</span>}>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-ink">StaffPilot app</p>
            {installed && <Badge tone="good" dot>Installed</Badge>}
          </div>
          {installed ? (
            <p className="mt-1 text-sm text-muted">You opened StaffPilot from its icon. It works like any other app.</p>
          ) : canPromptInstall() ? (
            <>
              <p className="mt-1 text-sm text-muted">Add StaffPilot to your home screen to open it in one tap, full screen.</p>
              <Button size="sm" className="mt-3" icon={<IconDownload size={15} />} onClick={() => void promptInstall()}>Install app</Button>
            </>
          ) : isIos() ? (
            <p className="mt-1 text-sm text-muted">In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Open StaffPilot from that icon to get notifications too.</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Use your browser&apos;s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          )}
        </div>

        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-medium text-ink"><IconBell size={15} className="text-muted" />Notifications on this device</p>
            {endpoint && <Badge tone="good" dot>On</Badge>}
          </div>
          {!data ? null : !pushOn ? (
            <p className="mt-1 text-sm text-muted">
              {!data.pushPublicKey ? "Not available yet." : isIos() && !installed
                ? "On iPhone, add StaffPilot to your Home Screen first, then turn notifications on from the app."
                : "This browser cannot show notifications."}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                Leave approvals, payslips and everything else under the bell, even when StaffPilot is closed. Only on this device.
              </p>
              {problem && <div className="mt-3"><ErrorNote error={problem} /></div>}
              <Button size="sm" variant={endpoint ? "secondary" : "primary"} className="mt-3" busy={busy}
                onClick={() => void (endpoint ? turnOff() : turnOn())}>
                {endpoint ? "Turn off" : "Turn on notifications"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

const DISMISS_KEY = "staffpilot:install-dismissed";

/** On a phone, not installed, and not put off in the last 30 days. */
function wanted() {
  let dismissed = 0;
  try { dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0); } catch { /* private mode */ }
  return window.matchMedia("(max-width: 767px)").matches && !isInstalled() && Date.now() - dismissed > 30 * 24 * 3600 * 1000;
}

/**
 * On a phone, a one-line offer to install StaffPilot, until it is installed or dismissed (for
 * 30 days). Android shows the browser's install dialog; iPhone says how to add it.
 */
export function InstallBanner() {
  const ready = usePwa();
  const [closed, setHidden] = useState(false);
  if (!ready || closed || !(canPromptInstall() || isIos()) || !wanted()) return null;
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    setHidden(true);
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-10 w-10 flex-none rounded-xl" />
      <p className="min-w-0 flex-1 text-sm text-ink">
        {canPromptInstall() ? "Get the StaffPilot app on your phone." : <>Add StaffPilot to your Home Screen: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</>}
      </p>
      {canPromptInstall() && <Button size="sm" onClick={() => void promptInstall().then((ok) => ok && setHidden(true))}>Install</Button>}
      <button type="button" onClick={dismiss} className="text-sm text-muted hover:text-ink" aria-label="Not now">Not now</button>
    </div>
  );
}
