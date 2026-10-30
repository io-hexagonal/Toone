import type { SceneDefinition } from "./scene";

/*
 * Scene registry. One import line and one entry line per scene; keep both
 * lists in alphabetical order so parallel additions merge cleanly.
 */
import { scene as agentNameField } from "./scenes/agent-name-field";
import { scene as browserLoginImport } from "./scenes/browser-login-import";
import { scene as chatCreateRoutineMenu } from "./scenes/chat-create-routine-menu";
import { scene as draftPipelineGraph } from "./scenes/draft-pipeline-graph";
import { scene as exploreBrowser } from "./scenes/explore-browser";
import { scene as issueCardSuggest } from "./scenes/issue-card-suggest";
import { scene as routineRunningGraph } from "./scenes/routine-running-graph";
import { scene as routinesListRunning } from "./scenes/routines-list-running";
import { scene as setupChecklistConnect } from "./scenes/setup-checklist-connect";
import { scene as setupProviderCards } from "./scenes/setup-provider-cards";
import { scene as systemThreadsList } from "./scenes/system-threads-list";
import { scene as systemThreadsParallel } from "./scenes/system-threads-parallel";
import { scene as workspaceStripAdd } from "./scenes/workspace-strip-add";

const ALL: SceneDefinition[] = [
  agentNameField,
  browserLoginImport,
  chatCreateRoutineMenu,
  draftPipelineGraph,
  exploreBrowser,
  issueCardSuggest,
  routineRunningGraph,
  routinesListRunning,
  setupChecklistConnect,
  setupProviderCards,
  systemThreadsList,
  systemThreadsParallel,
  workspaceStripAdd,
];

export const SCENES: Record<string, SceneDefinition> = Object.fromEntries(ALL.map((s) => [s.id, s]));
