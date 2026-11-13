"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";

import { Button, ErrorNote } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";

const ClockDocument = graphql(`
  query MyClock {
    myAttendance(days: 1) { enabled shift shiftStart shiftEnd geofenced clockedIn { id clockIn } }
  }
`);
const PillClockInDocument = graphql(`
  mutation PillClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }
`);
const PillClockOutDocument = graphql(`
  mutation PillClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }
`);

/** Where the person is, if the browser will say, for companies that check location at clock-in. */
export function where(): Promise<{ lat: string; lng: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition((p) => resolve({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }),
      () => resolve(null), { enableHighAccuracy: true, timeout: 10000 });
  });
}

const clockTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

function useMinutesSince(iso?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [iso]);
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0;
}

/**
 * Clock status at a glance, with clocking in and out one click away. Shown only when the
 * company uses attendance and the person has an employee record.
 */
export function ClockPill() {
  const [{ data }, reload] = useQuery({ query: ClockDocument, requestPolicy: "cache-and-network" });
  const [, clockIn] = useMutation(PillClockInDocument);
  const [, clockOut] = useMutation(PillClockOutDocument);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const box = useRef<HTMLDivElement>(null);
  const me = data?.myAttendance;
  const since = me?.clockedIn?.clockIn;
  const minutes = useMinutesSince(since);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, [open]);

  if (!me?.enabled) return null;
  const elapsed = `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

  async function toggle() {
    setBusy(true);
    setProblem(undefined);
    const place = await where();
    const vars = { lat: place?.lat ?? null, lng: place?.lng ?? null };
    const r = since ? await clockOut(vars) : await clockIn(vars);
    const payload = r.data && ("clockIn" in r.data ? r.data.clockIn : r.data.clockOut);
    const failure = errorMessage(r.error) ?? payload?.errors[0]?.message;
    setBusy(false);
    if (failure) return setProblem(failure);
    setOpen(false);
    reload({ requestPolicy: "network-only" });
  }

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[15px] font-medium text-ink hover:bg-subtle">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          {since && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${since ? "bg-emerald-500" : "bg-slate-400"}`} />
        </span>
        {since ? <>Clocked in <span className="tabular-nums text-muted">· {elapsed}</span></> : "Not clocked in"}
      </button>
      {open && (
        <div role="dialog" aria-label="Clock in and out"
          className="absolute left-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 shadow-lg sm:left-auto sm:right-0">
          <p className="text-sm text-muted">{me.shiftStart ? `Today: ${me.shift}, ${me.shiftStart} – ${me.shiftEnd}` : "Not a working day for you"}</p>
          <p className="mt-1 text-[17px] font-semibold text-ink">
            {since ? `In since ${clockTime(since)} · ${elapsed}` : "You are clocked out"}
          </p>
          {me.geofenced && <p className="mt-1 text-xs text-muted">Your location is checked when you clock {since ? "out" : "in"}.</p>}
          {problem && <div className="mt-3"><ErrorNote error={problem} /></div>}
          <Button busy={busy} className="mt-4 w-full" variant={since ? "secondary" : "primary"} onClick={toggle}>
            {since ? "Clock out" : "Clock in"}
          </Button>
          <Link href="/attendance" onClick={() => setOpen(false)} className="mt-3 block text-center text-sm font-medium text-brand-ink hover:underline">
            My time and timesheet
          </Link>
        </div>
      )}
    </div>
  );
}
