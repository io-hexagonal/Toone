import test from "node:test";
import assert from "node:assert/strict";
import { featureGuides } from "../../lib/explore/featureGuides";
import type { BundlePublicDetail, RoutinePublicDetail } from "../../lib/explore/types";

const routine = (pkg: Partial<RoutinePublicDetail["package"]>, extra: Partial<RoutinePublicDetail> = {}) =>
  ({
    workflow_id: "wfl_1",
    title: "R",
    package: { format_version: 2, routine_schema_version: 2, root_key: "root", members: [], ...pkg },
    ...extra,
  }) as RoutinePublicDetail;
const ids = (detail: RoutinePublicDetail | BundlePublicDetail) => featureGuides(detail).map((g) => `${g.id}:${g.reason}`);

test("a bare routine links only the routines guide", () => {
  assert.deepEqual(ids(routine({})), ["routines:routine"]);
});

test("browser tools, completion criteria and several agents each add their guide", () => {
  const detail = routine({
    requirements: { mcp_ids: ["browser", "browser-silk"] },
    agents: [
      { source_id: "a", name: "A", description: "", capabilities: [], skill_ids: [], mcp_ids: [] },
      { source_id: "b", name: "B", description: "", capabilities: [], skill_ids: [], mcp_ids: [] },
    ],
    members: [{ key: "root", source_routine_id: "r", payload: { steps: [{ id: "s", title: "S", completionCriteria: ["Done"] }] } }],
  });
  assert.deepEqual(ids(detail), ["routines:routine", "browser:browser", "runDebug:completionCriteria", "orchestration:multipleAgents"]);
  assert.equal(featureGuides(detail)[1].href, "/en/how-to/features/browser-sessions");
});

test("a browser tool declared only on an agent still counts; empty criteria do not", () => {
  const detail = routine({
    agents: [{ source_id: "a", name: "A", description: "", capabilities: [], skill_ids: [], mcp_ids: ["browser-silk"] }],
    members: [{ key: "root", source_routine_id: "r", payload: { steps: [{ id: "s", title: "S", completionCriteria: [" "] }] } }],
  });
  assert.deepEqual(ids(detail), ["routines:routine", "browser:browser"]);
});

test("a listing that declares owner control links orchestration for the approval reason", () => {
  const detail = routine({}, { listing_profile: { stays_in_your_control: ["Nothing is published automatically."] } as never });
  assert.deepEqual(ids(detail), ["routines:routine", "orchestration:ownerControl"]);
});

test("a bundle links Explore, and orchestration only when its routines bring more than one agent", () => {
  const bundle = (counts: number[]) =>
    ({ bundle_id: "wfb_1", title: "B", members: counts.map((agent_count, position) => ({ position, agent_count })) }) as unknown as BundlePublicDetail;
  assert.deepEqual(ids(bundle([1, 1])), ["explore:bundle", "orchestration:multipleAgents"]);
  assert.deepEqual(ids(bundle([1])), ["explore:bundle"]);
});
