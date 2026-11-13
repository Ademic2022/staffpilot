"use client";

import { useState } from "react";

import { cx } from "@/components/ui";

type Look = "solid" | "on-light" | "on-dark";

/**
 * Look at a loaded logo: a picture with no transparency fills its tile edge to edge; a
 * transparent one sits on white with a little room around it, unless its drawing is light
 * (white lettering meant for dark backgrounds), which would vanish on white, so it gets a
 * dark tile instead.
 */
function lookOf(img: HTMLImageElement): Look {
  try {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "on-light";
    ctx.drawImage(img, 0, 0, size, size);
    const px = ctx.getImageData(0, 0, size, size).data;
    let clear = 0, drawn = 0, light = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) { clear++; continue; }
      drawn++;
      // Relative luminance, roughly.
      if (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2] > 205) light++;
    }
    if (clear < (size * size) / 50) return "solid";
    return drawn && light / drawn > 0.6 ? "on-dark" : "on-light";
  } catch {
    return "on-light"; // a picture from another origin cannot be read: the safe default
  }
}

/** The company's logo in a rounded tile, sized by className (h-9 w-9 and so on). */
export function CompanyLogo({ src, alt = "", className, pad = "p-1" }: { src: string; alt?: string; className?: string; pad?: string }) {
  const [look, setLook] = useState<Look | null>(null);
  return (
    <span className={cx("grid flex-none place-items-center overflow-hidden rounded-lg",
      look === "on-dark" ? "bg-[#15181a] ring-1 ring-inset ring-white/10" : "bg-white ring-1 ring-inset ring-black/10",
      className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onLoad={(e) => setLook(lookOf(e.currentTarget))}
        className={cx("h-full w-full object-contain", look !== "solid" && pad)} />
    </span>
  );
}
