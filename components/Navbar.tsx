"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ThemePicker from "./ThemePicker";
import { useSearch } from "./SearchProvider";

/**
 * Horizontal box the navbar sits in. Each page passes the same max-width and
 * gutters as its own content column, so the bar's edges line up with the
 * content beneath it instead of floating at a width of its own.
 */
export const NAV_COLUMN = {
  /** Graph canvas: nothing to align with, so a snug centered bar. */
  graph: "max-w-[340px] sm:max-w-[560px] px-4",
  /** Graph with open tabs: wider so the tabs have room. */
  graphTabs: "max-w-[900px] px-4",
  /** NodeView's article column. On xl+ the left gutter also clears the TOC
      rail (w-52, then w-60 on 2xl) so the wordmark sits over the title. */
  article:
    "max-w-[1400px] px-4 sm:px-6 lg:px-12 xl:pl-[calc(3rem+13rem)] 2xl:pl-[calc(3rem+15rem)]",
  /** Index + About. */
  page: "max-w-[1320px] px-5 sm:px-8 lg:px-12",
  /** Contribute form. */
  wide: "max-w-[1400px] px-6 lg:px-12",
  /** Contribute success card. */
  narrow: "max-w-[720px] px-6 lg:px-12",
  /** 404 page. */
  notFound: "max-w-[640px] px-5",
} as const;

interface Props {
  onLogoClick?: () => void;
  /** Tailwind classes from NAV_COLUMN matching the page's content column. */
  column?: string;
  /** Open tabs, rendered inline between the wordmark and the actions. */
  tabs?: ReactNode;
}

export default function Navbar({ onLogoClick, column = NAV_COLUMN.graph, tabs }: Props) {
  const { openSearch } = useSearch();

  return (
    <div className="pt-[calc(env(safe-area-inset-top)_+_0.75rem)] sm:pt-[calc(env(safe-area-inset-top)_+_1rem)]">
      {/* The column morphs (max-width + gutters) as the view changes, e.g.
          graph → article. Uses the app's --ease-out token, not Tailwind's. */}
      <div
        className={`mx-auto w-full transition-[max-width,padding] duration-200 ease-[var(--ease-out)] ${column}`}
      >
        <nav className="chrome-surface navbar-pill pointer-events-auto flex h-11 w-full items-center gap-2 rounded-full pl-4 pr-2 sm:h-10">
          <Link
            href="/"
            prefetch={false}
            onClick={
              onLogoClick
                ? (e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    onLogoClick();
                  }
                : undefined
            }
            className="shrink-0 flex items-center leading-none hover:opacity-70 transition-opacity"
            aria-label="Apeirron — home"
          >
            <span
              className="text-text-primary text-[15px] sm:text-[16px] leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                transform: "translateY(-1px)",
              }}
            >
              Apeirron
            </span>
          </Link>

          {tabs ? (
            <>
              <span className="h-4 w-px shrink-0 bg-[var(--border-subtle)]" aria-hidden="true" />
              <div className="flex min-w-0 flex-1">{tabs}</div>
            </>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={openSearch}
              className="nav-action h-8 w-8 sm:w-auto sm:gap-2 sm:px-2.5 text-[11.5px] tracking-wide leading-none"
              aria-label="Search nodes"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-flex items-center text-[10px] text-text-muted ml-0.5 font-sans">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/contribute"
              className="nav-action h-8 w-8 sm:w-auto sm:gap-1.5 sm:px-2.5 text-[11.5px] tracking-wide leading-none"
              aria-label="Propose a new node"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="hidden sm:inline">New Node</span>
            </Link>

            <span
              className="mx-0.5 sm:mx-1 h-4 w-px shrink-0"
              style={{ backgroundColor: "var(--chrome-border)" }}
              aria-hidden="true"
            />

            <ThemePicker />

            <Link
              href="/nodes"
              aria-label="Index — browse every node"
              className="nav-action h-8 w-8"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="14" y2="18" />
              </svg>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
