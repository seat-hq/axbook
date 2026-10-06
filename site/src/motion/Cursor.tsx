"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a[href], button, summary, label, select, [role='button'], [role='tab'], [role='link']";
const TEXTUAL = "input, textarea, [contenteditable='true']";

function overText(e: PointerEvent): boolean {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const node =
    doc.caretPositionFromPoint?.(e.clientX, e.clientY)?.offsetNode ??
    doc.caretRangeFromPoint?.(e.clientX, e.clientY)?.startContainer;
  return node?.nodeType === Node.TEXT_NODE && !!node.textContent?.trim();
}

/**
 * Fine-pointer cursor: a dot on the pointer and a ring that eases toward it.
 * Coarse pointers and reduced motion keep the system cursor.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring || !fine.matches || reduce.matches) return;

    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let shown = false;
    let raf = 0;

    const place = (): void => {
      rx += (x - rx) * 0.22;
      ry += (y - ry) * 0.22;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(place);
    };

    const show = (clientX: number, clientY: number): void => {
      x = clientX;
      y = clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        root.classList.add("has-cursor");
        root.dataset.cursor = "on";
        raf = requestAnimationFrame(place);
      }
    };

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === "touch") return;
      show(e.clientX, e.clientY);
      const target = e.target instanceof Element ? e.target : null;
      const text = target?.closest(TEXTUAL);
      const hit = target?.closest(INTERACTIVE);
      const disabled = hit?.getAttribute("aria-disabled") === "true" || (hit instanceof HTMLButtonElement && hit.disabled);
      if (text || (!hit && overText(e))) root.dataset.cursorState = "text";
      else if (disabled) root.dataset.cursorState = "off";
      else if (hit) root.dataset.cursorState = "link";
      else delete root.dataset.cursorState;
    };

    const onLeave = (): void => {
      delete root.dataset.cursor;
    };
    const onEnter = (e: PointerEvent): void => {
      if (shown) {
        show(e.clientX, e.clientY);
        root.dataset.cursor = "on";
      }
    };
    const onDown = (): void => {
      root.dataset.cursorDown = "true";
    };
    const onUp = (): void => {
      delete root.dataset.cursorDown;
    };
    const stop = (): void => {
      root.classList.remove("has-cursor");
      delete root.dataset.cursor;
      delete root.dataset.cursorState;
      delete root.dataset.cursorDown;
      shown = false;
      cancelAnimationFrame(raf);
    };
    const onMedia = (): void => {
      if (!fine.matches || reduce.matches) stop();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    fine.addEventListener("change", onMedia);
    reduce.addEventListener("change", onMedia);

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      fine.removeEventListener("change", onMedia);
      reduce.removeEventListener("change", onMedia);
    };
  }, []);

  return (
    <div className="site-cursor" aria-hidden="true">
      <div ref={ringRef} className="site-cursor-ring" />
      <div ref={dotRef} className="site-cursor-dot" />
    </div>
  );
}
