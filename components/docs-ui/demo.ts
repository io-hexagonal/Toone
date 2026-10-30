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
    /** Your own submissions (Explore → My submissions); dates in the app's format. */
    submissions: {
      pending: {
        name: "Produce a research brief",
        submitted: "Oct 30, 2026",
        summary: "Turns a topic into a sourced research brief saved in your project.",
      },
      approved: {
        name: "Weekly growth digest",
        submitted: "Oct 22, 2026",
        summary: "Collects the week's growth numbers and writes a short digest for the team.",
      },
      rejected: {
        name: "Competitor watch",
        submitted: "Oct 20, 2026",
        summary: "Checks two competitors' pricing pages each week and notes what changed.",
        reviewNote:
          "The shared copy still points to a folder on your Mac. Turn it into an input people fill in, then share it again.",
      },
    },
  },
  /** The in-app browser's page (URL field shows currentURL.absoluteString). */
  browser: {
    url: "https://acme.com/",
    pageTitle: "Acme",
    /** A tab an agent opened while preparing launch sites (browser-agent-tab). */
    agentTab: { agent: "Launch Planner", pageTitle: "Product Hunt" },
  },
  people: { you: "Sam Rivera", guest: "Alex Kim" },
  device: "Sam's iPhone",
  /** First 8 characters of the device id (Settings → Mobile shows prefix + "..."). */
  deviceIdPrefix: "7C2F91AE",
  pairingCode: "K7Q2XD",
  /** Calendar week (calendar-week): one routine, one user, one agent-proposed event. */
  calendar: {
    weekTitle: "Oct 26–1",
    userEvent: "Launch review",
    proposedEvent: "Pricing sync",
  },
  /** Project History (timeline-list / timeline-detail): the demo repo's commits, newest first. */
  timeline: {
    repoPath: "/Users/sam/Projects/acme-growth",
    checked: "Checked 1 minute ago",
    commits: [
      { subject: "Add pricing brief", author: "Research Assistant", when: "12 minutes ago" },
      { subject: "Tighten brief template", author: "You", when: "1 hour ago" },
      { subject: "Save launch plan", author: "Launch Planner", when: "3 hours ago" },
    ],
  },
  /** Live Share: Alex Kim's request to join Sam's project (example.com is a reserved domain). */
  liveShare: {
    guestEmail: "alex.kim@example.com",
    guestAccount: "7c1e4b2a-9d3f-4e8a-b6c5-2f1a0d9e8b47",
    guestDevice: "MCowBQYDK2Vw…Q9xT2aLk",
    requestExpires: "Oct 30, 2026 at 4:12:09 PM",
  },
  /** Voice: the live transcript while push-to-talk is held. */
  voice: { transcript: "Draft a brief on acme.com pricing vs. two competitors", locale: "EN" },
  /** A short chat with Research Assistant (agent-spotlight): auto-titled thread, one exchange. */
  spotlightChat: {
    title: "Compare pricing pages",
    user: "Compare acme.com's pricing page with the two competitors.",
    agent: "On it. I'll save the comparison to briefs/2026-10-30-pricing.md.",
    userTime: "10:42 AM",
    agentTime: "10:42 AM",
    chip: "OPUS · HIGH",
  },
  /** The project doc the Research Assistant is pointed at (agent-purpose-reply). */
  positioningDoc: "docs/acme-positioning.md",
  /** Meeting notes saved after a pricing sync (meeting-summary-reply). */
  meetingNotes: "meetings/2026-10-30-pricing-sync.md",
  /** A file whose screened output Safe Mode withheld (chat-tool-output-withheld). */
  callNotes: "notes/pricing-call.md",
  /**
   * Setting up Launch Surface Preparation from Explore (setup-input-question,
   * setup-run-question, setup-checklist-finished): the first 8 hex of the
   * setup fingerprint the run question quotes as "(ref …)", and the site an
   * agent asks to import logins for (browser-site-approval).
   */
  setup: { ref: "3f9a1c2e", site: "acme.com", loginDomain: "producthunt.com" },
  /**
   * The iPhone companion's Agents tab (mobile-companion-home). Times are the
   * app's absolute short timestamps (ThreadTimestamp.short), matching the
   * desktop chat's 10:42 AM.
   */
  mobile: {
    otherThread: { agent: "Launch Planner", title: "Launch checklist", preview: "Here is the checklist for launch day, grouped by owner.", time: "Yesterday" },
    systemTime: "10:44 AM",
    agentDescriptions: {
      research: "Turns a topic into a structured research brief.",
      writer: "Writes the weekly growth digest.",
      launch: "Plans launch day and prepares the launch sites.",
    },
  },
  /** Settings → Account while signed in (settings-account-signed-in); example.com is a reserved domain. */
  account: { email: "sam.rivera@example.com" },
  /**
   * A support agent that only the general "acme.com" project has
   * (project-scope-compare). Kept out of DEMO.agents, which some scenes list
   * in full.
   */
  supportAgent: { name: "Support Assistant", department: "Support" },
} as const;
