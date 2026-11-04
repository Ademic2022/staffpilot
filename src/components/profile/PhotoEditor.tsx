"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button, Dialog, ErrorNote } from "@/components/ui";
import { postFormWithProgress } from "@/lib/api";

const FRAME = 280; // the square on screen, in CSS pixels
const OUTPUT = 800; // the square sent to the server, which re-encodes it at 600 px

type View = { zoom: number; x: number; y: number }; // zoom 1 = the photo just covers the frame; x, y = its top-left, in frame pixels

/**
 * Frame a photo before it is uploaded: drag to move, slider (or wheel) to zoom. The chosen square
 * is drawn to a canvas and uploaded with a progress bar.
 */
export function PhotoEditor({ file, employeeId, onClose, onUploaded }: {
  file: File; employeeId: string; onClose: () => void; onUploaded: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  // Read as a data URL: nothing to free afterwards, so React running effects twice in development
  // cannot break the picture (as revoking a blob: address did).
  useEffect(() => {
    const reader = new FileReader();
    let live = true;
    reader.onload = () => { if (live) setSrc(reader.result as string); };
    reader.onerror = () => { if (live) setError("That file could not be read. Try another photo."); };
    reader.readAsDataURL(file);
    return () => { live = false; reader.abort(); };
  }, [file]);

  const base = size ? Math.max(FRAME / size.w, FRAME / size.h) : 1;
  const scale = base * view.zoom;
  const shown = size ? { w: size.w * scale, h: size.h * scale } : { w: FRAME, h: FRAME };

  /** Keep the frame covered: the photo may not be dragged so far that an edge shows. */
  const clamp = (v: View): View => {
    if (!size) return v;
    const s = base * v.zoom;
    return { zoom: v.zoom, x: Math.min(0, Math.max(FRAME - size.w * s, v.x)), y: Math.min(0, Math.max(FRAME - size.h * s, v.y)) };
  };

  const loaded = () => {
    const el = img.current!;
    const w = el.naturalWidth, h = el.naturalHeight;
    setSize({ w, h });
    const s = Math.max(FRAME / w, FRAME / h);
    // Start centred across, and near the top of a tall photo, where faces usually are.
    setView({ zoom: 1, x: (FRAME - w * s) / 2, y: (FRAME - h * s) * 0.15 });
  };

  const zoomTo = (zoom: number) => setView((v) => {
    // Zoom about the centre of the frame.
    const z = Math.min(4, Math.max(1, zoom));
    const k = z / v.zoom;
    const c = FRAME / 2;
    return clamp({ zoom: z, x: c - (c - v.x) * k, y: c - (c - v.y) * k });
  });

  const down = (e: ReactPointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
    setDragging(true);
  };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (d) setView((v) => clamp({ ...v, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
  };

  const save = async () => {
    if (!size || !img.current) return;
    setError(undefined);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    // The part of the original photo inside the frame.
    ctx.drawImage(img.current, -view.x / scale, -view.y / scale, FRAME / scale, FRAME / scale, 0, 0, OUTPUT, OUTPUT);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return setError("Could not prepare the photo. Try another one.");
    const form = new FormData();
    form.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
    setProgress(0);
    const body = await postFormWithProgress<{ photoUrl?: string }>(`/api/employees/${employeeId}/photo/`, form, setProgress);
    if (body.errors?.length) { setProgress(null); return setError(body.errors[0].message); }
    onUploaded();
  };

  const uploading = progress !== null;
  const percent = Math.round((progress ?? 0) * 100);
  return (
    <Dialog open onClose={uploading ? () => undefined : onClose} title="Position your photo"
      description="Drag to move it, and zoom so your face fills most of the square."
      footer={<>
        <Button variant="secondary" disabled={uploading} onClick={onClose}>Cancel</Button>
        <Button busy={uploading} disabled={!size} onClick={save}>{uploading ? (percent < 100 ? `Uploading ${percent}%` : "Saving…") : "Save photo"}</Button>
      </>}>
      <div className="grid justify-items-center gap-4 pb-2">
        {error && <div className="w-full"><ErrorNote error={error} /></div>}
        <div className="relative touch-none select-none overflow-hidden rounded-[22px] bg-subtle ring-1 ring-line"
          style={{ width: FRAME, height: FRAME, cursor: dragging ? "grabbing" : "grab" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; setDragging(false); }} onPointerCancel={() => { drag.current = null; setDragging(false); }}
          onWheel={(e) => zoomTo(view.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          tabIndex={0} role="img" aria-label="Photo, drag to position. Arrow keys move it."
          onKeyDown={(e) => {
            const step = e.shiftKey ? 20 : 5;
            const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
            if (d) { e.preventDefault(); setView((v) => clamp({ ...v, x: v.x + d[0], y: v.y + d[1] })); }
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img ref={img} src={src} alt="" draggable={false} onLoad={loaded}
            onError={() => setError("That file cannot be shown here. Use a JPG, PNG or WebP photo.")}
            className="pointer-events-none absolute max-w-none" style={{ width: shown.w, height: shown.h, left: view.x, top: view.y }} />}
          {/* The circle the photo is shown in on smaller pictures (lists, the org chart). */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-[1.5px] ring-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.18)]" />
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30" aria-hidden>
              <div className="h-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>
        <label className="flex w-full max-w-[280px] items-center gap-3 text-sm text-muted">
          Zoom
          <input type="range" min={1} max={4} step={0.01} value={view.zoom} disabled={!size || uploading}
            onChange={(e) => zoomTo(Number(e.target.value))} className="flex-1 accent-[var(--color-brand)]" aria-label="Zoom" />
        </label>
        {uploading && <p className="text-sm text-muted" role="status" aria-live="polite">{percent < 100 ? `Uploading… ${percent}%` : "Saving your photo…"}</p>}
      </div>
    </Dialog>
  );
}
