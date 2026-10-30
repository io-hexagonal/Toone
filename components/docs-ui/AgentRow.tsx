import type { ReactNode } from "react";
import styles from "./AgentRow.module.css";
import { Button } from "./Button";
import { DestinationHeader } from "./DestinationHeader";
import { Field } from "./Field";
import { Glyph } from "./glyphs";

/**
 * P8 AgentRow and the populated Agents destination of the left panel.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - Agents destination: APP/UI/Layout/LeftOrchestratorView.swift:1089-1164
 *   (header "Agents"; SearchField "Search agents or threads", padding h8 v4;
 *   the roster; Divider; "Create agent" person.badge.plus .borderedProminent
 *   full width, padding 16, .ultraThinMaterial).
 * - Roster: WorkspaceHierarchyView.localHierarchy :4699-4764 (VStack
 *   spacing 8, padding v8; one AgentInteractionSectionHeader per day, then
 *   the agents last talked to that day, newest first): section titles
 *   "Today" / "Yesterday" / "N days ago" / "No interactions yet"
 *   (:4453-4470); header :4521-4541.
 * - AgentRow :4825-4990: HStack(spacing 4) [AgentDirectoryCardLabel, the
 *   "New Thread" `plus` icon button (13 medium, textSecondary)], padding
 *   h8 v2.
 * - AgentDirectoryCardLabel: APP/UI/Components/AgentActivityIcon.swift:115-191
 *   (38pt AgentActivityIcon · name subheadline semibold · department
 *   caption2 medium secondary · last message "<author>: <first line>"
 *   caption, or "No thread messages yet" tertiary · thread count capsule +
 *   chevron when the agent has live threads; padding h8 v7, min-h 66,
 *   panelRowSurface).
 * - AgentActivityIcon :55-104: the avatar takes the theme accent; attention
 *   / completed / failed add a ring (orange .72 / success .65 / error .72,
 *   width max(1.5, size × 0.045)).
 *
 * The avatar (AgentBlobView, an animated soft body) is drawn as ONE static
 * blob with two cut-out eyes (plan §5.4). It never animates here.
 */

export type AgentActivity = "idle" | "working" | "attention" | "completed" | "failed";

const RING: Partial<Record<AgentActivity, string>> = {
  attention: "color-mix(in srgb, var(--tu-warning) 72%, transparent)",
  completed: "color-mix(in srgb, var(--tu-success) 65%, transparent)",
  failed: "color-mix(in srgb, var(--tu-error) 72%, transparent)",
};

/** Static stand-in for AgentBlobView: an accent soft body with cut-out eyes. */
export function AgentAvatar({ size = 38, activity = "idle" }: { size?: number; activity?: AgentActivity }) {
  const ring = RING[activity];
  const ringWidth = Math.max(1.5, size * 0.045);
  return (
    <svg aria-hidden="true" height={size} style={{ flex: "none", display: "block" }} viewBox="0 0 38 38" width={size}>
      <path
        d="M19.2 6.2c7.4 0 12.6 5 12.6 12.4 0 7.9-5.4 13.2-12.9 13.2-7.6 0-12.7-5.1-12.7-12.8 0-7.6 5.4-12.8 13-12.8z"
        fill="var(--tu-accent)"
      />
      <ellipse cx="15.4" cy="17.6" fill="var(--tu-panel)" rx="1.7" ry="2.5" />
      <ellipse cx="22.8" cy="17.6" fill="var(--tu-panel)" rx="1.7" ry="2.5" />
      {ring ? (
        <circle
          cx="19"
          cy="19"
          fill="none"
          r={19 - 0.76 - (ringWidth * 38) / size / 2}
          stroke={ring}
          strokeWidth={(ringWidth * 38) / size}
        />
      ) : null}
    </svg>
  );
}

export type AgentRowSpec = {
  name: string;
  department: string;
  /** "<author>: <first line>"; omitted = "No thread messages yet". */
  preview?: string;
  activity?: AgentActivity;
  /** Live threads: draws the count capsule and the chevron. */
  threads?: number;
  expanded?: boolean;
  state?: "hover" | "selected";
};

export function AgentRow({ agent }: { agent: AgentRowSpec }) {
  const threads = agent.threads ?? 0;
  return (
    <div className={styles.row}>
      <div className={styles.card} data-state={agent.state}>
        <AgentAvatar activity={agent.activity} />
        <div className={styles.lines}>
          <span className={styles.name}>{agent.name}</span>
          <span className={styles.department}>{agent.department}</span>
          <span className={styles.preview} data-empty={agent.preview ? undefined : "true"}>
            {agent.preview ?? "No thread messages yet"}
          </span>
        </div>
        {threads > 0 ? (
          <>
            <span className={styles.count}>{threads}</span>
            <span className={styles.chevron}>
              <Glyph name={agent.expanded ? "chevron.down" : "chevron.right"} size={10} weight="bold" />
            </span>
          </>
        ) : null}
      </div>
      <span className={styles.plus}>
        <Glyph name="plus" size={15} weight="medium" />
      </span>
    </div>
  );
}

export function AgentSectionHeader({ title }: { title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{title}</span>
      <span className={styles.sectionRule} />
    </div>
  );
}

/**
 * The populated Agents destination: header, search, the roster (pass
 * AgentSectionHeader / AgentRow children) and the "Create agent" bar.
 * The parent sets the height; the roster clips like a ScrollView.
 */
export function AgentsDestination({ children, bottomBar = true }: { children: ReactNode; bottomBar?: boolean }) {
  return (
    <div className={styles.destination}>
      <DestinationHeader title="Agents" />
      <div className={styles.search}>
        <Field placeholder="Search agents or threads" />
      </div>
      <div className={styles.list}>{children}</div>
      {bottomBar ? (
        <div className={styles.bottomBar}>
          <Button
            icon="person.badge.plus"
            iconSize={14}
            label="Create agent"
            style={{ display: "flex", width: "100%", gap: 6 }}
            variant="prominent"
          />
        </div>
      ) : null}
    </div>
  );
}
