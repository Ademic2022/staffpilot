import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { SEO, SITE, siteUrl } from "@/lib/site";

import { APPLE_TOUCH_ICON } from "./apple-touch-icon";

import { Providers } from "./providers";
import "./globals.css";

// Font Awesome's CSS is imported above, so it must not inject it again at runtime.
config.autoAddCss = false;

// One type system for the whole product: a serif for headings, a clean sans for everything else.
const display = Fraunces({ subsets: ["latin"], variable: "--ff-display", style: ["normal", "italic"], display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--ff-body", display: "swap" });

// Pages are kept out of search engines unless they say otherwise: only the homepage, sign-up and
// the user guide are public. Company workspaces are private (see also app/robots.ts).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SEO.description,
  applicationName: SITE.name,
  // iPhone home-screen icon, at the address iOS also tries on its own (Chrome on iPhone falls back
  // to it). Opaque, as iOS fills transparency with black.
  // Embedded rather than linked: the Add to Home Screen sheet on iPhone uses its own loader, which
  // can fail to fetch an icon address and then draws the name's first letter instead. The same
  // picture is also at every root address iOS asks for (public/apple-touch-icon*.png).
  icons: { apple: [{ url: APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
  robots: { index: false, follow: false },
  openGraph: { siteName: SITE.name, locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7a6c2e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
