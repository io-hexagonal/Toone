import test from "node:test";
import assert from "node:assert/strict";
import { requirementFacts } from "../../lib/explore/requirements";
import type { WorkflowPackage } from "../../lib/explore/types";

test("requirements separate bundled content, external inputs and declared outputs without inventing accounts", () => {
  const pkg: WorkflowPackage = { format_version: 2, routine_schema_version: 2, root_key: "root", members: [
    {key: "root", source_routine_id: "r", payload: { inputs: [
      {id: "question", description: "Research question", requirement: "dispatch"},
      {id: "optional", requirement: "optional"},
      {id: "seed", description: "Launch website catalog", requirement: "dispatch"},
      {id: "child", requirement: "dispatch"}], artefacts: [{id:"report", name:"Research report", format:"markdown"}]}},
  ], agents: [{source_id:"a",name:"Researcher",description:"",capabilities:[],skill_ids:[],mcp_ids:[]}],
    resources:[
      {member_key:"root",input_id:"seed",binding:"project://seed.txt",mode:"seed_text",value_type:"file",byte_count:1},
      {member_key:"root",input_id:"child",binding:"project://child",mode:"runtime_binding",value_type:"file",byte_count:0},
    ]};
  const facts = requirementFacts(pkg);
  assert.deepEqual(facts.included, ["Researcher", "Launch website catalog"]);
  assert.deepEqual(facts.youProvide, ["Research question"]);
  assert.deepEqual(facts.produces, ["Research report (markdown)"]);
});

test("public requirements never expose installation bindings or bundled file contents", () => {
  const pkg: WorkflowPackage = {
    format_version: 2, routine_schema_version: 2, root_key: "root",
    members: [{key: "root", source_routine_id: "r", payload: {inputs: [{id: "input-brand-assets", requirement: "dispatch"}]}}],
    resources: [{member_key: "root", input_id: "input-brand-assets", binding: "organization://private/assets", mode: "seed_directory", value_type: "directory", byte_count: 7, directory_entries: [{relative_path: "internal-logo.svg", content: "private", byte_count: 7, sha256: "hash"}]}],
    requirements: {resource_bindings: ["project://launch/{runId}/status.json"]},
  };
  assert.deepEqual(requirementFacts(pkg), {included: ["Brand assets"], youProvide: [], produces: []});
});
test("an empty package makes no inferred requirements or output claims", () => {
  assert.deepEqual(requirementFacts({format_version:1,routine_schema_version:2,root_key:"root",members:[]}), {included:[],youProvide:[],produces:[]});
});

test("legacy dependencies remain visible while parent-bound child inputs are not requested twice", () => {
  const pkg = {format_version: 1, routine_schema_version: 2, root_key: "root", requirements: {agent_ids: ["external/editor"], skill_ids: ["editing"]}, members: [
    {key: "root", source_routine_id: "root", payload: {inputs: [{id: "brief", description: "Your brief", requirement: "dispatch"}], steps: [{id: "invoke", title: "Edit", subRoutineId: "child", childInputBindings: [{childInputId: "request", sourceKind: "parent-input", sourceId: "brief"}]}]}},
    {key: "child", parent_key: "root", source_routine_id: "child", payload: {inputs: [{id: "request", description: "Child brief", requirement: "dispatch"}]}},
  ]};
  assert.deepEqual(requirementFacts(pkg).youProvide, ["external/editor", "editing", "Your brief"]);
});
