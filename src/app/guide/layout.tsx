import type { CSSProperties, ReactNode } from "react";

import { Footer, Header } from "@/components/landing/Landing";
import "@/components/landing/landing.css";

// The guide's links and tips use the app's brand tokens; on the public site they take the site's colours.
const tones = { "--brand": "#0f3d2e", "--brand-ink": "#175a43" } as CSSProperties;

/** The public user guide: the same articles as the in-app Help, for anyone (and search engines) to read. */
export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp min-h-screen overflow-x-clip" style={tones}>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">{children}</main>
      <Footer />
    </div>
  );
}
