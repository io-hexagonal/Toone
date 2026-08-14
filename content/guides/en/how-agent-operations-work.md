---
locale: "en"
slug: "how-agent-operations-work"
canonicalPath: "/guides/how-agent-operations-work"
title: "How Agent Operations Work: From Request to Reviewed Artifact"
heading: "How Agent Operations Work: From Request to Reviewed Artifact"
description: "Follow an eight-stage agent operating loop that assigns owners, bounds tools, records evidence, handles uncertain side effects, and ends with review."
eyebrow: "Agent operations guide"
author: "Toone Content"
authorType: "Organization"
authorUrl: "/en/editorial-policy"
published: "2026-08-14"
updated: "2026-08-14"
readTime: "17 min read"
featured: true
image: "/assets/og/toone-og.png"
imageAlt: "Toone guide to agent operations"
sourceWorkId: "CNT-editorial-post-a44edaec"
sourceSha256: "374faf21eaf71d93e2efb73c4427942b8940affd2ecbe290eaf98a9d2643082a"
---
An agent operating loop is a controlled path from a bounded request to a reviewed artifact. The loop assigns responsibility, registers inputs, limits tools and data, records actions and evidence, checks the result, handles failure, and ends in an explicit accepted, revised, or stopped state.

That definition is the working model used in this guide. It combines current provider and risk-management guidance with a practical operating contract. It is not a universal standard or a description of a specific product.

The loop matters because an agent's statement that it finished is only one kind of evidence. A useful operating record separates what a source or system observed, what a design requires, what the agent asserts, what an accountable operator decided, and what remains unknown.

## Start by deciding whether the work needs an agent

Do not begin with a tool. Begin with the job, its decision owner, and the evidence required at the end.

[Microsoft's business-planning guidance for AI agents](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan) distinguishes predictable work that can use regular code, static retrieval tasks, and work that needs dynamic reasoning or tool use. [Anthropic's guide to building effective agents](https://www.anthropic.com/engineering/building-effective-agents) similarly separates predefined workflows from agents that direct their own process and tool use, and recommends the least complex design that fits the task. These are decision aids, not hard technical laws.

Use a deterministic program or predefined workflow when the rules, step order, inputs, and expected output are stable and testable. Use retrieval when the job is to find grounded information from a known body of documents without dynamic tool sequencing. Keep the workflow human-owned when the central act is policy, accountability, taste, or acceptance and dynamic execution adds little.

An agent becomes a reasonable candidate when the work needs contextual decisions across unstructured inputs, changing tool sequences, or exceptions, and when the organization can still define:

- the outcome and accountable owner;
- allowed inputs, tools, data, and targets;
- prohibited actions and approval points;
- evidence another reviewer can inspect;
- a recovery owner and safe stop state;
- an acceptance test for the final artifact.

If those fields cannot be written, adding an agent makes the uncertainty harder to see.

## Use five evidence grades

These labels prevent an agent's narration from being treated as proof. They are this guide's editorial model.

| Evidence grade | Meaning | What it can support | What it cannot support |
|---|---|---|---|
| **Source fact** | A timestamped primary document, responsible-system response, or independently observed effect. | The stated fact was observed within the source's recorded scope. | Completeness beyond that scope or an unobserved side effect. |
| **Documented design rule** | A versioned operating contract says a role, stage, approval, receipt, or recovery rule should exist. | The organization designed and recorded the rule. | That software enforced it or that every run followed it. |
| **Agent assertion** | An agent states an intention, interpretation, result, or cause. | A hypothesis or proposed result for review. | Execution, correctness, approval, or business completion. |
| **Operator decision** | An accountable person or authorized system approves, rejects, accepts, stops, or chooses a recovery path. | The decision is known when its owner, scope, evidence, target, and time are bound. | That the approved action occurred or succeeded. |
| **Unresolved unknown** | Available evidence cannot establish what happened or whether the result is valid. | A reason to stop, reconcile, or gather stronger evidence. | Permission to guess, retry, or declare success. |

One event can involve several grades. An agent may propose writing a file, an operator may approve one target and checksum, and the target system may later confirm the write. Those are an agent assertion, an operator decision, and a source fact. Combining them into “the agent completed the work” hides the distinctions a reviewer needs.

## The eight-stage operating loop

Each stage should expose the owner, input, allowed scope, action, decision, output, receipt, failure state, recovery owner, and exit condition relevant to that point. The fields below form one operating contract, not a claim that every implementation uses the same names.

| Stage | Responsibility and decision | Input, tools, action, and handoff | Output, evidence, failure, recovery, and exit |
|---:|---|---|---|
| **1. Bound the request** | An outcome owner defines the business result and decides whether the request is accepted. | Record the job ID, task, audience, non-goals, risk boundary, and acceptance criteria. No execution tool is needed yet. | Exit with an accepted scope. Ambiguous ownership or conflicting goals return to the request owner. |
| **2. Register the inputs** | A source owner or operator confirms what evidence may enter the job. | Record source identities, dates or versions, checksums where useful, freshness limits, and missing-data rules. Hand off an immutable input manifest. | Exit with an input receipt and explicit unknowns. Missing load-bearing evidence stops or narrows the job. |
| **3. Assign responsibility** | The outcome owner names the agent or workflow role, operator, reviewer, approval owner, and recovery owner. | Map who may propose, execute, approve, review, retry, and stop. Record conflicts and unavailable roles. | Exit with a responsibility map. An unowned decision remains a blocker. |
| **4. Plan within scope** | The operator or policy owner decides whether the proposed path stays inside the contract. | Record steps, allowed tools and data, target scope, prohibited actions, approval triggers, budget, and retry limits. Hand off a reviewable plan or deterministic instruction. | Exit with an accepted plan. Scope expansion returns to the decision owner instead of being inferred. |
| **5. Execute and record** | The execution role performs only allowed actions; the approval owner decides consequential actions where required. | Bind the action to a target and immutable payload identity. Record timestamps, tool inputs and outputs, state changes, errors, and side-effect receipts. | Exit with an observable result or preserved uncertainty. A timeout after a possible write enters reconciliation, not blind retry. |
| **6. Review the artifact** | A named reviewer applies written acceptance criteria. | Compare the output with the request, sources, policy, evidence, and prohibited outcomes. Record reviewer identity and type, uncertainty, and limitations. | Exit with `ACCEPT`, `REVISE`, or `HOLD`. Technical completion alone does not establish usefulness or correctness. |
| **7. Recover or stop** | The recovery owner classifies failure and chooses retry, repair, compensation, transfer, or stop. | Reconcile possible side effects, inspect the exact target, preserve the failed attempt, and bind any successor to a new attempt identity. | Exit with `RECOVERED`, an authorized fresh attempt, or a terminal unknown or stop. Never erase the failed record. |
| **8. Close and hand off** | The outcome owner accepts the final state and assigns the next decision. | Package the accepted artifact, evidence, review verdict, remaining unknowns, and next owner. Retain only governed evidence. | Exit with a receipt-bound artifact and explicit next state. “Done” without an acceptance record does not close the business job. |

The loop is sequential as an accountability model, but implementation may revisit stages. New evidence can send a draft back to input registration. A failed review can return to planning. A recovery can create a successor attempt. The record should show that movement instead of rewriting the previous state.

## Worked example: a vendor research packet

This example is hypothetical. It does not describe Toone, a customer deployment, or a tested product run.

A procurement team needs a review packet covering three potential software vendors. The request is limited to public primary sources. The agent may draft one internal packet. It may not contact vendors, create accounts, accept terms, change procurement records, or publish the packet.

### 1. Bound request

The Procurement Operations Lead owns the outcome. The accepted result is one packet containing each vendor's current public product description, pricing source where published, data-handling documentation, unresolved questions, and citations. A procurement recommendation is outside scope.

The acceptance criteria require direct source links, observation dates, separation of source fact from analysis, and a visible unknown state for missing evidence.

### 2. Registered inputs

The operator records the three vendor domains, their public documentation areas, the review date, and the approved source types. The input manifest excludes user reviews, generated summaries without primary links, private documents, and personal data.

Each source snapshot receives a date and stable reference. A source that cannot be accessed remains an unresolved unknown. The agent is not allowed to invent or infer its contents.

### 3. Responsibility map

| Responsibility | Hypothetical owner |
|---|---|
| Business outcome | Procurement Operations Lead |
| Source boundary | Procurement Analyst |
| Research and draft | Vendor Research Agent, version `example-v1` |
| Artifact review | Procurement Analyst |
| External communication approval | Procurement Operations Lead |
| Failure and recovery | Procurement Systems Owner |

The names describe roles in the fictional example. They are not Toone roles or evidence of human review for this guide.

### 4. Scoped plan

The agent proposes four steps: collect approved sources, extract dated facts, draft comparison-neutral vendor sections, and assemble the internal packet. It can use public web reads and one internal draft target. Every external write, message, form submission, account action, or record change is prohibited.

The operator accepts the plan and binds one output target plus the planned payload identity. Approval is an operator decision. It is not proof that the draft was written.

### 5. Execution and uncertain side effect

Source collection completes and produces a source manifest. The agent proposes the packet and states that it wrote the draft. That statement is an **agent assertion**.

The draft tool returns a timeout after the remote service may have accepted the request. The error response is a **source fact**. Whether the draft exists is an **unresolved unknown**. Retrying immediately could create a duplicate or overwrite a file that already exists.

### 6. Review cannot begin yet

The reviewer has no stable artifact to inspect, so review remains blocked. An agent assertion and a timeout do not satisfy the artifact receipt.

### 7. Recovery branch

The Procurement Systems Owner checks the exact target and expected payload hash before authorizing any retry.

1. If the expected draft exists with the approved hash, record `RECOVERED` and do not repeat the write.
2. If the target is inspectable and the draft is absent, authorize a fresh attempt under a new attempt ID.
3. If the target cannot be inspected, record `WRITE_UNCERTAIN` and stop. Missing evidence is not permission to retry.

The recovery choice is an **operator decision**. The target observation that supports it is a **source fact**. The rule requiring reconciliation before retry is a **documented design rule** in this example's operating contract.

### 8. Review and closure

Suppose the matching draft exists and is recovered. The reviewer checks each material claim against the source manifest, marks one unsupported comparison for removal, and returns `REVISE`. The agent produces a successor draft under a new artifact checksum. The reviewer accepts that version.

The closure receipt records the accepted checksum, source manifest, removed claim, reviewer decision, remaining unknowns, and the Procurement Operations Lead as the next owner. It does not say the vendors were approved or contacted.

## Why uncertain writes need a separate recovery path

Retrying is appropriate only when the failure and side effects make a repeat safe. OpenAI's [practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) recommends assessing tool risk through factors such as read versus write access, reversibility, permissions, and financial impact. It also describes human intervention for failure thresholds and high-risk or irreversible actions.

NIST AI 600-1 includes governance actions for defined roles, human oversight, retained evaluation history, deactivation, incident response, and fallbacks for dependencies. [NIST describes the Generative AI Profile as voluntary cross-sector guidance](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), so those actions are guidance rather than certification, a legal requirement, or product proof.

For an uncertain write, the operating question is not “Can the agent try again?” It is “Can the accountable owner establish whether the first effect happened?” The answer determines the branch:

| Observed state | Safe record | Next action |
|---|---|---|
| Expected effect exists and matches the approved target and payload | `RECOVERED` | Keep the effect and continue review without repeating it. |
| Target is inspectable and expected effect is absent | `RETRY_ELIGIBLE` | Authorize a fresh attempt with a new identity and the same or revised scope. |
| Effect occurred but differs from approval | `REMEDIATION_REQUIRED` | Stop normal work, preserve evidence, and assign repair or compensation. |
| Target cannot be inspected or evidence conflicts | `WRITE_UNCERTAIN` | Stop. Do not retry until stronger evidence resolves the side effect. |

This distinction matters even when an execution system reports a failure. A failed response can coexist with a completed external effect.

## Operating-contract worksheet

Use this worksheet before assigning recurring or consequential work to an agent. Keep empty fields visible as unresolved work.

| Field | Record |
|---|---|
| **1. Request or job ID** | Stable identity shared by the request, attempts, artifacts, and receipts. |
| **2. Intended outcome and accountable owner** | The business result, who accepts it, and what acceptance does not authorize. |
| **3. Task and non-goals** | Work included, work excluded, prohibited outcomes, and foreseeable misuse. |
| **4. Inputs and source identities** | Source owners, versions or dates, freshness limits, checksums where useful, and missing-data rule. |
| **5. Responsibility map** | Agent or workflow role, operator, approval owner, reviewer, recovery owner, and next owner. |
| **6. Allowed tools and data** | Read and write scope, permitted targets, data classes, credentials boundary, and retention rule. |
| **7. Prohibited actions** | External writes, messages, purchases, submissions, permission changes, publication, or other excluded effects. |
| **8. Entry criteria and exit evidence** | What must be true before work begins and what receipt proves the stage can close. |
| **9. Consequential-action identity** | Exact target, immutable payload hash, action class, approval scope, and approval expiry. |
| **10. Approval trigger and owner** | Which action needs a decision, who decides, what evidence they inspect, and how the decision is recorded. |
| **11. Execution and side-effect receipt** | Attempt ID, timestamps, tool result, target observation, artifact checksum, and any conflicting evidence. |
| **12. Review record** | Acceptance criteria, reviewer identity and type, evidence checked, verdict, uncertainty, and limitations. |
| **13. Failure and recovery** | Failure classes, retry eligibility, attempt limit, reconciliation method, recovery owner, and compensation path. |
| **14. Unknowns and retirement** | Unresolved facts, retained evidence, stop condition, deactivation rule, and review date. |
| **15. Next action and terminal state** | Accepted artifact, next owner, next decision, and whether the job is accepted, revised, held, stopped, or retired. |

### A compact copyable version

```text
Job ID:
Outcome owner:
Outcome:
Task boundary:
Non-goals:
Inputs and source versions:
Agent or workflow role:
Operator:
Reviewer and reviewer type:
Recovery owner:
Allowed tools and data:
Prohibited actions:
Entry criteria:
Exit evidence:
Target and payload identity:
Approval trigger and owner:
Execution receipt:
Review criteria and verdict:
Failure classes:
Reconciliation method:
Retry limit:
Unknowns:
Stop or retirement condition:
Next action and owner:
```

## Stop conditions

Stop or transfer control when any of these conditions applies:

- a high-risk, sensitive, or irreversible action needs an accountable approval;
- the task leaves its accepted scope or needs an unapproved tool, source, target, or permission;
- the failure threshold or retry limit is reached;
- a possible external side effect cannot be reconciled;
- load-bearing evidence is missing, stale, contradictory, or cannot be tied to the artifact;
- the reviewer or recovery owner is unavailable;
- the output fails a hard acceptance condition;
- a deterministic workflow can perform the job more predictably with less judgment;
- the expected value no longer justifies the cost, delay, or risk;
- policy, legal, privacy, security, or domain questions require a qualified owner outside the agent's authority.

A stop is a valid result when it preserves evidence and names the next owner. Continuing without authority is not progress.

## A documented organization contract is design evidence

The inspected SEO Growth organization provides one example of a documented operating design. Its handbook and routine records assign stage owners, inputs, decisions, outputs, locks, callback states, checksums, and receipts. The documented contract also reserves consequential outward actions for a live approval step.

Those records show what the organization designed and recorded. They do not establish that Toone Desktop enforced the contract, executed every stage, retained complete history, recovered automatically, or produced a business outcome. This article uses them only to illustrate the difference between a **documented design rule** and a **source fact**.

## Choose the next owner by the question you still have

If the unresolved question is who may approve an action or accept residual risk, continue to [AI agent governance](/en/governance). If the team needs category context first, read the [AI-native company guide](/en/guides/ai-native-company). Use [showcases](/en/showcases) only for proof documented on those pages.

Related concept owners for organizational knowledge, agent organizations, routines, evaluation, and observability should be linked here once their canonical routes are live. This draft does not treat planned routes as current proof.

## About this guide

**Who:** Toone Content is the organizational author, and Hexagonal.io is the publisher. The Content Editor agent is the accountable editorial-review role for this draft. No human, product, engineering, security, privacy, legal, or subject-matter review is claimed.

**How:** The guide was prepared from a G1-approved brief and a checksum-pinned claim and source dossier. Automated assistance helped collect, organize, and synthesize current primary guidance from Microsoft, OpenAI, Anthropic, and NIST. The five evidence grades, eight-stage loop, failure example, and worksheet are editorial synthesis. The vendor-research example is fictional. No Toone product test, customer deployment, performance study, or benchmark informed the article.

**Why:** The guide is intended to help operators and team leads make agent work inspectable from request through review, with clear authority, evidence, failure, recovery, and exit states.

**Limits and corrections:** Operating needs vary by task, risk, jurisdiction, and system. Legal, regulated, safety-sensitive, privacy, security, and other high-impact work requires qualified review beyond this editorial model. See the [editorial, sources, and corrections policy](/en/editorial-policy). Use the [Toone contact page](/en/contact) for general questions. Send corrections with the affected URL and supporting evidence to [hello@trytoone.com](mailto:hello@trytoone.com). Material corrections should update the source date and invalidate dependent locale versions until review is complete.

## Primary sources

- [Microsoft Learn: Business plan for AI agents](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan), updated 2026-04-10.
- [OpenAI: A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), accessed 2026-08-13.
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), published 2024-12-19.
- [NIST AI 600-1: Artificial Intelligence Risk Management Framework, Generative Artificial Intelligence Profile](https://doi.org/10.6028/NIST.AI.600-1), published 2024-07-26.
