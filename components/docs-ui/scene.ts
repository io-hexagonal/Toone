import type { ComponentType } from "react";

/** Everything a scene file exports (as `scene`), consumed by the registry. */
export type SceneDefinition = {
  /** Kebab-case id, equal to the file name and the ```toone-ui fence body. */
  id: string;
  /** Natural width in CSS px (= app points). Must be ≤ 640. */
  width: number;
  /** Frame radius: 24 when the crop shows a panel corner, 16 otherwise. */
  radius: 16 | 24;
  /** aria-label: what the figure shows and in which state. */
  label: string;
  /** Short visible caption under the figure (one sentence). */
  caption: string;
  /** Server component, no props, no hooks, no client state. */
  Component: ComponentType;
};

export const MAX_FIGURE_WIDTH = 640;
