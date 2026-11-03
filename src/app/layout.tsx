import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { Providers } from "./providers";
import "./globals.css";

// Font Awesome's CSS is imported above, so it must not inject it again at runtime.
config.autoAddCss = false;

// One type system for the whole product: a serif for headings, a clean sans for everything else.
const display = Fraunces({ subsets: ["latin"], variable: "--ff-display", style: ["normal", "italic"], display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--ff-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "StaffPilot", template: "%s · StaffPilot" },
  description: "People, leave and payroll in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f3d2e",
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
