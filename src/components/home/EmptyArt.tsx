/**
 * Small drawings for empty home widgets. Drawn in the company's colour (--brand) at low
 * strength, so they suit every brand and both light and dark mode. Decorative only.
 */
export type ArtKind = "feed" | "cake" | "sun" | "calendar" | "people" | "links";

const tint = (alpha: number) => `color-mix(in srgb, var(--brand) ${alpha}%, transparent)`;

export function EmptyArt({ kind, className }: { kind: ArtKind; className?: string }) {
  const soft = tint(12), mid = tint(28), strong = "var(--brand-ink)";
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="60" cy="80" rx="42" ry="5" fill={soft} />
      {kind === "feed" && <>
        <rect x="22" y="16" width="64" height="48" rx="8" fill={soft} />
        <rect x="31" y="26" width="30" height="5" rx="2.5" fill={mid} />
        <rect x="31" y="36" width="44" height="4" rx="2" fill={mid} opacity=".6" />
        <rect x="31" y="45" width="36" height="4" rx="2" fill={mid} opacity=".6" />
        <path d="M78 52l14-8v24l-14-8z" fill={mid} stroke={strong} strokeWidth="2" />
        <rect x="70" y="52" width="8" height="8" rx="2" fill={strong} />
        <path d="M97 50c2 2 2 8 0 10M101 46c4 4 4 14 0 18" stroke={strong} strokeWidth="2" />
      </>}
      {kind === "cake" && <>
        <rect x="34" y="46" width="52" height="26" rx="5" fill={mid} />
        <rect x="40" y="32" width="40" height="16" rx="4" fill={soft} stroke={strong} strokeWidth="2" />
        <path d="M34 56c6 4 9-4 13 0s8 4 13 0 8 4 13 0 8-4 13 0" stroke={strong} strokeWidth="2" />
        {[50, 60, 70].map((x) => <g key={x}><path d={`M${x} 32v-8`} stroke={strong} strokeWidth="2" /><path d={`M${x} 14c3 4 3 6 0 8-3-2-3-4 0-8z`} fill={strong} /></g>)}
        <circle cx="22" cy="24" r="2.5" fill={mid} /><circle cx="98" cy="18" r="2" fill={strong} /><path d="M100 40l4 4M104 40l-4 4" stroke={mid} strokeWidth="2" /><path d="M16 46h6M19 43v6" stroke={strong} strokeWidth="2" />
      </>}
      {kind === "sun" && <>
        <circle cx="60" cy="40" r="15" fill={mid} stroke={strong} strokeWidth="2" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4, r1 = 22, r2 = 30;
          return <path key={i} d={`M${60 + r1 * Math.cos(a)} ${40 + r1 * Math.sin(a)}L${60 + r2 * Math.cos(a)} ${40 + r2 * Math.sin(a)}`} stroke={strong} strokeWidth="2.5" />;
        })}
        <path d="M54 42c2 3 10 3 12 0" stroke={strong} strokeWidth="2" />
        <circle cx="55" cy="37" r="1.5" fill={strong} /><circle cx="65" cy="37" r="1.5" fill={strong} />
      </>}
      {kind === "calendar" && <>
        <rect x="30" y="20" width="60" height="52" rx="7" fill={soft} stroke={strong} strokeWidth="2" />
        <path d="M30 34h60" stroke={strong} strokeWidth="2" /><path d="M44 14v12M76 14v12" stroke={strong} strokeWidth="2.5" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={38 + c * 12} y={41 + r * 9} width="7" height="5" rx="1.5" fill={r === 1 && c === 2 ? strong : mid} />))}
      </>}
      {kind === "people" && <>
        <circle cx="44" cy="34" r="10" fill={mid} /><path d="M26 70c0-12 8-20 18-20s18 8 18 20" fill={mid} />
        <circle cx="76" cy="30" r="12" fill={soft} stroke={strong} strokeWidth="2" /><path d="M54 72c0-14 10-24 22-24s22 10 22 24" fill={soft} stroke={strong} strokeWidth="2" />
      </>}
      {kind === "links" && <>
        <rect x="24" y="36" width="36" height="18" rx="9" fill={soft} stroke={strong} strokeWidth="2" transform="rotate(-20 42 45)" />
        <rect x="58" y="30" width="36" height="18" rx="9" fill={mid} stroke={strong} strokeWidth="2" transform="rotate(-20 76 39)" />
      </>}
    </svg>
  );
}
