import type { BundlePublicDetail, RoutinePublicDetail } from "./types";

/** How-to steps a record can point to. The how-to section is English-only,
    so every locale links to the /en pages directly (as EXPLORE_GUIDES does). */
export const FEATURE_GUIDE_PATHS = {
  routines: "/en/how-to/features/routines",
  explore: "/en/how-to/features/explore",
  browser: "/en/how-to/features/browser-sessions",
  runDebug: "/en/how-to/getting-started/run-and-debug",
  orchestration: "/en/how-to/features/orchestration",
} as const;

export type FeatureGuideId = keyof typeof FEATURE_GUIDE_PATHS;
/** Why a guide applies; the record page picks its one-line note from this. */
export type FeatureGuideReason =
  | "routine"
  | "bundle"
  | "browser"
  | "completionCriteria"
  | "multipleAgents"
  | "ownerControl";
export type FeatureGuide = { id: FeatureGuideId; href: string; reason: FeatureGuideReason };

const isBrowserTool = (id: string) => id === "browser" || id.startsWith("browser-");

/**
 * The how-to steps a record relies on, derived only from what it declares:
 * - a routine links Routines; a bundle links Explore (what a bundle is);
 * - a package that requires the browser tool links Browser sessions;
 * - a package with per-step completion criteria links Run and debug;
 * - more than one agent (package agents, or agents across bundle members)
 *   links Agent orchestration, as does a listing that declares what stays
 *   in the owner's control (owner review before outward steps).
 * Nothing is hand-mapped per record; an undeclared fact adds no link.
 */
export function featureGuides(detail: RoutinePublicDetail | BundlePublicDetail): FeatureGuide[] {
  const out: FeatureGuide[] = [];
  const add = (id: FeatureGuideId, reason: FeatureGuideReason) => {
    if (!out.some((guide) => guide.id === id)) out.push({ id, href: FEATURE_GUIDE_PATHS[id], reason });
  };
  const ownerControl = !!detail.listing_profile?.stays_in_your_control?.length;
  if ("package" in detail) {
    const pkg = detail.package;
    add("routines", "routine");
    const tools = [...(pkg.requirements?.mcp_ids ?? []), ...(pkg.agents ?? []).flatMap((agent) => agent.mcp_ids ?? [])];
    if (tools.some(isBrowserTool)) add("browser", "browser");
    const steps = pkg.members.flatMap((member) => member.payload.steps ?? []);
    if (steps.some((step) => step.completionCriteria?.some((criterion) => criterion.trim()))) add("runDebug", "completionCriteria");
    if ((pkg.agents?.length ?? 0) > 1) add("orchestration", "multipleAgents");
  } else {
    add("explore", "bundle");
    const agents = (detail.members ?? []).reduce((sum, member) => sum + (member.agent_count ?? 0), 0);
    if (agents > 1) add("orchestration", "multipleAgents");
  }
  if (ownerControl) add("orchestration", "ownerControl");
  return out;
}
