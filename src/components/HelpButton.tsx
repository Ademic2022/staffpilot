"use client";

import { useRouter } from "next/navigation";

import { articleForPath } from "@/help";

import { IconButton } from "./ui";

/** Opens the user guide at the article for the page you are on (or the guide's front page). */
export function HelpButton() {
  const router = useRouter();
  const open = () => {
    // Read the address when clicked, so the layout does not depend on search params.
    const { pathname, search } = window.location;
    if (pathname.startsWith("/help")) return router.push("/help");
    const a = articleForPath(pathname, new URLSearchParams(search).get("tab"));
    router.push(a ? `/help/${a.slug}` : `/help?from=${encodeURIComponent(pathname + search)}`);
  };
  return (
    <IconButton label="Help for this page" title="Help for this page" onClick={open}>
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] border-current text-[11px] font-bold leading-none">?</span>
    </IconButton>
  );
}
