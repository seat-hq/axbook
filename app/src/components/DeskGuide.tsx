"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE = "seat.guide.v1";

type Entry = {
  id: string;
  title: string;
  body: string;
  tour?: boolean;
};

const ENTRIES: readonly Entry[] = [
  {
    id: "tape",
    title: "SIM TAPE",
    body: "Prices, PnL, and this tape are simulated. They are not the leader’s book.",
    tour: true,
  },
  {
    id: "desk",
    title: "Desk",
    body: "Deposit and redeem write to the vault. NAV, cash, and seats are the live desk.",
    tour: true,
  },
  {
    id: "shell",
    title: "Neural shell",
    body: "Rails feed the ring. Packets travel the strands. Late fills are the prints leaving it.",
    tour: true,
  },
  {
    id: "feed",
    title: "Feed",
    body: "A scrolling line of the latest mock prints.",
  },
  {
    id: "metrics",
    title: "Session figures",
    body: "Realized, unrealized, win rate, volume, sold, and gas are this session’s figures.",
  },
  {
    id: "rails",
    title: "Rails",
    body: "Six series on the left. Each strand into the ring uses the same color.",
  },
  {
    id: "fills",
    title: "Late fills",
    body: "The newest mock prints, stacked as they arrive.",
  },
  {
    id: "log",
    title: "Copy tape",
    body: "Copy or skip decisions. This log moves on its own clock.",
  },
  {
    id: "prints",
    title: "Prints",
    body: "The price tape. It updates separately from the copy log.",
  },
  {
    id: "foot",
    title: "Status bar",
    body: "Session summary: last print, realized, win, NAV, cash, seats, and copies.",
  },
];

const TOUR = ENTRIES.filter((entry) => entry.tour).map((entry) => entry.id);
const CATALOG = ["tape", "feed", "metrics", "rails", "shell", "fills", "log", "prints", "desk", "foot"];

type Store = { tour: boolean; ids: string[] };

type Mode =
  | { kind: "closed" }
  | { kind: "catalog" }
  | { kind: "spot"; id: string; tour: boolean; index: number };

type Box = { top: number; left: number; width: number; height: number; cardTop: number; cardLeft: number };

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { tour: false, ids: [] };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      tour: Boolean(parsed.tour),
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return { tour: false, ids: [] };
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORAGE, JSON.stringify(store));
}

function entryById(id: string): Entry | undefined {
  return ENTRIES.find((entry) => entry.id === id);
}

export function DeskGuide() {
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<Store>({ tour: false, ids: [] });
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [tourSeen, setTourSeen] = useState<boolean | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const stored = readStore();
    storeRef.current = stored;
    setTourSeen(stored.tour);
  }, []);

  const remember = (id: string): void => {
    const store = storeRef.current;
    if (!store.ids.includes(id)) store.ids = [...store.ids, id];
    writeStore(store);
  };

  const finishTour = (): void => {
    storeRef.current = { ...storeRef.current, tour: true };
    writeStore(storeRef.current);
    setTourSeen(true);
  };

  const close = (): void => {
    if (mode.kind === "spot") remember(mode.id);
    if (mode.kind === "spot" && mode.tour) finishTour();
    setMode({ kind: "closed" });
    setBox(null);
    buttonRef.current?.focus();
  };

  const startTour = (): void => {
    const first = TOUR[0];
    if (!first) return;
    setMode({ kind: "spot", id: first, tour: true, index: 0 });
  };

  const openOne = (id: string): void => {
    setMode({ kind: "spot", id, tour: false, index: 0 });
  };

  const go = (dir: 1 | -1): void => {
    if (mode.kind !== "spot" || !mode.tour) {
      close();
      return;
    }
    remember(mode.id);
    const next = mode.index + dir;
    const id = TOUR[next];
    if (!id) {
      finishTour();
      setMode({ kind: "closed" });
      setBox(null);
      buttonRef.current?.focus();
      return;
    }
    setBox(null);
    setMode({ kind: "spot", id, tour: true, index: next });
  };

  useLayoutEffect(() => {
    if (mode.kind === "closed") return;
    const placeMenu = (): void => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = 240;
      const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
      setMenuPos({ top: rect.bottom + 8, left });
    };
    const placeSpot = (): boolean => {
      if (mode.kind !== "spot") return true;
      const target = document.querySelector(`[data-guide="${mode.id}"]`);
      const card = cardRef.current;
      if (!(target instanceof HTMLElement) || !card) return false;
      const rect = target.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      const pad = 8;
      const gap = 12;
      const cardW = card.offsetWidth || 280;
      const cardH = card.offsetHeight || 120;
      let cardTop = rect.bottom + gap;
      if (cardTop + cardH > window.innerHeight - pad) cardTop = rect.top - cardH - gap;
      if (cardTop < pad) cardTop = pad;
      let cardLeft = rect.left;
      if (cardLeft + cardW > window.innerWidth - pad) cardLeft = window.innerWidth - cardW - pad;
      if (cardLeft < pad) cardLeft = pad;
      const next: Box = {
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        cardTop,
        cardLeft,
      };
      setBox((prev) => {
        if (
          prev &&
          Math.abs(prev.top - next.top) < 1 &&
          Math.abs(prev.left - next.left) < 1 &&
          Math.abs(prev.width - next.width) < 1 &&
          Math.abs(prev.height - next.height) < 1 &&
          Math.abs(prev.cardTop - next.cardTop) < 1 &&
          Math.abs(prev.cardLeft - next.cardLeft) < 1
        ) {
          return prev;
        }
        return next;
      });
      return true;
    };

    if (mode.kind === "catalog") placeMenu();
    if (mode.kind === "spot" && !placeSpot()) {
      if (mode.tour) {
        const next = mode.index + 1;
        const id = TOUR[next];
        if (id) setMode({ kind: "spot", id, tour: true, index: next });
        else {
          finishTour();
          setMode({ kind: "closed" });
        }
      } else {
        setMode({ kind: "closed" });
      }
      return;
    }

    const onMove = (): void => {
      if (mode.kind === "catalog") placeMenu();
      if (mode.kind === "spot") placeSpot();
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [mode]);

  useEffect(() => {
    if (mode.kind === "closed") return;
    const root = cardRef.current;
    root?.querySelector<HTMLElement>(".fx-guide-next, .fx-guide-walk")?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled])"));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onPointer = (event: PointerEvent): void => {
      if (mode.kind !== "catalog") return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (root?.contains(target) || buttonRef.current?.contains(target)) return;
      setMode({ kind: "closed" });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [mode]);

  const spot = mode.kind === "spot" ? entryById(mode.id) : undefined;

  const overlay =
    mode.kind === "catalog" ? (
      <div
        ref={cardRef}
        className="fx-guide-menu"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        style={menuPos ? { top: menuPos.top, left: menuPos.left } : { visibility: "hidden" }}
      >
        <p id={titleId} className="fx-guide-kicker">
          Desk guide
        </p>
        <button type="button" className="fx-guide-walk" onClick={startTour}>
          <span>Walk the desk</span>
          <em>{tourSeen ? "Replay · 3" : "Start · 3"}</em>
        </button>
        <ul>
          {CATALOG.map((id) => {
            const entry = entryById(id);
            if (!entry) return null;
            return (
              <li key={id}>
                <button type="button" onClick={() => openOne(id)}>
                  {entry.title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ) : mode.kind === "spot" && spot ? (
      <>
        <button type="button" className="fx-guide-scrim" aria-label="Close guide" onClick={close} />
        <div
          className="fx-guide-hole"
          style={
            box
              ? { top: box.top, left: box.left, width: box.width, height: box.height }
              : { visibility: "hidden" }
          }
        />
        <div
          ref={cardRef}
          className="fx-guide-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={box ? { top: box.cardTop, left: box.cardLeft } : { visibility: "hidden" }}
        >
          <p className="fx-guide-kicker">{mode.tour ? `${mode.index + 1} of ${TOUR.length}` : "Guide"}</p>
          <h2 id={titleId}>{spot.title}</h2>
          <p>{spot.body}</p>
          <div className="fx-guide-actions">
            {mode.tour ? (
              <button type="button" onClick={() => go(-1)} disabled={mode.index === 0}>
                Back
              </button>
            ) : null}
            <button type="button" className="fx-guide-skip" onClick={close}>
              {mode.tour ? "Skip" : "Close"}
            </button>
            <button type="button" className="fx-guide-next" onClick={() => go(1)}>
              {mode.tour && mode.index < TOUR.length - 1 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="fx-guide-btn"
        aria-expanded={mode.kind === "catalog"}
        aria-haspopup="dialog"
        onClick={() => setMode((current) => (current.kind === "catalog" ? { kind: "closed" } : { kind: "catalog" }))}
      >
        GUIDE
        {tourSeen === false ? <i /> : null}
      </button>
      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </>
  );
}
