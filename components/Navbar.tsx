"use client";

import Link from "next/link";
import ThemePicker from "./ThemePicker";
import { useSearch } from "./SearchProvider";

interface Props {
  onLogoClick?: () => void;
}

export default function Navbar({ onLogoClick }: Props) {
  const { openSearch } = useSearch();
  const logoContent = (
    <span
      className="text-text-primary text-[22px] leading-none tracking-tight"
      style={{ fontFamily: "var(--font-serif)", fontWeight: 800 }}
    >
      Apeirron
    </span>
  );

  return (
    <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 pt-4 md:pt-0 h-16 shrink-0">
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
        className="flex items-center gap-3 rounded-lg px-1 -mx-1 hover:opacity-80 transition-opacity"
      >
        {logoContent}
      </Link>
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={openSearch}
          className="chrome h-8 w-8 sm:w-auto inline-flex items-center justify-center sm:gap-2 sm:px-3 rounded-full text-text-secondary hover:text-text-primary text-[12px] tracking-wide leading-none"
          aria-label="Search nodes"
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline text-[10px] text-text-muted ml-1 font-sans">⌘K</kbd>
        </button>
        <Link
          href="/contribute"
          className="chrome h-8 w-8 sm:w-auto inline-flex items-center justify-center sm:gap-1.5 sm:px-3 rounded-full text-text-secondary hover:text-text-primary text-[12px] tracking-wide leading-none"
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
        <ThemePicker />
        <Link
          href="/nodes"
          aria-label="Index — browse every node"
          className="chrome h-8 w-8 inline-flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
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
  );
}
