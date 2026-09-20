import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProductGuidePageType =
  | "overview"
  | "tutorial"
  | "concept"
  | "feature-index"
  | "feature";

export type ProductGuidePage = {
  slug: string;
  title: string;
  navTitle: string;
  description: string;
  eyebrow: string;
  pageType: ProductGuidePageType;
  estimatedTime?: string;
  body: string;
};

export type ProductGuideNavItem = {
  slug: string;
  label: string;
  contentFile: string;
  nested?: boolean;
};

export type ProductGuideNavSection = {
  title: string;
  items: ProductGuideNavItem[];
};

export const PRODUCT_GUIDE_NAV: ProductGuideNavSection[] = [
  {
    title: "Start here",
    items: [
      { slug: "", label: "Overview", contentFile: "overview.md" },
      {
        slug: "getting-started",
        label: "Getting started",
        contentFile: "getting-started/index.md",
      },
    ],
  },
  {
    title: "Getting started",
    items: [
      {
        slug: "getting-started/install-and-connect",
        label: "Install and connect",
        contentFile: "getting-started/install-and-connect.md",
      },
      {
        slug: "getting-started/create-a-project",
        label: "Create a project",
        contentFile: "getting-started/create-a-project.md",
      },
      {
        slug: "getting-started/create-an-agent",
        label: "Create an agent",
        contentFile: "getting-started/create-an-agent.md",
      },
      {
        slug: "getting-started/create-a-routine",
        label: "Create a routine",
        contentFile: "getting-started/create-a-routine.md",
      },
      {
        slug: "getting-started/run-and-debug",
        label: "Run and debug",
        contentFile: "getting-started/run-and-debug.md",
      },
    ],
  },
  {
    title: "Understand Toone",
    items: [
      { slug: "concepts", label: "Core concepts", contentFile: "concepts.md" },
    ],
  },
  {
    title: "Features",
    items: [
      { slug: "features", label: "Overview", contentFile: "features.md" },
    ],
  },
  {
    title: "Experience",
    items: [
      {
        slug: "features/agent-spotlight",
        label: "Agent Spotlight",
        contentFile: "features/agent-spotlight.md",
        nested: true,
      },
      {
        slug: "features/workspace-windows",
        label: "Workspace windows",
        contentFile: "features/workspace-windows.md",
        nested: true,
      },
      {
        slug: "features/zen-mode",
        label: "Zen mode",
        contentFile: "features/zen-mode.md",
        nested: true,
      },
      {
        slug: "features/project-switcher",
        label: "Project switcher",
        contentFile: "features/project-switcher.md",
        nested: true,
      },
      {
        slug: "features/project-explorer",
        label: "Project Explorer",
        contentFile: "features/project-explorer.md",
        nested: true,
      },
    ],
  },
  {
    title: "Workflows",
    items: [
      {
        slug: "features/browser-sessions",
        label: "Browser sessions",
        contentFile: "features/browser-sessions.md",
        nested: true,
      },
      {
        slug: "features/routines",
        label: "Routines",
        contentFile: "features/routines.md",
        nested: true,
      },
      {
        slug: "features/orchestration",
        label: "Agent orchestration",
        contentFile: "features/orchestration.md",
        nested: true,
      },
      {
        slug: "features/workflow-library",
        label: "Workflow library",
        contentFile: "features/workflow-library.md",
        nested: true,
      },
      {
        slug: "features/calendar",
        label: "Calendar",
        contentFile: "features/calendar.md",
        nested: true,
      },
      {
        slug: "features/background-threads",
        label: "Background threads",
        contentFile: "features/background-threads.md",
        nested: true,
      },
    ],
  },
  {
    title: "Control and safety",
    items: [
      {
        slug: "features/project-history",
        label: "Project History",
        contentFile: "features/project-history.md",
        nested: true,
      },
      {
        slug: "features/safe-mode",
        label: "Safe Mode",
        contentFile: "features/safe-mode.md",
        nested: true,
      },
    ],
  },
  {
    title: "Connect",
    items: [
      {
        slug: "features/live-share",
        label: "Live Share",
        contentFile: "features/live-share.md",
        nested: true,
      },
      {
        slug: "features/voice-and-meetings",
        label: "Voice and meetings",
        contentFile: "features/voice-and-meetings.md",
        nested: true,
      },
      {
        slug: "features/mobile-companion",
        label: "Mobile companion",
        contentFile: "features/mobile-companion.md",
        nested: true,
      },
      {
        slug: "features/mcp-integrations",
        label: "MCPs and integrations",
        contentFile: "features/mcp-integrations.md",
        nested: true,
      },
      {
        slug: "features/ai-providers",
        label: "AI providers",
        contentFile: "features/ai-providers.md",
        nested: true,
      },
    ],
  },
];

const contentDirectory = path.join(process.cwd(), "content/product-showcase/en");
const flattenedItems = PRODUCT_GUIDE_NAV.flatMap((section) => section.items);

function readGuidePage(item: ProductGuideNavItem): ProductGuidePage {
  const filePath = path.join(contentDirectory, item.contentFile);
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const required = ["title", "navTitle", "description", "eyebrow", "pageType"];

  for (const key of required) {
    if (!data[key]) throw new Error(`Missing ${key} in ${filePath}`);
  }

  const pageType = String(data.pageType);
  if (!["overview", "tutorial", "concept", "feature-index", "feature"].includes(pageType)) {
    throw new Error(`Invalid pageType '${pageType}' in ${filePath}`);
  }

  return {
    slug: item.slug,
    title: String(data.title),
    navTitle: String(data.navTitle),
    description: String(data.description),
    eyebrow: String(data.eyebrow),
    pageType: pageType as ProductGuidePageType,
    estimatedTime: data.estimatedTime ? String(data.estimatedTime) : undefined,
    body: content.trim(),
  };
}

export function getProductGuidePage(slug: string): ProductGuidePage | null {
  const item = flattenedItems.find((candidate) => candidate.slug === slug);
  return item ? readGuidePage(item) : null;
}

/**
 * Repo-relative path of the markdown backing a product-guide slug. The sitemap
 * uses it to derive a real `lastmod` from git history (TECH-013).
 */
export function getProductGuideSourcePath(slug: string): string | null {
  const item = flattenedItems.find((candidate) => candidate.slug === slug);
  return item ? `content/product-showcase/en/${item.contentFile}` : null;
}

export function getProductGuideSlugs(): string[] {
  return flattenedItems.map((item) => item.slug).filter(Boolean);
}

export function getAdjacentProductGuidePages(slug: string): {
  previous: ProductGuideNavItem | null;
  next: ProductGuideNavItem | null;
} {
  const index = flattenedItems.findIndex((item) => item.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? flattenedItems[index - 1] : null,
    next: index < flattenedItems.length - 1 ? flattenedItems[index + 1] : null,
  };
}
