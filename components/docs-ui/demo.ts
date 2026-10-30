/**
 * Demo data for every docs figure (plan §0.4). One story across all pages;
 * nothing here comes from real users. Add to it rather than inventing names
 * inside a scene, so every figure tells the same story.
 */

export const DEMO = {
  projects: ["acme.com growth", "acme.com", "Launch kit"],
  activeProject: "acme.com growth",
  agents: {
    research: { name: "Research Assistant", department: "Growth" },
    launch: { name: "Launch Planner", department: "Launch" },
    writer: { name: "Growth Writer", department: "Growth" },
  },
  routine: {
    name: "Produce a research brief",
    owner: "Research Assistant",
    model: "App default",
    steps: ["Accept a topic", "Investigate a topic", "Organize the findings", "Save the brief"],
  },
  subRoutine: {
    name: "Investigate a topic",
    steps: ["Gather sources", "Separate evidence from assumptions"],
  },
  run: {
    number: 3,
    topic: "acme.com pricing vs. two competitors",
    started: "2 min ago",
  },
  artefact: "briefs/2026-10-30-pricing.md",
  /** Idle routines listed under the running one (Routines sidebar). */
  otherRoutines: {
    digest: { name: "Weekly growth digest", owner: "Growth Writer", cadence: "Weekly" },
    launchSites: { name: "Launch Surface Preparation", owner: "Launch Planner", cadence: "On demand" },
  },
  /** A routine whose steps run on two agents at once (orchestration). */
  launchRoutine: {
    name: "Launch day",
    run: 4,
    steps: ["Write the launch brief", "Prepare launch sites", "Draft launch posts"],
  },
  explore: {
    routines: ["Launch Surface Preparation", "Launch Content Production"],
    bundle: "Product Launch Essentials",
  },
  /** The in-app browser's page (URL field shows currentURL.absoluteString). */
  browser: { url: "https://acme.com/", pageTitle: "Acme" },
  people: { you: "Sam Rivera", guest: "Alex Kim" },
  device: "Sam's iPhone",
  pairingCode: "K7Q2XD",
} as const;
