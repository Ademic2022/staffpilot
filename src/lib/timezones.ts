/**
 * Time zones offered for the company and its locations. StaffPilot serves Nigeria, which has one
 * zone; add more here as it expands (IANA names, which the API checks against its own list).
 */

export const ZONES = ["Africa/Lagos"];

/** "Africa/Lagos (GMT+1)": the name with its current offset. */
export function zoneLabel(zone: string) {
  try {
    const offset = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    return `${zone.replace(/_/g, " ")}${offset ? ` (${offset})` : ""}`;
  } catch {
    return zone;
  }
}

/** The zones to offer, plus `keep` when a record already has another one, so its value still shows. */
export function zoneChoices(keep?: string) {
  return keep && !ZONES.includes(keep) ? [...ZONES, keep] : ZONES;
}
