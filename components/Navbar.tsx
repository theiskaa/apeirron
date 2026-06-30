"use client";

import Link from "next/link";
import ThemePicker from "./ThemePicker";
import { useSearch } from "./SearchProvider";

interface Props {
  onLogoClick?: () => void;
  /**
   * Node view: expand to align the pill's left edge with the article title
   * (offset by NodeView's TOC rail on xl+) with a matching inset on the right.
   * Off (graph / other pages) → a compact centered pill. The transition between
   * the two animates both ways.
   */
  articleInset?: boolean;
}

/**
 * The animated, centered column the navbar AND the tab bar both live in, so they
 * share an identical width and grow/shrink in lockstep. Compact (graph) → a snug
 * centered width; expanded (node view) → NodeView's content column with a
 * symmetric inset that lands the wordmark on the article title.
 */
export function headerColumnClass(articleInset?: boolean) {
  return `mx-auto w-full transition-[max-width,padding] duration-300 ease-out ${
    articleInset
      ? "max-w-[1400px] px-6 lg:px-12 xl:px-[240px] 2xl:px-[272px]"
      : "max-w-[340px] sm:max-w-[560px] px-4"
  }`;
}

export default function Navbar({ onLogoClick, articleInset }: Props) {
  const { openSearch } = useSearch();

  return (
    <div className="pt-3 sm:pt-4">
      <div className={headerColumnClass(articleInset)}>
        <nav className="chrome-surface navbar-pill pointer-events-auto flex h-10 w-full items-center justify-between rounded-full pl-5 pr-2.5 sm:h-12">
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
            className="flex items-center leading-none hover:opacity-70 transition-opacity"
            aria-label="Apeirron — home"
          >
            <span
              className="text-text-primary text-[17px] sm:text-[19px] leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                transform: "translateY(-1.5px)",
              }}
            >
              Apeirron
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            <button
              onClick={openSearch}
              className="nav-action h-8 w-8 sm:h-9 sm:w-auto sm:gap-2 sm:px-3 text-[12.5px] tracking-wide leading-none"
              aria-label="Search nodes"
            >
              <svg
                width="14"
                height="14"
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
              className="nav-action h-8 w-8 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 text-[12.5px] tracking-wide leading-none"
              aria-label="Propose a new node"
            >
              <svg
                width="13"
                height="13"
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
              className="mx-0.5 sm:mx-1 h-4 sm:h-5 w-px shrink-0"
              style={{ backgroundColor: "var(--chrome-border)" }}
              aria-hidden="true"
            />

            <ThemePicker />

            <Link
              href="/nodes"
              aria-label="Index — browse every node"
              className="nav-action h-8 w-8 sm:h-9 sm:w-9"
            >
              <svg
                width="15"
                height="15"
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
