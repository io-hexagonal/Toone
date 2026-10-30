import type { SceneDefinition } from "./scene";

/*
 * Scene registry. One import line and one entry line per scene; keep both
 * lists in alphabetical order so parallel additions merge cleanly.
 */
import { scene as agentBrowserConsent } from "./scenes/agent-browser-consent";
import { scene as agentCreatedStatus } from "./scenes/agent-created-status";
import { scene as agentNameField } from "./scenes/agent-name-field";
import { scene as agentPurposeReply } from "./scenes/agent-purpose-reply";
import { scene as agentsEmpty } from "./scenes/agents-empty";
import { scene as agentsRoster } from "./scenes/agents-roster";
import { scene as appWindowOverview } from "./scenes/app-window-overview";
import { scene as autofixPicker } from "./scenes/autofix-picker";
import { scene as browserAgentTab } from "./scenes/browser-agent-tab";
import { scene as browserLoginImport } from "./scenes/browser-login-import";
import { scene as browserSiteApproval } from "./scenes/browser-site-approval";
import { scene as bundleInstallCard } from "./scenes/bundle-install-card";
import { scene as calendarProposedEvent } from "./scenes/calendar-proposed-event";
import { scene as calendarRoutineEvent } from "./scenes/calendar-routine-event";
import { scene as calendarWeek } from "./scenes/calendar-week";
import { scene as chatCreateRoutineMenu } from "./scenes/chat-create-routine-menu";
import { scene as chatToolOutputWithheld } from "./scenes/chat-tool-output-withheld";
import { scene as composerModelMenu } from "./scenes/composer-model-menu";
import { scene as composerSafeBadge } from "./scenes/composer-safe-badge";
import { scene as conversationsDirectory } from "./scenes/conversations-directory";
import { scene as draftArtefactInspector } from "./scenes/draft-artefact-inspector";
import { scene as draftHeaderPublish } from "./scenes/draft-header-publish";
import { scene as draftPipelineGraph } from "./scenes/draft-pipeline-graph";
import { scene as draftStepInspector } from "./scenes/draft-step-inspector";
import { scene as draftingThreadBreakdown } from "./scenes/drafting-thread-breakdown";
import { scene as draftingThreadIntent } from "./scenes/drafting-thread-intent";
import { scene as exploreBrowser } from "./scenes/explore-browser";
import { scene as graphHandoff } from "./scenes/graph-handoff";
import { scene as issueCardAutofixed } from "./scenes/issue-card-autofixed";
import { scene as issueCardSuggest } from "./scenes/issue-card-suggest";
import { scene as layoutTransition } from "./scenes/layout-transition";
import { scene as listingHeroMenu } from "./scenes/listing-hero-menu";
import { scene as listingPreparedWorksWith } from "./scenes/listing-prepared-works-with";
import { scene as liveShareAccessRequests } from "./scenes/live-share-access-requests";
import { scene as liveShareBannerGuest } from "./scenes/live-share-banner-guest";
import { scene as liveShareHostCursor } from "./scenes/live-share-host-cursor";
import { scene as liveShareHostStart } from "./scenes/live-share-host-start";
import { scene as mcpApiKeySheet } from "./scenes/mcp-api-key-sheet";
import { scene as meetingListening } from "./scenes/meeting-listening";
import { scene as meetingSummaryReply } from "./scenes/meeting-summary-reply";
import { scene as menubarZenMenu } from "./scenes/menubar-zen-menu";
import { scene as mobileCompanionHome } from "./scenes/mobile-companion-home";
import { scene as mySubmissions } from "./scenes/my-submissions";
import { scene as mySubmissionsActions } from "./scenes/my-submissions-actions";
import { scene as navRail } from "./scenes/nav-rail";
import { scene as newChatAgentPicker } from "./scenes/new-chat-agent-picker";
import { scene as operatingLoop } from "./scenes/operating-loop";
import { scene as orgMcpSection } from "./scenes/org-mcp-section";
import { scene as orgPanelOverview } from "./scenes/org-panel-overview";
import { scene as panelLayouts } from "./scenes/panel-layouts";
import { scene as projectExplorerEmpty } from "./scenes/project-explorer-empty";
import { scene as projectExplorerTree } from "./scenes/project-explorer-tree";
import { scene as projectPanelHide } from "./scenes/project-panel-hide";
import { scene as questionCardApproval } from "./scenes/question-card-approval";
import { scene as railHoverTimeline } from "./scenes/rail-hover-timeline";
import { scene as railRoutinesExplore } from "./scenes/rail-routines-explore";
import { scene as routineDefinitionCard } from "./scenes/routine-definition-card";
import { scene as routineRowContextMenu } from "./scenes/routine-row-context-menu";
import { scene as routineRowContextMenuBranch } from "./scenes/routine-row-context-menu-branch";
import { scene as routineRunningGraph } from "./scenes/routine-running-graph";
import { scene as routineToolbarRun } from "./scenes/routine-toolbar-run";
import { scene as routinesListRunning } from "./scenes/routines-list-running";
import { scene as runHistoryCompleted } from "./scenes/run-history-completed";
import { scene as settingsDefaultModel } from "./scenes/settings-default-model";
import { scene as settingsGlobalIntegrations } from "./scenes/settings-global-integrations";
import { scene as settingsGlobalMcps } from "./scenes/settings-global-mcps";
import { scene as settingsMobileDevices } from "./scenes/settings-mobile-devices";
import { scene as settingsMobilePairing } from "./scenes/settings-mobile-pairing";
import { scene as settingsOtherApplications } from "./scenes/settings-other-applications";
import { scene as settingsPanelStyle } from "./scenes/settings-panel-style";
import { scene as settingsProviderVersions } from "./scenes/settings-provider-versions";
import { scene as settingsRoutineInspector } from "./scenes/settings-routine-inspector";
import { scene as settingsSafeMode } from "./scenes/settings-safe-mode";
import { scene as settingsSafeModeAudit } from "./scenes/settings-safe-mode-audit";
import { scene as settingsZenToggleHotkey } from "./scenes/settings-zen-toggle-hotkey";
import { scene as setupChecklistConnect } from "./scenes/setup-checklist-connect";
import { scene as setupChecklistFinished } from "./scenes/setup-checklist-finished";
import { scene as setupInputQuestion } from "./scenes/setup-input-question";
import { scene as setupProviderCards } from "./scenes/setup-provider-cards";
import { scene as setupRouteChoice } from "./scenes/setup-route-choice";
import { scene as setupRunQuestion } from "./scenes/setup-run-question";
import { scene as setupShortcuts } from "./scenes/setup-shortcuts";
import { scene as shareChecklistPreparing } from "./scenes/share-checklist-preparing";
import { scene as shareChecklistReady } from "./scenes/share-checklist-ready";
import { scene as shareChooserSheet } from "./scenes/share-chooser-sheet";
import { scene as spotlightChatPanel } from "./scenes/spotlight-chat-panel";
import { scene as spotlightOverApp } from "./scenes/spotlight-over-app";
import { scene as subroutineExpandedGraph } from "./scenes/subroutine-expanded-graph";
import { scene as systemThreadsList } from "./scenes/system-threads-list";
import { scene as systemThreadsParallel } from "./scenes/system-threads-parallel";
import { scene as timelineDetail } from "./scenes/timeline-detail";
import { scene as timelineList } from "./scenes/timeline-list";
import { scene as timelineSetup } from "./scenes/timeline-setup";
import { scene as voiceRecording } from "./scenes/voice-recording";
import { scene as workspaceStripAdd } from "./scenes/workspace-strip-add";
import { scene as workspaceStripShortcut } from "./scenes/workspace-strip-shortcut";
import { scene as workspaceStripStates } from "./scenes/workspace-strip-states";
import { scene as workspaceStripUnread } from "./scenes/workspace-strip-unread";
import { scene as zenModeSchematic } from "./scenes/zen-mode-schematic";
import { scene as zenVideoGrid } from "./scenes/zen-video-grid";

const ALL: SceneDefinition[] = [
  agentBrowserConsent,
  agentCreatedStatus,
  agentNameField,
  agentPurposeReply,
  agentsEmpty,
  agentsRoster,
  appWindowOverview,
  autofixPicker,
  browserAgentTab,
  browserLoginImport,
  browserSiteApproval,
  bundleInstallCard,
  calendarProposedEvent,
  calendarRoutineEvent,
  calendarWeek,
  chatCreateRoutineMenu,
  chatToolOutputWithheld,
  composerModelMenu,
  composerSafeBadge,
  conversationsDirectory,
  draftArtefactInspector,
  draftHeaderPublish,
  draftPipelineGraph,
  draftStepInspector,
  draftingThreadBreakdown,
  draftingThreadIntent,
  exploreBrowser,
  graphHandoff,
  issueCardAutofixed,
  issueCardSuggest,
  layoutTransition,
  listingHeroMenu,
  listingPreparedWorksWith,
  liveShareAccessRequests,
  liveShareBannerGuest,
  liveShareHostCursor,
  liveShareHostStart,
  mcpApiKeySheet,
  meetingListening,
  meetingSummaryReply,
  menubarZenMenu,
  mobileCompanionHome,
  mySubmissions,
  mySubmissionsActions,
  navRail,
  newChatAgentPicker,
  operatingLoop,
  orgMcpSection,
  orgPanelOverview,
  panelLayouts,
  projectExplorerEmpty,
  projectExplorerTree,
  projectPanelHide,
  questionCardApproval,
  railHoverTimeline,
  railRoutinesExplore,
  routineDefinitionCard,
  routineRowContextMenu,
  routineRowContextMenuBranch,
  routineRunningGraph,
  routineToolbarRun,
  routinesListRunning,
  runHistoryCompleted,
  settingsDefaultModel,
  settingsGlobalIntegrations,
  settingsGlobalMcps,
  settingsMobileDevices,
  settingsMobilePairing,
  settingsOtherApplications,
  settingsPanelStyle,
  settingsProviderVersions,
  settingsRoutineInspector,
  settingsSafeMode,
  settingsSafeModeAudit,
  settingsZenToggleHotkey,
  setupChecklistConnect,
  setupChecklistFinished,
  setupInputQuestion,
  setupProviderCards,
  setupRouteChoice,
  setupRunQuestion,
  setupShortcuts,
  shareChecklistPreparing,
  shareChecklistReady,
  shareChooserSheet,
  spotlightChatPanel,
  spotlightOverApp,
  subroutineExpandedGraph,
  systemThreadsList,
  systemThreadsParallel,
  timelineDetail,
  timelineList,
  timelineSetup,
  voiceRecording,
  workspaceStripAdd,
  workspaceStripShortcut,
  workspaceStripStates,
  workspaceStripUnread,
  zenModeSchematic,
  zenVideoGrid,
];

export const SCENES: Record<string, SceneDefinition> = Object.fromEntries(ALL.map((s) => [s.id, s]));
