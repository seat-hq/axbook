"use client";

import { useEffect, useLayoutEffect, useState, type DependencyList, type RefObject } from "react";
import { getGsap } from "./gsap";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const QUERY = "(prefers-reduced-motion: reduce)";

/** `null` until mounted, so server output never assumes a preference. */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Reads the query once after mount. Intentionally ignores resize/orientation so
 * GSAP-pinned layouts are not torn down mid-session (prevents DOM sync crashes).
 */
export function useInitialMediaQuery(query: string): boolean | null {
  const [match, setMatch] = useState<boolean | null>(null);
  useEffect(() => {
    setMatch(window.matchMedia(query).matches);
  }, [query]);
  return match;
}

export function useMediaQuery(query: string): boolean | null {
  const [match, setMatch] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (): void => setMatch(mq.matches);
    update();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const onChange = (): void => {
      clearTimeout(debounce);
      debounce = setTimeout(update, 120);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      clearTimeout(debounce);
    };
  }, [query]);
  return match;
}

/**
 * Runs `setup` inside a scoped gsap.context and reverts everything on cleanup.
 * `setup` only runs when motion is allowed.
 */
export function useGsap(
  scope: RefObject<HTMLElement | SVGElement | null>,
  setup: (tools: ReturnType<typeof getGsap>) => void | (() => void),
  deps: DependencyList,
): void {
  const reduced = useReducedMotion();
  useIsoLayoutEffect(() => {
    if (reduced !== false || !scope.current) return;
    const tools = getGsap();
    let extra: void | (() => void);
    const ctx = tools.gsap.context(() => {
      extra = setup(tools);
    }, scope.current);
    return () => {
      if (typeof extra === "function") extra();
      // Revert can measure a pin whose parent Next already removed.
      try {
        ctx.revert();
      } catch {
        /* detached during route change */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);
}

/** True while the element is on screen. Used to pause loops that are off screen. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "0px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
