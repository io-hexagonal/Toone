/** What the account page shows for an entitlement: plan, who bills it, the date line and how to manage it. */

import type { Entitlement, PlanInterval } from "@/lib/billing/api";

export type PlanProvider = "stripe" | "app_store" | "toone" | "guest" | "unknown";

export type PlanDateLine =
  | { key: "renews" | "ends" | "until"; date: string }
  | { key: "noEnd" | "lifetime" | "grace" };

export type PlanManage =
  /** The Stripe Customer Portal (`POST /billing/portal`). */
  | "portal"
  /** Apple's subscription settings; the site can only explain where. */
  | "app_store"
  /** Nothing is billed, or nothing can be changed (grants, guests, App Store lifetime, free). */
  | "none";

export type PlanView = {
  tier: "free" | "pro";
  provider: PlanProvider | null;
  interval: PlanInterval | null;
  dateLine: PlanDateLine | null;
  manage: PlanManage;
  creations: { used: number; limit: number; exhausted: boolean } | null;
  guestOf: string | null;
};

function providerOf(e: Entitlement): PlanProvider | null {
  if (e.plan !== "pro") return null;
  if (e.source === "guest") return "guest";
  if (e.billing_provider === "stripe" || e.billing_provider === "app_store" || e.billing_provider === "toone") return e.billing_provider;
  if (e.billing_provider === "unknown") return "unknown";
  // A server that predates `billing_provider`: purchases were App Store only and grants were Toone's.
  if (e.source === "subscription" || e.source === "lifetime") return "app_store";
  if (e.source === "grant") return "toone";
  return "unknown";
}

function manageOf(e: Entitlement, provider: PlanProvider | null): PlanManage {
  if (e.plan !== "pro") return "none";
  if (e.manage === "stripe_portal") return "portal";
  if (e.manage === "app_store") return "app_store";
  // Older servers never sent `manage`; an App Store subscription is managed by Apple.
  if (e.manage === null && provider === "app_store" && e.source === "subscription") return "app_store";
  return "none";
}

function intervalOf(e: Entitlement): PlanInterval | null {
  if (e.plan !== "pro") return null;
  if (e.plan_interval === "month" || e.plan_interval === "year" || e.plan_interval === "lifetime") return e.plan_interval;
  if (e.source === "lifetime") return "lifetime";
  return null;
}

function dateLineOf(e: Entitlement): PlanDateLine | null {
  if (e.plan !== "pro") return null;
  if (e.status === "grace") return { key: "grace" };
  if (e.source === "lifetime") return { key: "lifetime" };
  if (e.source === "subscription") {
    if (!e.expires_at) return null;
    if (e.will_renew === true) return { key: "renews", date: e.expires_at };
    if (e.will_renew === false) return { key: "ends", date: e.expires_at };
    return { key: "until", date: e.expires_at };
  }
  return e.expires_at ? { key: "until", date: e.expires_at } : { key: "noEnd" };
}

export function describePlan(e: Entitlement): PlanView {
  const provider = providerOf(e);
  const free = e.free_routine_creations;
  return {
    tier: e.plan === "pro" ? "pro" : "free",
    provider,
    interval: intervalOf(e),
    dateLine: dateLineOf(e),
    manage: manageOf(e, provider),
    creations: free && e.plan !== "pro"
      ? { used: Math.min(free.used, free.limit), limit: free.limit, exhausted: free.used >= free.limit }
      : null,
    guestOf: e.plan === "pro" && e.source === "guest" && e.guest_of ? e.guest_of.name || e.guest_of.email : null,
  };
}
