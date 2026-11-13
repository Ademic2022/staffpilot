/** Inline icon set on a 20px grid with a 1.6 stroke, so every icon matches. */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => <Icon {...p}><path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" /></Icon>;
export const IconUsers = (p: IconProps) => <Icon {...p}><circle cx="7.5" cy="7" r="2.75" /><path d="M2.5 16c.4-2.6 2.4-4.3 5-4.3s4.6 1.7 5 4.3" /><path d="M13 4.6a2.6 2.6 0 0 1 0 4.9M14.6 11.9c1.6.5 2.6 1.9 2.9 4.1" /></Icon>;
export const IconChild = (p: IconProps) => <Icon {...p}><circle cx="10" cy="6" r="2.75" /><path d="M5 17c.3-3.3 2.3-5.3 5-5.3s4.7 2 5 5.3" /></Icon>;
export const IconCalendarCheck = (p: IconProps) => <Icon {...p}><rect x="3" y="4.5" width="14" height="12.5" rx="2" /><path d="M3 8.5h14M7 3v3M13 3v3" /><path d="m7.5 12.8 1.7 1.6 3.3-3.3" /></Icon>;
export const IconPencilGrid = (p: IconProps) => <Icon {...p}><path d="M3 5.5h8M3 10h6M3 14.5h4" /><path d="m12.5 15.5 4.8-4.8a1.4 1.4 0 0 0-2-2l-4.8 4.8-.6 2.6z" /></Icon>;
export const IconAward = (p: IconProps) => <Icon {...p}><circle cx="10" cy="7.5" r="4.5" /><path d="m7.2 11 -1.2 6 4-2 4 2-1.2-6" /></Icon>;
export const IconWallet = (p: IconProps) => <Icon {...p}><path d="M3.5 6.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15V5.5A1.5 1.5 0 0 1 4.5 4H14" /><circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" /></Icon>;
export const IconMessage = (p: IconProps) => <Icon {...p}><path d="M4 4.5h12A1.5 1.5 0 0 1 17.5 6v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5z" /></Icon>;
export const IconSettings = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="2.5" /><path d="M10 2.5v2M10 15.5v2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M2.5 10h2M15.5 10h2M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" /></Icon>;
export const IconShield = (p: IconProps) => <Icon {...p}><path d="M10 2.5 4 5v4.6c0 3.8 2.6 6.9 6 7.9 3.4-1 6-4.1 6-7.9V5z" /><path d="m7.5 10 1.8 1.8 3.2-3.3" /></Icon>;
export const IconBuilding = (p: IconProps) => <Icon {...p}><path d="M3 17h14M4.5 17V8L10 4l5.5 4v9" /><path d="M8 17v-3.5h4V17M8 9.5h.01M12 9.5h.01" /></Icon>;
export const IconLogout = (p: IconProps) => <Icon {...p}><path d="M8 4H5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 5 16h3" /><path d="M12 13.5 15.5 10 12 6.5M15.5 10H7.5" /></Icon>;
export const IconMenu = (p: IconProps) => <Icon {...p}><path d="M3 5.5h14M3 10h14M3 14.5h14" /></Icon>;
export const IconClose = (p: IconProps) => <Icon {...p}><path d="m5 5 10 10M15 5 5 15" /></Icon>;
export const IconChevronRight = (p: IconProps) => <Icon {...p}><path d="m8 5 5 5-5 5" /></Icon>;
export const IconChevronLeft = (p: IconProps) => <Icon {...p}><path d="m12 5-5 5 5 5" /></Icon>;
export const IconChevronDown = (p: IconProps) => <Icon {...p}><path d="m5 8 5 5 5-5" /></Icon>;
export const IconPlus = (p: IconProps) => <Icon {...p}><path d="M10 4v12M4 10h12" /></Icon>;
export const IconSearch = (p: IconProps) => <Icon {...p}><circle cx="9" cy="9" r="5.5" /><path d="m13 13 4 4" /></Icon>;
export const IconDownload = (p: IconProps) => <Icon {...p}><path d="M10 3.5v9M6 9l4 4 4-4M4 16.5h12" /></Icon>;
export const IconUpload = (p: IconProps) => <Icon {...p}><path d="M10 13V4M6 8l4-4 4 4M4 16.5h12" /></Icon>;
export const IconCheck = (p: IconProps) => <Icon {...p}><path d="m4.5 10.5 3.5 3.5 7.5-8" /></Icon>;
export const IconAlert = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 6.5v4M10 13.5h.01" /></Icon>;
export const IconInfo = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 9.5v4M10 6.5h.01" /></Icon>;
export const IconWifiOff = (p: IconProps) => <Icon {...p}><path d="M3 3l14 14M8.5 13.5a2.2 2.2 0 0 1 3 0M5.5 10.5a6.2 6.2 0 0 1 3.4-1.7M11.6 8.8a6.2 6.2 0 0 1 2.9 1.7M2.5 7.5a10.6 10.6 0 0 1 3.4-2M9 4.6a10.6 10.6 0 0 1 8.5 2.9" /><path d="M10 16.5h.01" /></Icon>;
export const IconRefresh = (p: IconProps) => <Icon {...p}><path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.5h-3.5" /></Icon>;
export const IconFile = (p: IconProps) => <Icon {...p}><path d="M11.5 2.5H5.5A1.5 1.5 0 0 0 4 4v12a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 16 16V7z" /><path d="M11.5 2.5V7H16M7 11h6M7 14h4" /></Icon>;
export const IconReceipt = (p: IconProps) => <Icon {...p}><path d="M5 2.5h10v15l-2-1.3-1.7 1.3-1.3-1.3-1.3 1.3L7 16.2l-2 1.3z" /><path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" /></Icon>;
export const IconSend = (p: IconProps) => <Icon {...p}><path d="M17 3 8.5 11.5M17 3l-5 14-3.5-5.5L3 8z" /></Icon>;
export const IconLock = (p: IconProps) => <Icon {...p}><rect x="4.5" y="9" width="11" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 6 0V9" /></Icon>;
export const IconUnlock = (p: IconProps) => <Icon {...p}><rect x="4.5" y="9" width="11" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 0 1 5.8-1" /></Icon>;
export const IconExternal = (p: IconProps) => <Icon {...p}><path d="M11 3.5h5.5V9M16.5 3.5 9.5 10.5M14 12v3.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H8" /></Icon>;
export const IconClock = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></Icon>;
export const IconEye = (p: IconProps) => <Icon {...p}><path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z" /><circle cx="10" cy="10" r="2.2" /></Icon>;
export const IconEyeOff = (p: IconProps) => <Icon {...p}><path d="M3 3l14 14M8.4 5.2A7.3 7.3 0 0 1 10 5c4.8 0 7.5 5 7.5 5a12.6 12.6 0 0 1-2.2 2.8M5.7 6.6A12.4 12.4 0 0 0 2.5 10s2.7 5 7.5 5a7 7 0 0 0 3.2-.8" /><path d="M8.5 8.6a2.2 2.2 0 0 0 3 3" /></Icon>;
export const IconUser = (p: IconProps) => <Icon {...p}><circle cx="10" cy="6.5" r="3" /><path d="M4 17c.4-3.4 2.8-5.5 6-5.5s5.6 2.1 6 5.5" /></Icon>;
export const IconBriefcase = (p: IconProps) => <Icon {...p}><rect x="2.5" y="6" width="15" height="10.5" rx="1.5" /><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6M2.5 10.5h15" /></Icon>;
export const IconSitemap = (p: IconProps) => <Icon {...p}><rect x="7.5" y="2.5" width="5" height="4" rx="1" /><rect x="2.5" y="13.5" width="5" height="4" rx="1" /><rect x="12.5" y="13.5" width="5" height="4" rx="1" /><path d="M10 6.5v3.5M5 13.5V10h10v3.5" /></Icon>;
export const IconBell = (p: IconProps) => <Icon {...p}><path d="M5 8.5a5 5 0 0 1 10 0c0 4 1.5 5.5 1.5 5.5h-13S5 12.5 5 8.5z" /><path d="M8.3 16.5a1.8 1.8 0 0 0 3.4 0" /></Icon>;
export const IconChart = (p: IconProps) => <Icon {...p}><path d="M3 16.5h14" /><rect x="4.5" y="9" width="2.5" height="5.5" rx=".5" /><rect x="8.75" y="5" width="2.5" height="9.5" rx=".5" /><rect x="13" y="11" width="2.5" height="3.5" rx=".5" /></Icon>;
export const IconCard = (p: IconProps) => <Icon {...p}><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" /><circle cx="7" cy="9.5" r="1.8" /><path d="M4.8 13.2c.4-1.2 1.2-1.8 2.2-1.8s1.8.6 2.2 1.8M11.5 8.5h3.5M11.5 11h2.5" /></Icon>;
export const IconPhone = (p: IconProps) => <Icon {...p}><path d="M5 3h2.5l1.3 3.4-1.6 1a9 9 0 0 0 4.4 4.4l1-1.6L16 11.5V14a1.5 1.5 0 0 1-1.6 1.5A12.5 12.5 0 0 1 3.5 4.6 1.5 1.5 0 0 1 5 3z" /></Icon>;
export const IconList = (p: IconProps) => <Icon {...p}><path d="M7.5 5.5h9M7.5 10h9M7.5 14.5h9" /><circle cx="4" cy="5.5" r=".8" fill="currentColor" stroke="none" /><circle cx="4" cy="10" r=".8" fill="currentColor" stroke="none" /><circle cx="4" cy="14.5" r=".8" fill="currentColor" stroke="none" /></Icon>;
export const IconHistory = (p: IconProps) => <Icon {...p}><path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6M3.5 3.5v3h3" /><path d="M10 6.5V10l2.5 1.5" /></Icon>;
export const IconHeart = (p: IconProps) => <Icon {...p}><path d="M10 16.5s-6.5-3.8-6.5-8.3A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6.5 2.2c0 4.5-6.5 8.3-6.5 8.3z" /></Icon>;
export const IconStar = (p: IconProps) => <Icon {...p}><path d="m10 3 2.1 4.4 4.8.6-3.5 3.3.9 4.7L10 13.8 5.7 16l.9-4.7L3.1 8l4.8-.6z" /></Icon>;
export const IconGlobe = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2 2.2 2.8 4.5 2.8 7S12 14.8 10 17c-2-2.2-2.8-4.5-2.8-7S8 5.2 10 3z" /></Icon>;
export const IconBox = (p: IconProps) => <Icon {...p}><path d="m10 2.8 6.5 3.4v7.6L10 17.2l-6.5-3.4V6.2z" /><path d="M3.5 6.2 10 9.6l6.5-3.4M10 9.6v7.6" /></Icon>;
export const IconGrip = (p: IconProps) => <Icon {...p}><circle cx="7.5" cy="5" r=".9" fill="currentColor" stroke="none" /><circle cx="12.5" cy="5" r=".9" fill="currentColor" stroke="none" /><circle cx="7.5" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="12.5" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="7.5" cy="15" r=".9" fill="currentColor" stroke="none" /><circle cx="12.5" cy="15" r=".9" fill="currentColor" stroke="none" /></Icon>;
export const IconCamera = (p: IconProps) => <Icon {...p}><path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h2l1.2-2h4.6l1.2 2h2A1.5 1.5 0 0 1 17 7v7.5A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5z" /><circle cx="10" cy="10.5" r="3" /></Icon>;
export const IconMore = (p: IconProps) => <Icon {...p}><circle cx="4.5" cy="10" r="1.9" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1.9" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10" r="1.9" fill="currentColor" stroke="none" /></Icon>;
export const IconMail = (p: IconProps) => <Icon {...p}><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" /><path d="m3 5.5 7 5 7-5" /></Icon>;
export const IconPin = (p: IconProps) => <Icon {...p}><path d="M10 17s5.5-5 5.5-9.2A5.5 5.5 0 0 0 4.5 7.8C4.5 12 10 17 10 17z" /><circle cx="10" cy="8" r="2" /></Icon>;
export const IconHash = (p: IconProps) => <Icon {...p}><path d="M7.5 3.5 6 16.5M14 3.5l-1.5 13M3.5 7.5h13M3 12.5h13" /></Icon>;
export const IconTrash = (p: IconProps) => <Icon {...p}><path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 5.5l.8 10.6a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L15 5.5M8.5 9v5M11.5 9v5" /></Icon>;
export const IconBook = (p: IconProps) => <Icon {...p}><path d="M10 5.5C8.5 4.2 6.3 3.5 3 3.5v12c3.3 0 5.5.7 7 2 1.5-1.3 3.7-2 7-2v-12c-3.3 0-5.5.7-7 2zM10 5.5v12" /></Icon>;
export const IconNote = (p: IconProps) => <Icon {...p}><path d="M4.5 2.5h8l3 3v12h-11z" /><path d="M12.5 2.5v3h3M7 9.5h6M7 12.5h6M7 15.5h3.5" /></Icon>;
export const IconCar = (p: IconProps) => <Icon {...p}><path d="M3 13.5V10l1.8-4.2a1.5 1.5 0 0 1 1.4-.8h7.6a1.5 1.5 0 0 1 1.4.8L17 10v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 10h14" /><circle cx="6.5" cy="12" r=".6" fill="currentColor" /><circle cx="13.5" cy="12" r=".6" fill="currentColor" /><path d="M5 14.5v1.5M15 14.5v1.5" /></Icon>;
export const IconLinkedIn = (p: IconProps) => <Icon {...p}><rect x="2.5" y="2.5" width="15" height="15" rx="2.5" /><path d="M6.5 9v4.5M6.5 6.5v.01M9.5 13.5V9M9.5 11c0-1.2.9-2 2-2s2 .8 2 2v2.5" /></Icon>;
export const IconAt = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="3" /><path d="M13 10v1.2a2.3 2.3 0 0 0 4.5.5A7.5 7.5 0 1 0 14 16.4" /></Icon>;
export const IconSparkle = (p: IconProps) => <Icon {...p}><path d="M9 2.5l1.5 4.2 4.2 1.5-4.2 1.5L9 13.9l-1.5-4.2L3.3 8.2l4.2-1.5zM15 12.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></Icon>;
export const IconChecklist = (p: IconProps) => <Icon {...p}><path d="m3.5 5 1.3 1.3L7.3 3.8M3.5 10.5l1.3 1.3 2.5-2.5M3.5 16l1.3 1.3 2.5-2.5M10 5.5h6.5M10 11h6.5M10 16.5h6.5" /></Icon>;
