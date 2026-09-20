---
slug: "ai-agent-routines"
canonicalPath: "/ai-agent-routines"
title: "AI agent routines: recurring work written in plain English"
heading: "AI agent routines"
description: "What an AI routine is, how to write one in natural language, schedule it, add approval steps and review each run in Toone. Not a habit tracker."
eyebrow: "Routine design guide"
author: "Toone Content"
authorType: "Organization"
authorUrl: "/en/editorial-policy"
published: "2026-08-14"
updated: "2026-09-20"
readTime: "15 min read"
featured: true
image: "/assets/og/toone-og.png"
imageAlt: "Toone AI agent routines guide"
---
An AI agent routine is a bounded recurring or event-driven job with a named owner, explicit inputs and outputs, limited authority, retained evidence, and a stop or review condition. That is the working definition used in this guide, not a universal industry standard. It is not a habit tracker or a personal to-do list: the subject is recurring work a system performs on behalf of a team.

Toone is the AI workspace for your agentic workflows: a macOS app where specialist agents run your workflows and routines under your control. This guide covers the design decisions a routine needs before any tool runs it.

A schedule alone does not make a routine ready to operate. The contract also needs to say what happens when an input is stale, a request is delivered twice, a write may have succeeded, a reviewer rejects the output, or nobody can prove the final effect. The lifecycle and worksheet below turn those decisions into records that an operator can inspect.

## What belongs in an agent routine

A useful routine answers seven questions before its first run:

1. Who owns the intended outcome and the recovery decision?
2. What starts the work, in which timezone, and under which daylight-saving rule?
3. Which versioned inputs may the routine read?
4. Which tools, data, targets, and writes are allowed?
5. What evidence proves what the routine attempted and what happened?
6. Who reviews the result, using which acceptance criteria?
7. When may the routine retry, stop, quarantine work, or require a person to decide?

Scheduled, event-driven, and manually approved work need different controls. A scheduled trigger needs an explicit timezone and a decision about daylight-saving behavior. An event trigger needs a stable event identity and a rule for duplicates or late delivery. Manual approval is a decision point, not a schedule type: the record should bind the approver to the exact target, payload identity, action class, and expiry.

Scheduler behavior also varies by implementation. Google Cloud Scheduler documents at-least-once delivery and recommends idempotent handlers because a request can be repeated. Kubernetes says CronJob creation is approximate and that a Job should be idempotent because duplicate or missing Job creation can occur. AWS EventBridge Scheduler documents explicit timezones and daylight-saving behavior for its schedule types. These are service-specific contracts, so check the scheduler you use rather than borrowing another service's guarantee ([Google Cloud Scheduler overview](https://docs.cloud.google.com/scheduler/docs/overview?hl=en), [Google Cloud Scheduler troubleshooting](https://docs.cloud.google.com/scheduler/docs/troubleshooting?hl=en), [Kubernetes CronJob documentation](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/), [AWS EventBridge schedule types](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)).

## A complete recurring-job lifecycle

The following lifecycle is a design model. It separates a trigger from execution, review, recovery, and closure so a technical completion signal cannot silently stand in for an accepted business outcome.

| Stage | Required record | Exit evidence |
|---:|---|---|
| 1. Define the job | Stable job ID, intended outcome, accountable owner, non-goals, and review window | Accepted routine contract |
| 2. Choose the trigger | Scheduled time or interval, event condition, or manual approval point; timezone and daylight-saving behavior | Versioned trigger specification |
| 3. Bind inputs | Source owners, immutable input references or checksums, freshness window, and missing-data rule | Input receipt and explicit unknowns |
| 4. Bound authority | Allowed tools, data scope, target scope, prohibited actions, and approval triggers | Permission and approval contract |
| 5. Execute | Attempt ID, planned action, target, payload identity, timestamps, outputs, and errors | Run artifact and side-effect receipt where applicable |
| 6. Review | Acceptance criteria, reviewer type and identity, evidence checked, and accept or revise decision | Versioned review verdict |
| 7. Classify failure | Transient, terminal, rejected, unsafe, or side-effect-unknown; retry limit and delay | Failure receipt and next decision |
| 8. Reconcile callback or effect | Reserved, dispatched, consumed, observed effect, or unresolved state | Consumed callback, a recovered state, or a recorded unresolved effect |
| 9. Resume or stop | Recovery owner, successor attempt identity, compensation, or accountable decision | Authorized successor or terminal stop |
| 10. Close and review | Final artifact, outcome acceptance, remaining unknowns, retained evidence, and next review date | Completion receipt and accountable next owner |

The attempt ID should be different from the stable job ID. The stable ID groups runs of the same job. The attempt ID distinguishes one execution and gives retries or recovery work a separate identity.

Bounded permissions reduce what a routine is authorized to touch. They do not prove security, privacy, or safety. Those claims require their own evidence and accountable owners.

## Hypothetical example: a weekly product-proof source packet

This example is hypothetical. It describes an operating design, not a Toone product trace, customer deployment, or runtime test.

A content operations team wants a packet of current primary sources ready for a product-proof review every Monday.

### 1. Define and trigger the job

The owner creates one stable job for a Monday 09:00 UTC run. The job may use an approved list of public sources and write one internal draft packet. UTC makes the intended cadence explicit for this example; a team that chooses a regional timezone should also record what it expects when daylight-saving time changes.

The contract names a seven-day review window and excludes publication, outreach, product-record changes, and use of unapproved personal data. Each trigger carries the scheduled time, an immutable input-list identity, an attempt ID, and the output target.

### 2. Bind authority and evidence

The routine may read the approved public sources and write to one internal draft destination. It records each citation, publisher, source date, unavailable source, rejected optional claim, and the final draft checksum. The permission contract does not allow it to publish the packet or send it to an external recipient.

A reviewer checks the packet against written acceptance criteria before downstream use. The review record names the reviewer type and identity, the evidence checked, and an accept or revise decision. A successful write does not mean the packet is factually accepted.

### 3. Handle duplicate requests

A duplicate trigger with the same job, scheduled time, input identity, and target should not create a second packet. The team can use that combination as a deduplication key, or design the write so repeating it has the same result. The right method depends on the side effect.

A lock can prevent two workers from claiming the same key at once, but it cannot prove that an external write happened exactly once. The effect still needs a receipt or a read-back check against the intended target.

### 4. Classify failure before retrying

The routine uses separate failure classes:

- A transient source timeout can receive a bounded retry with a delay.
- A permanent authorization error stops immediately and goes to the owner of that source or permission.
- A rejected output returns for revision under a new attempt identity.
- An unsafe or prohibited action stops without execution.
- A write timeout after the destination may have accepted the packet is recorded as an unresolved effect.

Retries are suitable for transient faults, not every error. Azure's retry guidance warns that a service may process a request even when the caller loses the response, so retrying a non-idempotent operation can repeat the side effect. AWS documents finite retry settings and dead-letter queues for its scheduler; a dead-letter record is evidence of failed delivery after retries, not proof that the business task was correct ([Azure Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry), [AWS schedule management](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-schedule.html), [AWS dead-letter queues](https://docs.aws.amazon.com/scheduler/latest/UserGuide/configuring-schedule-dlq.html)).

### 5. Reconcile an uncertain write

The recovery owner inspects the exact draft target before authorizing another write:

1. If a draft with the expected checksum exists, record `RECOVERED` and do not write again.
2. If the team can prove that no matching draft exists, authorize a successor attempt with a new attempt ID.
3. If the target cannot be checked, keep the effect recorded as unresolved and stop.

Some workflows also need compensation after a partial effect. Azure's compensating-transaction guidance recommends recording progress, defining application-specific undo work, and recognizing points that cannot be reversed automatically. It also allows for manual intervention when recovery cannot be completed safely by the workflow ([Azure Compensating Transaction pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction)).

### 6. Close the job

Closure records the accepted artifact, rejected claims, unresolved sources, reviewer decision, retained receipts, next owner, and review date. A technical completion state remains separate from the reviewer's decision that the packet is suitable for use.

## How callback reconciliation can be recorded

One inspected SEO Growth organization uses Markdown operating contracts with routine metadata, cadence, triggers, inputs, numbered workflow steps, outputs, escalation, and optional parent-child controls. Its documented cadence values include `Daily`, `Weekly`, `Monthly`, `Continuous`, and `OnDemand`, with time or interval syntax defined by that organization.

The same documented design records callback states such as `CALLBACK_RESERVED`, `CALLBACK_DISPATCHED`, and `CALLBACK_CONSUMED`. It requires recovery checks before a repeat dispatch. Dated organization records also contain examples where an expired lease was reconciled as having no effect and an identity conflict was invalidated or quarantined before a successor attempt.

These are observations of organization files and dated operating records. They are not application telemetry and do not show that Toone executes schedules, delivers callbacks exactly once, retains complete history, retries automatically, heals failures, or diagnoses work in real time.

## Copyable routine-design worksheet

Leave an entry blank or mark it `UNKNOWN` when the answer is not available. An empty field is unresolved work, not permission to assume a favorable value.

### Identity, outcome, and trigger

| Field | Entry |
|---|---|
| Routine name | |
| Stable job ID | |
| Intended outcome | |
| Accountable owner | |
| Non-goals | |
| Trigger type | Scheduled / event-driven / manually approved |
| Trigger expression or event | |
| Timezone | |
| Daylight-saving rule | |
| Start date | |
| Stop date or review condition | |

### Inputs, output, and authority

| Field | Entry |
|---|---|
| Input sources and owners | |
| Input versions or immutable identities | |
| Freshness window | |
| Missing or stale input rule | |
| Expected output | |
| Destination | |
| Schema or format | |
| Acceptance criteria | |
| Allowed tools | |
| Allowed data scope | |
| Allowed target scope | |
| Prohibited actions | |

### Approval and review

| Field | Entry |
|---|---|
| Approval trigger | |
| Decision owner | |
| Exact target and action class | |
| Payload identity | |
| Approval expiry | |
| Reviewer type and identity | |
| Evidence the reviewer checks | |
| Review window | |

### Execution, failure, and recovery

| Field | Entry |
|---|---|
| Run ID and attempt ID | |
| Start and finish time | |
| Artifact receipt | |
| Side-effect receipt | |
| Failure classes | |
| Retry-eligible classes | |
| Maximum attempts | |
| Delay or backoff | |
| Retry budget | |
| Deduplication or idempotency key | |
| Effect-reconciliation method | |
| Stop, quarantine, compensation, or dead-letter condition | |
| Recovery owner | |
| Successor-attempt rule | |
| Terminal unknown state | |
| Retained evidence | |
| Remaining unknowns | |
| Next action and owner | |
| Next review date | |

## Where Toone fits

In Toone you write a routine in plain English, assign it to a specialist agent, schedule it, add the approval steps you want, and review each run. Two product facts belong in the contract above before you rely on a schedule:

- Routines run only while your Mac is online. A routine is not a hosted scheduler, so the trigger, freshness window, and missing-run rule should assume the machine can be off.
- Agents run on your own Anthropic or OpenAI account. Provider access, and its limits, stay under your control.

This page makes no claim about shipped retry, healing, delivery-guarantee, history-retention, reliability, performance, or time-saved behavior. Treat the lifecycle above as the design you are responsible for, not a guarantee any tool supplies.

## Review the contract before choosing a tool

The worksheet gives a team a way to compare a proposed routine with the operating controls it needs. If the team cannot name the owner, immutable inputs, allowed effects, acceptance criteria, retry boundary, and recovery method, choosing a scheduler or agent platform will not resolve the missing decisions.

Use the related guides to examine [agent governance](/en/governance), [how to bound a first rollout](/en/guides/ai-agent-adoption-roadmap), and [how organizational knowledge is owned](/en/organizational-knowledge). For related examples and their stated evidence boundaries, [see the Toone showcases](/en/showcases).

## Who made this guide and how

Toone Content is the organizational author, and Hexagonal.io is the publisher. The editorial owner is the Toone Content team. This non-YMYL guide was produced by synthesizing the approved brief, current primary scheduler and architecture documentation, and inspected organization-design records. Automated assistance contributed to research organization and drafting.

The guide distinguishes vendor documentation, editorial synthesis, hypothetical design, and local organization observations. It does not claim hands-on product testing, customer deployment evidence, human review, or Toone Product/Engineering verification. Organization-contract accuracy belongs to the Technical SEO Lead's review remit. Any claim about shipped Toone runtime behavior requires evidence and review from the responsible Toone Product/Engineering owner before it can be added.

The reason for publishing this guide is to help operators define recurring work that can be reviewed and recovered, including the uncomfortable cases where a side effect is unknown. Questions and corrections can be sent through the [contact route](/en/contact), and the sourcing and correction process is described in the [editorial policy](/en/editorial-policy).
