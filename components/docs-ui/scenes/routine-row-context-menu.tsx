import { DEMO } from "../demo";
import { Menu, type MenuItem } from "../Menu";
import {
  RoutineControlsRow,
  RoutineFamilyCard,
  RoutineList,
  RoutineRow,
  RoutineScrollArea,
  RoutineSidebar,
  RoutineSidebarSwitcher,
} from "../RoutineSidebar";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel's sidebar, Routines tab, with the demo routine's row
 * right-clicked and its context menu open. `highlight` picks the item under
 * the pointer: "Share…" (routine-row-context-menu) or "Branch Routine…"
 * (routine-row-context-menu-branch, same drawing).
 *
 * Sources: OrganizationOverviewView.swift:1388-1530 (context menu), :14-27
 * (RoutineRowMenuGating: Add to Bundle only in the Routines panel, Share…
 * when Explore is enabled and the routine is current), :1226-1250 (Add to
 * Bundle submenu, rectangle.stack.badge.plus), :676-716 + :736-752 (list:
 * no headings while nothing runs, scheduled routines first);
 * RoutineSidebarComponents.swift:341-352, :366-566 (rows);
 * RoutineCreatorPanelView.swift:482-561 (column + switcher).
 *
 * Menu, top to bottom: the schedule toggle (shown when the routine is
 * admitted; this on-demand routine is not scheduled, so it reads "Enable
 * Schedule" clock.badge.checkmark), Divider, View Routine doc.text, Setup
 * slider.horizontal.3, Edit Routine square.and.pencil, Add to Bundle ▸,
 * Share… square.and.arrow.up, Branch Routine… arrow.triangle.branch,
 * Routine Health… waveform.path.ecg, Divider, then the submenus Proceed,
 * Cadence and Model (titles carry "(…)" only when overridden).
 *
 * Branch Routine… opens RoutineBranchSheet (WorkflowCatalog/RoutineBranchSheet.swift:18-19:
 * "duplicated as a new editable draft. The published source remains
 * unchanged."), the copy the branch caption paraphrases.
 *
 * Code vs plan: the first item is "Enable Schedule", not "Disable
 * Schedule": the toggle names the action, and an on-demand routine has no
 * schedule enabled. The row is in the Routines panel, not the right panel's
 * Organization section (audit Part 3, item 2).
 *
 * Drawn at MAGNIFY × the app's points, like routines-list-running.
 * CALIBRATE: the whole NSMenu (P19), its anchor at the pointer, the
 * submenu chevrons.
 */

const SIDEBAR_W = 320;
const MAGNIFY = 1.15;
const HEIGHT = 476;

export type RoutineRowMenuHighlight = "share" | "branch";

function items(highlight: RoutineRowMenuHighlight): MenuItem[] {
  return [
    { label: "Enable Schedule", icon: "clock.badge.checkmark" },
    "separator",
    { label: "View Routine", icon: "doc.text" },
    { label: "Setup", icon: "slider.horizontal.3" },
    { label: "Edit Routine", icon: "square.and.pencil" },
    { label: "Add to Bundle", icon: "rectangle.stack.badge.plus", submenu: true },
    { label: "Share…", icon: "square.and.arrow.up", highlighted: highlight === "share" },
    { label: "Branch Routine…", icon: "arrow.triangle.branch", highlighted: highlight === "branch" },
    { label: "Routine Health…", icon: "waveform.path.ecg" },
    "separator",
    { label: "Proceed", submenu: true },
    { label: "Cadence", submenu: true },
    { label: "Model", submenu: true },
  ];
}

export function RoutineRowContextMenu({ highlight }: { highlight: RoutineRowMenuHighlight }) {
  return (
    <div style={{ zoom: MAGNIFY, width: SIDEBAR_W, height: HEIGHT, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "100%" }}>
        <RoutineSidebar width={SIDEBAR_W}>
          <RoutineSidebarSwitcher selected="Routines" />
          <div style={{ flex: "1 1 auto" }}>
            <RoutineScrollArea>
              <RoutineControlsRow placeholder="Search routines" />
              <RoutineList>
                <RoutineFamilyCard>
                  <RoutineRow
                    expanded={false}
                    historyCount={6}
                    isOn
                    name={DEMO.otherRoutines.digest.name}
                    pill={{ label: DEMO.otherRoutines.digest.cadence, tone: "neutral" }}
                  />
                </RoutineFamilyCard>
                <RoutineFamilyCard>
                  <RoutineRow
                    expanded={false}
                    historyCount={DEMO.run.number}
                    name={DEMO.routine.name}
                    pill={{ label: "On demand", tone: "neutral" }}
                  />
                </RoutineFamilyCard>
                <RoutineFamilyCard>
                  <RoutineRow
                    expanded={false}
                    historyCount={0}
                    name={DEMO.otherRoutines.launchSites.name}
                    pill={{ label: DEMO.otherRoutines.launchSites.cadence, tone: "neutral" }}
                  />
                </RoutineFamilyCard>
              </RoutineList>
            </RoutineScrollArea>
          </div>
        </RoutineSidebar>
      </div>
      {/* the menu opens at the pointer, just under the routine's name */}
      <Menu items={items(highlight)} style={{ position: "absolute", left: 104, top: 163, zIndex: 10, backdropFilter: "blur(24px)" }} />
    </div>
  );
}

export function routineRowMenuScene(id: string, highlight: RoutineRowMenuHighlight): SceneDefinition {
  const chosen = highlight === "share" ? "Share…" : "Branch Routine…";
  return {
    id,
    width: Math.round(SIDEBAR_W * MAGNIFY),
    radius: 16,
    label: `Routines sidebar, Routines tab, with ${DEMO.routine.name} right-clicked. Its menu lists Enable Schedule, View Routine, Setup, Edit Routine, Add to Bundle, Share…, Branch Routine…, Routine Health…, then Proceed, Cadence and Model. ${chosen} is highlighted.`,
    caption:
      highlight === "share"
        ? "In the Routines panel, right-click the routine to find Share…"
        : "Branch Routine… copies the routine and its sub-routines into a new draft. The original stays unchanged.",
    Component: function Scene() {
      return <RoutineRowContextMenu highlight={highlight} />;
    },
  };
}

export const scene = routineRowMenuScene("routine-row-context-menu", "share");
