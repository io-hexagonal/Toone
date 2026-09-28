import type { BundlePublicDetail, RoutinePublicDetail, WorkflowPackage } from "./types";

/** Derive only declared package facts; the discovery classifier cannot invent setup. */
export function requirementFacts(pkg: WorkflowPackage) {
  const included = [...(pkg.agents ?? []).map((a) => a.name), ...(pkg.skills ?? []).map((s) => s.id)];
  const youProvide: string[] = [
    ...(pkg.requirements?.agent_ids ?? []).filter((id) => !pkg.agents?.some((agent) => agent.source_id === id)),
    ...(pkg.requirements?.skill_ids ?? []).filter((id) => !pkg.skills?.some((skill) => skill.id === id)),
  ];
  const produces: string[] = [];
  for (const resource of pkg.resources ?? []) {
    if (resource.mode === "seed_text" || resource.mode === "seed_directory") {
      const input = pkg.members.find((member) => member.key === resource.member_key)?.payload.inputs?.find((input) => input.id === resource.input_id);
      // Installation paths and bundled contents belong to the desktop package.
      // Public requirements describe what is included, not where it is written.
      const name = resource.input_id.replace(/^input[-_]/, "").replace(/[-_]+/g, " ");
      included.push(input?.description?.trim() || name.charAt(0).toUpperCase() + name.slice(1));
    }
  }
  for (const member of pkg.members) {
    const invocations = member.parent_key ? pkg.members.flatMap((parent) => parent.payload.steps ?? []).filter((step) => step.subRoutineId === member.source_routine_id) : [];
    for (const input of member.payload.inputs ?? []) {
      if (input.requirement === "optional") continue;
      if (invocations.length && invocations.every((step) => step.childInputBindings?.some((binding) => binding.childInputId === input.id))) continue;
      const resource = pkg.resources?.find((r) => r.member_key === member.key && r.input_id === input.id);
      if (resource && ["seed_text", "seed_directory", "runtime_binding"].includes(resource.mode)) continue;
      youProvide.push(input.description?.trim() || input.id);
    }
    for (const artefact of member.payload.artefacts ?? []) {
      produces.push(`${artefact.name || artefact.id}${artefact.format ? ` (${artefact.format})` : ""}`);
    }
  }
  return { included: [...new Set(included)], youProvide: [...new Set(youProvide)], produces: [...new Set(produces)] };
}

/** How-to guides for the product features a record uses. Every link comes from
    a declared package or listing fact, never from listing copy, so a record
    only points at features it relies on. The how-to section is English-only,
    so every locale links to the /en pages directly. */
export const FEATURE_GUIDES = {
  guideRoutines: "/en/how-to/features/routines",
  guideBrowser: "/en/how-to/features/browser-sessions",
  guideRunDebug: "/en/how-to/getting-started/run-and-debug",
  guideApprovals: "/en/how-to/features/orchestration",
  guideBundles: "/en/how-to/features/explore",
} as const;
export type FeatureGuideKey = keyof typeof FEATURE_GUIDES;
const BROWSER_TOOLS = new Set(["browser", "browser-silk"]);

export function featureGuides(detail: RoutinePublicDetail | BundlePublicDetail): FeatureGuideKey[] {
  if (!("package" in detail)) return detail.members.length ? ["guideBundles", "guideRoutines"] : ["guideBundles"];
  const pkg = detail.package;
  const tools = [...(pkg.requirements?.mcp_ids ?? []), ...(pkg.agents ?? []).flatMap((agent) => agent.mcp_ids)];
  const steps = pkg.members.flatMap((member) => member.payload.steps ?? []);
  const outsideActions = (detail.listing_profile?.third_parties ?? []).some((site) => site.actions.some((action) => action !== "read"));
  const keys: FeatureGuideKey[] = ["guideRoutines"];
  if (tools.some((tool) => BROWSER_TOOLS.has(tool))) keys.push("guideBrowser");
  if (steps.some((step) => step.completionCriteria?.length)) keys.push("guideRunDebug");
  if (outsideActions) keys.push("guideApprovals");
  return keys;
}
