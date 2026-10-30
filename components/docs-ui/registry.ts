import type { SceneDefinition } from "./scene";

/*
 * Scene registry. One import line and one entry line per scene; keep both
 * lists in alphabetical order so parallel additions merge cleanly.
 */
import { scene as draftPipelineGraph } from "./scenes/draft-pipeline-graph";
import { scene as routineRunningGraph } from "./scenes/routine-running-graph";

const ALL: SceneDefinition[] = [
  draftPipelineGraph,
  routineRunningGraph,
];

export const SCENES: Record<string, SceneDefinition> = Object.fromEntries(ALL.map((s) => [s.id, s]));
