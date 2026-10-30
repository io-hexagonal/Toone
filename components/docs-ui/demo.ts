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
  explore: {
    routines: ["Launch Surface Preparation", "Launch Content Production"],
    bundle: "Product Launch Essentials",
  },
  people: { you: "Sam Rivera", guest: "Alex Kim" },
  device: "Sam's iPhone",
  pairingCode: "K7Q2XD",
} as const;
