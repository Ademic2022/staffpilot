"use client";

import { useEffect, type ReactNode } from "react";

import { setUpPwa } from "@/lib/pwa";
import { SessionProvider } from "@/lib/session";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => setUpPwa(), []); // the installable app: service worker and install prompt
  return <SessionProvider>{children}</SessionProvider>;
}
