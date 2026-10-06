"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav, secondaryNav, type NavItem } from "@/lib/nav";
import { links, unpublishedLabel } from "@/lib/links";
import { Wordmark } from "./Wordmark";
import styles from "./Nav.module.css";

function ItemLink({ item, className, onNavigate, i }: {
  item: NavItem;
  className: string;
  onNavigate?: () => void;
  i?: number;
}) {
  const style = i === undefined ? undefined : ({ "--i": i } as React.CSSProperties);
  if (!item.href) {
    return (
      <span className={className} aria-disabled="true" style={style}>
        {item.label} <span className="tbd">{unpublishedLabel}</span>
      </span>
    );
  }
  if (item.external) {
    return (
      <a className={className} href={item.href} target="_blank" rel="noopener noreferrer" style={style} onClick={onNavigate}>
        {item.label} <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link className={className} href={item.href} style={style} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    const root = document.documentElement;
    const main = document.getElementById("main");
    root.classList.toggle("menu-open", open);
    if (main) main.inert = open;
    if (!open) return;
    const panel = panelRef.current;
    const focusables = (): HTMLElement[] =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const list = [toggleRef.current, ...focusables()].filter(Boolean) as HTMLElement[];
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (main) main.inert = false;
      root.classList.remove("menu-open");
    };
  }, [open]);

  return (
    <>
      <header className={`${styles.bar} ${scrolled ? styles.scrolled : ""}`} data-open={open}>
        <div className={styles.progress} aria-hidden="true" />
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label="Axbook home">
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className={styles.primary}>
            {primaryNav.map((item) => (
              <ItemLink key={item.label} item={item} className={styles.link} />
            ))}
          </nav>
          <div className={styles.right}>
            {links.product.href ? (
              <a className={styles.product} href={links.product.href} target="_blank" rel="noopener noreferrer">
                Open product <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className={styles.product} aria-disabled="true" title="Product URL not published yet">
                Product <span className="tbd">{unpublishedLabel}</span>
              </span>
            )}
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className={styles.toggleLabel}>{open ? "Close" : "Menu"}</span>
              <span className={styles.burger} data-open={open} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={panelRef}
        className={styles.menu}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
      >
        <div className={styles.menuInner}>
          <nav aria-label="Menu" className={styles.menuPrimary}>
            <p className="eyebrow">Explore Axbook</p>
            <ol>
              {primaryNav.map((item, i) => (
                <li key={item.label}>
                  <ItemLink item={item} className={styles.menuLink} onNavigate={close} i={i} />
                  <span className={styles.menuHint} style={{ "--i": i } as React.CSSProperties}>
                    {item.hint}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.menuSide}>
            <p className="eyebrow">Elsewhere</p>
            <ul>
              {secondaryNav.map((item, i) => (
                <li key={item.label}>
                  <ItemLink item={item} className={styles.sideLink} onNavigate={close} i={i + primaryNav.length} />
                </li>
              ))}
            </ul>
            <p className={styles.menuNote}>
              Your capital sits in the desk. Alex&apos;s key stays with Alex. The desk can lose money.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
