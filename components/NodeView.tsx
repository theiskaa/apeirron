"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GraphNode, GraphLink } from "@/lib/types";

const MiniGraph = dynamic(() => import("./MiniGraph"), { ssr: false });

interface Props {
  node: GraphNode;
  links: GraphLink[];
  allNodes: GraphNode[];
  onNodeClick: (nodeId: string) => void;
}

export default function NodeView({
  node,
  links,
  allNodes,
  onNodeClick,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleContentClick = useCallback(
    (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-node-link]");
      if (target) {
        e.preventDefault();
        const nodeId = target.getAttribute("data-node-link");
        if (nodeId) onNodeClick(nodeId);
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener("click", handleContentClick);
    return () => el.removeEventListener("click", handleContentClick);
  }, [handleContentClick]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [node.id]);

  const { mainHtml, sourcesHtml } = useMemo(() => {
    const html = node.contentHtml;
    // Match <h2 id="sources">Sources</h2> and everything after
    const sourcesMatch = html.match(
      /(<h2[^>]*id="sources"[^>]*>[\s\S]*$)/i
    );
    if (sourcesMatch) {
      return {
        mainHtml: html.slice(0, sourcesMatch.index),
        sourcesHtml: sourcesMatch[1],
      };
    }
    return { mainHtml: html, sourcesHtml: "" };
  }, [node.contentHtml]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto panel-scroll">
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-10 max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex-1 min-w-0 max-w-4xl">
          <h1 className="text-3xl font-bold text-text-primary mb-2 leading-tight">
            {node.title}
          </h1>

          <span
            className="inline-block text-xs font-medium mb-8"
            style={{ color: node.color }}
          >
            {node.category
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>

          <div
            ref={contentRef}
            className="prose-apeiron"
            dangerouslySetInnerHTML={{ __html: mainHtml }}
          />
        </div>

        <div className="w-full lg:w-96 xl:w-[420px] shrink-0 mt-10 lg:mt-0 lg:pt-16">
          <div className="space-y-8">
            {/* Mini graph showing local neighborhood */}
            <div>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                Connections
              </h3>
              <MiniGraph
                currentNodeId={node.id}
                allNodes={allNodes}
                allLinks={links}
                onNodeClick={onNodeClick}
              />
            </div>
            {sourcesHtml && (
              <div>
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Sources
                </h3>
                <div
                  className="prose-apeiron prose-apeiron-sources"
                  dangerouslySetInnerHTML={{ __html: sourcesHtml.replace(/<h2[^>]*>.*?<\/h2>/i, "") }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
