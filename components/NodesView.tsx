"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./Navbar";
import type { Category } from "@/lib/types";

interface NodeListItem {
  id: string;
  title: string;
  excerpt: string;
  connectionCount: number;
}

interface CategoryWithNodes {
  category: Category;
  nodes: NodeListItem[];
}

interface Volume {
  id: string;
  label: string;
  description: string;
  chapters: number;
}

interface Props {
  groups: CategoryWithNodes[];
  totalCount: number;
  volumes: Volume[];
}

const SERIF = { fontFamily: "var(--font-serif)" } as const;

// PDFs/EPUBs are heavy and pulled from GitHub raw on click. main is pinned
// so a renamed default branch doesn't silently break downloads.
const RAW_BASE =
  "https://raw.githubusercontent.com/theiskaa/apeirron/main/books";
const coverUrl = (id: string) => `/books/cover-${id}.png`;
const pdfUrl = (id: string) => `${RAW_BASE}/apeirron-${id}.pdf`;
const epubUrl = (id: string) => `${RAW_BASE}/apeirron-${id}.epub`;

export default function NodesView({ groups, volumes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>("_top");

  const tocIds = useMemo(
    () => [
      ...(volumes.length > 0 ? ["books"] : []),
      ...groups.map((g) => `category-${g.category.id}`),
    ],
    [groups, volumes.length]
  );

  useEffect(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;

    let ticking = false;
    let urlTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const headings = tocIds
          .map((id) => content.querySelector(`#${CSS.escape(id)}`))
          .filter(Boolean) as HTMLElement[];

        const scrollTop = scroll.scrollTop;
        const offset = 120;

        if (
          headings.length === 0 ||
          headings[0].offsetTop - scroll.offsetTop > scrollTop + offset
        ) {
          setActiveId("_top");
          if (urlTimer) clearTimeout(urlTimer);
          urlTimer = setTimeout(() => {
            window.history.replaceState(null, "", window.location.pathname);
          }, 150);
          return;
        }

        let current = headings[0].id;
        for (const h of headings) {
          if (h.offsetTop - scroll.offsetTop <= scrollTop + offset) {
            current = h.id;
          } else {
            break;
          }
        }
        setActiveId(current);
        if (urlTimer) clearTimeout(urlTimer);
        urlTimer = setTimeout(() => {
          window.history.replaceState(
            null,
            "",
            current === "_top" ? window.location.pathname : `#${current}`
          );
        }, 150);
      });
    };

    scroll.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // On mount, honour hash in URL
    const hash =
      typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash) {
      const el = content.querySelector(`#${CSS.escape(hash)}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        }, 0);
      }
    }

    return () => {
      scroll.removeEventListener("scroll", onScroll);
      if (urlTimer) clearTimeout(urlTimer);
    };
  }, [tocIds]);

  const handleTocClick = useCallback((id: string) => {
    if (id === "_top") {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setActiveId(id);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-text-primary">
      <Navbar />
      <div ref={scrollRef} className="flex-1 overflow-y-auto panel-scroll">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-16">
          <header className="pt-10 sm:pt-14">
            <div
              className="border-b"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--text-primary) 18%, transparent)",
              }}
            >
              <div className="pb-6 sm:pb-8 text-center">
                <h1
                  className="leading-[0.92] tracking-tight text-text-primary text-[16vw] sm:text-[88px] lg:text-[104px]"
                  style={{ ...SERIF, fontWeight: 800 }}
                >
                  Apeirron
                </h1>
              </div>
            </div>
            <p
              className="text-center italic mt-4 mb-1 text-[15px] sm:text-base leading-relaxed mx-auto max-w-2xl"
              style={{ ...SERIF, color: "var(--text-secondary)" }}
            >
              A field guide to the biggest questions humanity asks — consciousness,
              lost history, intelligence operations, and the nature of reality.
            </p>
            <p
              className="text-center text-[12px] leading-relaxed mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Every entry is a self-contained investigation. Every connection has
              a reason. Read one below, or follow it into the{" "}
              <Link
                href="/"
                className="underline underline-offset-2 hover:text-text-primary transition-colors"
              >
                graph
              </Link>
              . New here? Read{" "}
              <Link
                href="/about"
                className="underline underline-offset-2 hover:text-text-primary transition-colors"
              >
                about the project
              </Link>
              .
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5 xl:hidden">
              {volumes.length > 0 && (
                <button
                  onClick={() => handleTocClick("books")}
                  className="chrome inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-text-secondary"
                >
                  Books
                  <span className="text-text-muted/60 tabular-nums">
                    {volumes.length}
                  </span>
                </button>
              )}
              {groups.map(({ category, nodes }) => (
                <button
                  key={category.id}
                  onClick={() => handleTocClick(`category-${category.id}`)}
                  className="chrome inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-text-secondary"
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  {category.label}
                  <span className="text-text-muted/60 tabular-nums">
                    {nodes.length}
                  </span>
                </button>
              ))}
            </div>
          </header>

          <div className="flex gap-0 mt-10">
            <nav
              aria-label="Sections"
              className="hidden xl:block w-48 2xl:w-56 shrink-0 pr-8"
            >
              <div className="sticky top-8">
                <div
                  className="text-[10px] uppercase tracking-[0.18em] mb-3 pb-2 border-b"
                  style={{
                    color: "var(--text-muted)",
                    borderColor:
                      "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                  }}
                >
                  Sections
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleTocClick("_top")}
                      style={{
                        color:
                          activeId === "_top"
                            ? "var(--text-primary)"
                            : "rgba(144,144,160,0.5)",
                      }}
                      className="text-left w-full text-[12px] leading-snug py-[3px] transition-colors hover:!text-text-primary"
                    >
                      Front page
                    </button>
                  </li>
                  {volumes.length > 0 && (
                    <li>
                      <button
                        onClick={() => handleTocClick("books")}
                        style={{
                          color:
                            activeId === "books"
                              ? "var(--text-primary)"
                              : "rgba(144,144,160,0.5)",
                        }}
                        className="flex items-center gap-2 text-left w-full text-[12px] leading-snug py-[3px] transition-colors hover:!text-text-primary"
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: "var(--text-muted)" }}
                          aria-hidden="true"
                        />
                        <span className="flex-1">Books</span>
                        <span className="text-text-muted/60 tabular-nums text-[10px]">
                          {volumes.length}
                        </span>
                      </button>
                    </li>
                  )}
                  {groups.map(({ category, nodes }) => {
                    const id = `category-${category.id}`;
                    const active = activeId === id;
                    return (
                      <li key={category.id}>
                        <button
                          onClick={() => handleTocClick(id)}
                          style={{
                            color: active
                              ? "var(--text-primary)"
                              : "rgba(144,144,160,0.5)",
                          }}
                          className="flex items-center gap-2 text-left w-full text-[12px] leading-snug py-[3px] transition-colors hover:!text-text-primary"
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{category.label}</span>
                          <span className="text-text-muted/60 tabular-nums text-[10px]">
                            {nodes.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div ref={contentRef} className="flex-1 min-w-0">
              {volumes.length > 0 && (
                <section id="books" className="mb-12 scroll-mt-24">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--text-muted)" }}
                      aria-hidden="true"
                    />
                    <h2
                      className="uppercase tracking-[0.16em] text-[13px] font-semibold shrink-0"
                      style={{ color: "var(--text-primary)" }}
                    >
                      The Apeirron Series
                    </h2>
                    <span
                      className="h-px flex-1"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--text-primary) 16%, transparent)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] text-text-muted/70 tabular-nums shrink-0">
                      {volumes.length}
                    </span>
                  </div>

                  <p className="text-[12.5px] leading-relaxed text-text-secondary mb-5 max-w-2xl">
                    Typeset volumes derived from the graph — one per section, each
                    chapter a node. EPUB and PDF, served from{" "}
                    <a
                      href="https://github.com/theiskaa/apeirron"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-text-primary"
                    >
                      GitHub
                    </a>
                    .
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {volumes.map((volume) => (
                      <div
                        key={volume.id}
                        className="group relative flex gap-3 rounded-xl p-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.4)]"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--text-primary) 3.5%, transparent)",
                          border:
                            "1px solid color-mix(in srgb, var(--text-primary) 9%, transparent)",
                        }}
                      >
                        <a
                          href={pdfUrl(volume.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 block transition-transform group-hover:-translate-y-0.5"
                          aria-label={`Open ${volume.label} PDF`}
                        >
                          <img
                            src={coverUrl(volume.id)}
                            alt={`${volume.label} cover`}
                            width={140}
                            height={210}
                            className="w-[50px] h-auto rounded-[2px]"
                            style={{
                              boxShadow:
                                "0 2px 5px rgba(0,0,0,0.18), 0 10px 24px rgba(0,0,0,0.28)",
                            }}
                          />
                        </a>
                        <div className="flex flex-col min-w-0">
                          <h3
                            className="text-[13px] leading-[1.15] mb-1 text-text-primary"
                            style={{ ...SERIF, fontWeight: 700 }}
                          >
                            {volume.label}
                          </h3>
                          <p
                            className="text-[10.5px] leading-[1.35] flex-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {volume.description}
                          </p>
                          <div className="mt-2 flex gap-1">
                            <a
                              href={pdfUrl(volume.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chrome inline-flex items-center justify-center px-2 h-[20px] rounded-full text-[9.5px] tracking-wide leading-none text-text-secondary hover:text-text-primary"
                            >
                              PDF
                            </a>
                            <a
                              href={epubUrl(volume.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chrome inline-flex items-center justify-center px-2 h-[20px] rounded-full text-[9.5px] tracking-wide leading-none text-text-secondary hover:text-text-primary"
                            >
                              EPUB
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {groups.map(({ category, nodes }) => (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="mb-12 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                      aria-hidden="true"
                    />
                    <h2
                      className="uppercase tracking-[0.16em] text-[13px] font-semibold shrink-0"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {category.label}
                    </h2>
                    <span
                      className="h-px flex-1"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--text-primary) 16%, transparent)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] text-text-muted/70 tabular-nums shrink-0">
                      {nodes.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {nodes.map((node) => (
                      <Link
                        key={node.id}
                        href={`/node/${node.id}`}
                        prefetch={false}
                        className="group relative flex flex-col rounded-xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.4)]"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--text-primary) 3.5%, transparent)",
                          border:
                            "1px solid color-mix(in srgb, var(--text-primary) 9%, transparent)",
                        }}
                      >
                        <span
                          className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] mb-2"
                          style={{ color: category.color }}
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: category.color }}
                            aria-hidden="true"
                          />
                          {category.label}
                        </span>
                        <h3
                          className="text-[19px] sm:text-[20px] leading-[1.15] mb-2 text-text-primary decoration-1 underline-offset-[3px] group-hover:underline"
                          style={{ ...SERIF, fontWeight: 700 }}
                        >
                          {node.title}
                        </h3>
                        <p
                          className="text-[12.5px] leading-[1.5] flex-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {node.excerpt}
                        </p>
                        <span
                          className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {node.connectionCount} connections
                          <span
                            className="transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              <div
                className="mt-8 pt-8"
                style={{
                  borderTop:
                    "1px solid color-mix(in srgb, var(--text-primary) 12%, transparent)",
                }}
              >
                <p className="text-[13px] text-text-secondary">
                  Missing a topic?{" "}
                  <Link
                    href="/contribute"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    Contribute a node
                  </Link>
                  . Read the{" "}
                  <Link
                    href="/about"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    editorial standards
                  </Link>
                  . Apeirron is open source on{" "}
                  <a
                    href="https://github.com/theiskaa/apeirron"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
