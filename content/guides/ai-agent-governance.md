---
slug: "ai-agent-governance"
canonicalPath: "/governance"
title: "AI Agent Governance: A Practical Control Model"
heading: "AI Agent Governance: A Practical Control Model"
description: "Design roles, action boundaries, approvals, evidence, and recovery into agent work before an agent can affect customers or systems."
eyebrow: "Governance guide"
author: "Toone Content"
published: "2026-08-13"
updated: "2026-08-13"
readTime: "8 min read"
featured: true
sourceWorkId: "CNT-brief-f37a981a"
sourceSha256: "24b00612150bf10262d70293806de540d948fcb8c68d2324b0a7a410e232e148"
---
AI agent governance defines who or what may act, which resources an agent may read or change, when a person must approve an action, what evidence remains afterward, and who owns recovery when execution fails.

An agent's technical ability to use a tool is not permission to use it. Governance puts the decision boundary inside the work path, before a consequential action occurs.

## The eight-part control model

A governed agent action should be explainable through eight connected fields.

| Control | Question it answers |
|---|---|
| Responsible role | Who owns the outcome and the decision boundary? |
| Routine | Which repeatable process is the agent following? |
| Resource | Which file, account, page, customer, or system is in scope? |
| Action class | Is the agent reading, drafting, writing, changing access, or deleting? |
| Approval rule | Can it proceed, must it ask, or is the action prohibited? |
| Immutable payload | What exact target and content will the decision apply to? |
| Evidence | What proves what was proposed, decided, and observed? |
| Recovery owner | Who reconciles uncertainty, retries safely, or restores service? |

These fields keep a broad instruction such as “manage our content” from becoming open-ended authority. The routine can permit research and drafting while reserving publication for a separate, exact decision.

## Separate enforcement from procedure

Governance claims become misleading when every control is described as if the product enforces it. Use three labels instead.

### Product-enforced

The application or service prevents an action without the required condition. Examples include an authenticated host approving shared access or a provider permission mode refusing an unapproved tool call.

### Organization-configured

The organization's files and routines define the boundary. A routine may require a checksum-bound package, a named owner, an expiry, and a receipt before an executor can proceed. This structure is inspectable, but its strength depends on the executor and the tools honoring the contract.

### Human-operated

A person owns the judgment or performs the action. A review checklist, a staged release, or a manual rollback may be the correct control when the decision cannot be delegated safely.

Toone uses all three layers. The public [Toone repository](https://github.com/io-hexagonal/Toone) is the current source for product behavior; organization templates add operating controls around that behavior.

## Classify the action before choosing autonomy

| Action class | Typical boundary | Approval and evidence |
|---|---|---|
| Read | Named source and retention limits | Usually automatic; record source, time, and material observations |
| Draft | Reversible local artifact | Automatic inside the brief; record source and output checksum |
| External write | Public page, message, submission, or customer record | Exact target and payload approval immediately before the write; store the external receipt |
| Permission change | Membership, role, token, or access scope | Named approver, short expiry, current authorization snapshot, and post-change verification |
| Configuration change | Production setting, integration, or policy | Diff, affected surfaces, rollback, and independent verification |
| Bulk or destructive action | Many records, deletion, replacement, or irreversible effect | Narrow target set, preview, recovery plan, explicit approval, and reconciliation after execution |

The approval burden follows the effect, not the amount of text in the instruction. Reading a large dashboard can remain a read. Sending one email is an external write.

## What an approver needs to see

An approval request should be short enough to understand and specific enough to bind the action:

1. The exact target and environment.
2. The action class and why the action is needed.
3. The immutable payload, diff, or checksum.
4. The expected effect and known limitations.
5. The expiry and whether the approval can be reused.
6. The rollback or reconciliation owner.

Approval of “the campaign” should not authorize a later payload the approver never saw. A changed payload receives a changed checksum and a new decision.

## Evidence is part of the action

A successful tool call is not always proof that the intended effect occurred. Keep separate records for:

- the proposal;
- the approval or denial;
- the execution attempt;
- the external or local receipt;
- independent verification where the effect matters;
- the final disposition.

This separation matters when an API times out after accepting a request. Repeating the call may duplicate the effect. The safe state is `WRITE_UNCERTAIN`: reconcile the target first, then decide whether another attempt is permitted.

## Recovery needs explicit states

Governed routines should distinguish common outcomes rather than collapsing them into success or failure.

| State | Next decision |
|---|---|
| Denied | Stop. Preserve the proposal and reason; do not rewrite the request to evade the decision. |
| Expired | Rebuild the current payload and request a new decision. |
| Failed before write | Repair the cause, then retry under the bounded attempt policy. |
| Write uncertain | Inspect the target or receipt before any retry. |
| Partial success | Record completed and incomplete targets separately; recover only the incomplete scope. |
| Verified | Close the action with the observed effect and evidence identity. |
| Irrecoverable | Escalate to the named owner with the target, impact, evidence, and containment already attempted. |

## Worked example: publishing a guide

A content agent may research sources, draft locally, run accessibility checks, and prepare a technical package without changing the public site. The public effect begins when a production commit is deployed.

The publication executor presents the production repository, commit hash, affected routes, build result, rollback target, and approval expiry. After approval, it performs one deployment, records the provider receipt, then checks the public status, canonical, primary content, and internal links. A timeout without a deployment receipt becomes `WRITE_UNCERTAIN`, not permission to deploy again.

## Product and data boundaries

Governance does not make every connected system safe or every stored fact appropriate to use. Provider permissions, organization routines, Safe Mode behavior, shared-access controls, and external service policies have different enforcement boundaries.

Read the current [privacy policy](/en/privacy) for data handling. Check the [editorial policy](/en/editorial-policy) for source, comparison, and corrections standards. Do not infer a security, compliance, or legal guarantee from an operating control.

## When this model fits

This control model fits recurring agent work with identifiable resources, effects, and owners. It is especially useful when agents can write to production systems, contact people, change access, or perform actions that are hard to reverse.

It is a poor fit when the organization cannot name an accountable owner, cannot observe the result, or cannot contain the consequences of failure. In those cases, keep the work read-only or human-operated until the boundary can be made explicit.

## Apply it to one routine

Choose one recurring process. List its role, routine, resources, action classes, approval rules, evidence, and recovery owner. Remove any authority that cannot be explained in those fields. Then test one denied action and one uncertain-write scenario before expanding the scope.

See the [AI-native operating-model diagnostic](/en/guides/ai-native-company) to place that routine in the wider company design, or review [current Toone examples](/en/showcases) before evaluating product fit.

## About this guide

- **Why it exists:** To help operators turn broad AI-governance language into decisions that can be implemented and audited.
- **How it was prepared:** Toone Content synthesized the control contracts used in Toone organization templates and checked product boundaries against the current repository. AI-assisted retrieval and drafting were used.
- **Accountability:** Toone Content owns the guide and its corrections. Product behavior remains bounded to the current repository and linked policy pages.
