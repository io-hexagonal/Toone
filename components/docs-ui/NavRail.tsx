import type { CSSProperties, ReactNode } from "react";
import styles from "./NavRail.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P3 NavRail: the left panel's navigation rail.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:2603-2660 (order: Create Agent,
 *   Conversations, recent threads, New Chat, Divider, Agents, System Threads,
 *   Browser, Routines menu, Calendar, Live Share (Business), Timeline (not in
 *   the App Store build), Settings, Spacer; VStack spacing 4, padding h4 v8),
 *   :2759-2763 (width 44 = navigationRailWidth, innerBackground @0.24),
 *   :895-924 (a 1pt separator Divider follows the rail; drawn here as the
 *   rail's right border, so the rail is 45 wide);
 * - creationButton :2856-2903 (32², 16pt semibold, textSecondary; hover
 *   accent + accent .10 fill + scale 1.07; New Chat adds `plus.circle.fill`
 *   9pt bold at the symbol's bottom-trailing corner, offset 4/3);
 * - railButton :3009-3070 (32², r8; selected = accent icon, accent .17 fill
 *   and a 2×16 accent capsule at x −2; hover = accent .10 fill, scale 1.07;
 *   badge = 8pt rounded bold white on an orange capsule ≥13², black .35
 *   ring, offset 4/−4, "99+" over 99);
 * - routineOptionButton :2928-2958 (28², 11pt semibold, tertiary; selected
 *   accent .17 fill + 1pt accent stroke);
 * - symbols: APP/Core/Services/Window/PanelWindowService.swift:61-77.
 *
 * Recent threads (28² items, LeftOrchestratorView.swift:3229-3482) are not
 * drawn; pass a `{ kind: "custom" }` item if a scene needs them. With no
 * recent threads the list is a zero-height slot that still takes the stack's
 * spacing, so the default items keep an empty slot after Conversations.
 */

export type NavRailItem =
  | {
      id: string;
      /** "destination" (railButton, default), "create" (creationButton) or "option" (routine menu option). */
      kind?: "destination" | "create" | "option";
      icon: GlyphName;
      /** creationButton's `plus.circle.fill` overlay (New Chat). */
      plus?: boolean;
      disabled?: boolean;
    }
  | { id: string; kind: "divider" }
  | { id: string; kind: "custom"; node: ReactNode };

/** The rail as the Direct build draws it for a local project (no Live Share). */
export const RAIL_ITEMS: NavRailItem[] = [
  { id: "createAgent", kind: "create", icon: "person.badge.plus" },
  { id: "conversations", icon: "bubble.left.and.bubble.right" },
  // RecentThreadRailList: empty → zero-height slot (still spaced)
  { id: "recentThreads", kind: "custom", node: null },
  { id: "createChat", kind: "create", icon: "bubble.left", plus: true },
  { id: "divider", kind: "divider" },
  { id: "agents", icon: "person.2" },
  { id: "systemThreads", icon: "person.2.badge.gearshape" },
  { id: "browser", icon: "globe" },
  { id: "routines", icon: "point.3.connected.trianglepath.dotted" },
  { id: "calendar", icon: "calendar" },
  { id: "timeline", icon: "arrow.triangle.branch" },
  { id: "settings", icon: "gearshape" },
];

/** Routine menu options (RoutineRailOption): insert after "routines" when the menu is open. */
export const ROUTINE_MENU_OPTIONS: NavRailItem[] = [
  { id: "currentRoutines", kind: "option", icon: "list.bullet.rectangle" },
  { id: "exploreWorkflows", kind: "option", icon: "safari" },
];

type Props = {
  /** Defaults to RAIL_ITEMS. */
  items?: NavRailItem[];
  /** Id of the selected destination (accent fill + leading bar). */
  selected?: string;
  /** Id of a hovered item (accent .10 fill, scale 1.07). */
  hovered?: string;
  /** Count badges by item id (e.g. `{ systemThreads: 2 }`). */
  badges?: Record<string, number>;
  style?: CSSProperties;
};

const ICON = 18; // 16pt semibold symbol ≈ 18px glyph

export function NavRail({ items = RAIL_ITEMS, selected, hovered, badges = {}, style }: Props) {
  return (
    <div className={styles.rail} style={style}>
      {items.map((item) => {
        if (item.kind === "divider") return <span className={styles.divider} key={item.id} />;
        if (item.kind === "custom") {
          return item.node === null ? <span key={item.id} style={{ height: 0 }} /> : <span key={item.id}>{item.node}</span>;
        }
        const state = item.id === selected ? "selected" : item.id === hovered ? "hover" : undefined;
        if (item.kind === "option") {
          return (
            <span className={styles.option} data-state={state} key={item.id}>
              <Glyph name={item.icon} size={13} weight="semibold" />
            </span>
          );
        }
        const count = badges[item.id] ?? 0;
        return (
          <span
            className={styles.item}
            data-disabled={item.disabled ? "true" : undefined}
            data-state={item.kind === "create" && state === "selected" ? "hover" : state}
            key={item.id}
          >
            <Glyph name={item.icon} size={ICON} weight="semibold" />
            {item.plus ? (
              <span className={styles.plus}>
                <Glyph name="plus.circle.fill" size={10} weight="bold" />
              </span>
            ) : null}
            {state === "selected" && item.kind !== "create" ? <span className={styles.bar} /> : null}
            {count > 0 ? <span className={styles.badge}>{count > 99 ? "99+" : count}</span> : null}
          </span>
        );
      })}
      <span className={styles.spacer} />
    </div>
  );
}
