"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";

export interface SuggestedNode {
  id: string;
  title: string;
  color: string;
}

interface Props {
  pool: SuggestedNode[];
}

const SUGGESTION_COUNT = 6;

// Fisher–Yates pick of `n` distinct items. Kept out of render so it only runs
// in the post-hydration effect, never during SSR.
function pickRandom(pool: SuggestedNode[], n: number): SuggestedNode[] {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// The lone node at the centre of "4 ◯ 4" — a single graph node whose edges
// have come loose. Each edge is a faded stub ending in a hollow dot drifting
// away, so the figure reads as a page nothing links to. Motion is subtle and
// honours prefers-reduced-motion via the global rule in globals.css.
function OrphanNode() {
  // Angles (deg) and lengths for the severed edges, spread unevenly so it
  // looks organic rather than radial.
  const edges = [
    { a: 18, len: 30 },
    { a: 74, len: 24 },
    { a: 142, len: 33 },
    { a: 205, len: 26 },
    { a: 262, len: 31 },
    { a: 320, len: 22 },
  ];
  const rad = (d: number) => (d * Math.PI) / 180;

  return (
    <span className="nf-node" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="block w-full h-full overflow-visible">
        {edges.map((e, i) => {
          // Stub starts just outside the node, breaks, then a lone endpoint.
          const x0 = 50 + Math.cos(rad(e.a)) * 20;
          const y0 = 50 + Math.sin(rad(e.a)) * 20;
          const x1 = 50 + Math.cos(rad(e.a)) * (20 + e.len * 0.45);
          const y1 = 50 + Math.sin(rad(e.a)) * (20 + e.len * 0.45);
          const ex = 50 + Math.cos(rad(e.a)) * (20 + e.len);
          const ey = 50 + Math.sin(rad(e.a)) * (20 + e.len);
          return (
            <g key={i} className="nf-edge" style={{ ["--d" as string]: `${i * 0.4}s` }}>
              <line
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke="var(--graph-line)"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <circle cx={ex} cy={ey} r={2.6} fill="none" stroke="var(--graph-node-dim)" strokeWidth={1.5} />
            </g>
          );
        })}
        {/* pulsing ring */}
        <circle className="nf-ring" cx={50} cy={50} r={17} fill="none" stroke="var(--accent-ring)" strokeWidth={1.5} />
        {/* the lone node */}
        <circle cx={50} cy={50} r={13} fill="var(--accent)" />
      </svg>
    </span>
  );
}

export default function NotFoundView({ pool }: Props) {
  // SSR renders the first N (deterministic, so hydration matches); the effect
  // then swaps in a random N on mount — fresh on every visit.
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>(() =>
    pool.slice(0, SUGGESTION_COUNT)
  );
  useEffect(() => {
    setSuggestions(pickRandom(pool, SUGGESTION_COUNT));
  }, [pool]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-text-primary">
      <Navbar />
      <main className="flex-1 overflow-y-auto panel-scroll flex items-center justify-center px-5">
        <div className="w-full max-w-[600px] mx-auto text-center pb-16 -mt-6 sm:-mt-10">
          <span
            className="block text-[10px] uppercase tracking-[0.22em] mb-8"
            style={{ color: "var(--text-muted)" }}
          >
            Errata · Not in the index
          </span>

          {/* 4 ◯ 4 — the missing page as an orphaned node */}
          <div className="nf-plate flex items-center justify-center gap-3 sm:gap-4 leading-none">
            <span className="nf-digit" style={{ fontFamily: "var(--font-serif)", fontWeight: 800 }}>
              4
            </span>
            <OrphanNode />
            <span className="nf-digit" style={{ fontFamily: "var(--font-serif)", fontWeight: 800 }}>
              4
            </span>
          </div>

          <p
            className="italic mt-8 text-[16px] sm:text-[18px] leading-relaxed mx-auto max-w-[34rem]"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}
          >
            You&rsquo;ve wandered past the edge of the map — into the{" "}
            <span className="not-italic">ἄπειρον</span>, the boundless, the undefined.
            This node has no connections.
          </p>

          <p className="text-[13px] leading-relaxed text-text-muted mt-3">
            The page you asked for isn&rsquo;t in the record.
          </p>

          {suggestions.length > 0 && (
            <div className="mt-10">
              <span
                className="block text-[10px] uppercase tracking-[0.18em] mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Find your way back
              </span>
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
                {suggestions.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/node/${n.id}`}
                      prefetch={false}
                      className="group inline-flex items-center gap-2 text-[13px] text-text-secondary transition-colors hover:!text-text-primary"
                    >
                      <span className="decoration-1 underline-offset-[3px] group-hover:underline">
                        {n.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-11">
            <Link
              href="/"
              prefetch={false}
              className="chrome inline-flex items-center px-4 py-2 rounded-full text-[12px] uppercase tracking-[0.14em] text-text-primary"
            >
              Back to home
            </Link>
            <Link
              href="/nodes"
              prefetch={false}
              className="inline-flex items-center px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:text-text-primary"
            >
              Read the index
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
