"use client";

import type { SelectHTMLAttributes } from "react";

import { Select } from "@/components/ui";
import { zoneChoices, zoneLabel } from "@/lib/timezones";

/** A time zone picked from the supported ones (src/lib/timezones.ts). `empty` adds a blank first choice. */
export function TimeZoneSelect({ value, empty, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { value: string; empty?: string }) {
  return (
    <Select value={value} {...props}>
      {empty !== undefined && <option value="">{empty}</option>}
      {zoneChoices(value || undefined).map((z) => <option key={z} value={z}>{zoneLabel(z)}</option>)}
    </Select>
  );
}
