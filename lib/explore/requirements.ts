import type { WorkflowPackage } from "./types";

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
