"use client";

import { useEffect, useRef } from "react";
import { HERO_GRAPH_MARKUP } from "@/components/hero-graph/markup";
import { startHeroGraph } from "@/components/hero-graph/runtime";

type GraphRoot = HTMLDivElement & { __hgbDestroy?: () => void };

/**
 * A Toone routine at work across your accounts, drawn in the two flanks of
 * the hero, behind the text column and never under it. Decorative: the layer
 * is pointer-events:none except the step cards, which open their sub-routine
 * on hover. Must sit after <HeroGlitter /> (same z-index 0, so DOM order puts
 * it over the light loop) and before .ha-left.
 *
 * Source of truth: docs/promos/2026-10-29-graph-connections in the monorepo
 * (markup and runtime are generated from it).
 */
export default function HeroGraphBackground() {
  const ref = useRef<GraphRoot>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    startHeroGraph(root);
    return () => root.__hgbDestroy?.();
  }, []);

  return (
    <div
      ref={ref}
      className="hero-graph-bg"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: HERO_GRAPH_MARKUP }}
    />
  );
}
