"use client";

import { useEffect, useRef, useState } from "react";
import {
  THEMES,
  THEME_STORAGE_KEY,
  ThemeId,
  applyTheme,
  getStoredTheme,
} from "@/lib/themes";

function ThemeIcon({ id, size = 13 }: { id: ThemeId; size?: number }) {
  if (id === "light") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }
  if (id === "dark") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" />
    </svg>
  );
}

export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>("light");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {}
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="chrome h-8 w-8 inline-flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ThemeIcon id={theme} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="chrome-surface absolute right-0 mt-2 flex items-center gap-1 p-1 rounded-full z-50"
          style={{ boxShadow: "var(--chrome-shadow)" }}
        >
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={active}
                aria-label={t.label}
                title={t.label}
                onClick={() => select(t.id)}
                data-active={active ? "true" : undefined}
                className="theme-picker-item h-8 w-8 inline-flex items-center justify-center rounded-full text-text-secondary"
              >
                <ThemeIcon id={t.id} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
