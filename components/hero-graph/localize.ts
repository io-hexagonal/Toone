// Puts the page's language into the hero graph and keeps every label inside its card.
// Hand-written (not generated): the markup ships English labels; this swaps them in the DOM
// before the runtime starts, so nothing flashes.

export type HeroGraphLabels = {
  steps: Record<StepKey, string>;
  subs: Record<StepKey, string[]>;
  running: string;
};

type StepKey = "research" | "findLeads" | "designFiles" | "publishSocial";

const EN_STEPS: Record<StepKey, string> = {
  research: "Research",
  findLeads: "Find leads",
  designFiles: "Design files",
  publishSocial: "Publish to social media",
};

const EN_SUBS: Record<StepKey, string[]> = {
  research: ["Gather sources", "Analyse with Claude", "Cross-check with ChatGPT", "Summarise findings"],
  findLeads: ["Search LinkedIn", "Filter by fit", "Enrich profiles", "Shortlist leads"],
  designFiles: ["Fetch brand voice", "Design in Figma", "Review spacing", "Animate in Higgsfield"],
  publishSocial: ["Adapt copy per platform", "Post to Threads", "Post to Facebook", "Post to Instagram"],
};

const MIN_TITLE_SCALE = 0.8;

export function localizeHeroGraph(root: HTMLElement, labels: HeroGraphLabels, locale: string) {
  const map = new Map<string, string>();
  for (const key of Object.keys(EN_STEPS) as StepKey[]) {
    map.set(EN_STEPS[key], labels.steps[key]);
    EN_SUBS[key].forEach((en, i) => {
      const translated = labels.subs[key]?.[i];
      if (translated) map.set(`${i + 1}. ${en}`, `${i + 1}. ${translated}`);
    });
  }
  map.set("RUNNING", labels.running.toLocaleUpperCase(locale));

  const texts = root.querySelectorAll<SVGTextElement>("text.hgb-t1, text.hgb-t2, text.hgb-live-t");
  for (const text of texts) {
    // Keep the English original so a re-run (locale change, remount) maps from the source.
    const source = (text.dataset.en ??= text.textContent ?? "");
    text.textContent = map.get(source) ?? source;
    text.style.removeProperty("font-size");
  }
  fitLabels(texts);
}

// SVG text doesn't wrap or clip, so measure with a canvas (works for hidden layers too) and
// shrink, then ellipsize, anything that would run into its neighbours.
function fitLabels(texts: NodeListOf<SVGTextElement>) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return;
  const measure = (el: SVGTextElement, size?: number) => {
    const cs = getComputedStyle(el);
    const px = size ?? parseFloat(cs.fontSize);
    ctx.font = `${cs.fontWeight} ${px}px ${cs.fontFamily}`;
    const spacing = parseFloat(cs.letterSpacing) || 0;
    return ctx.measureText(el.textContent ?? "").width + spacing * (el.textContent?.length ?? 0);
  };

  for (const text of texts) {
    if (text.classList.contains("hgb-live-t")) fitBadge(text, measure(text));
    else fitTitle(text, availableWidth(text), measure);
  }
}

// Step titles stop before the sub-routine count capsule; sub-step titles before the account
// logo, or the card's right padding when the sub-step uses no account.
function availableWidth(text: SVGTextElement): number {
  const x = parseFloat(text.getAttribute("x") ?? "0");
  const card = text.parentElement;
  if (!card) return Infinity;
  if (text.classList.contains("hgb-t1")) {
    const capsule = card.querySelector(":scope > g[transform] .hgb-cnt-rest")?.parentElement;
    const capX = capsule ? translateX(capsule) : NaN;
    if (!Number.isNaN(capX)) return capX - 6 - x;
  } else {
    const logo = card.querySelector(":scope > use");
    if (logo) return parseFloat(logo.getAttribute("x") ?? "0") - 6 - x;
  }
  const width = parseFloat(card.querySelector(":scope > rect")?.getAttribute("width") ?? "");
  return Number.isNaN(width) ? Infinity : width - 10 - x;
}

function fitTitle(text: SVGTextElement, max: number, measure: (el: SVGTextElement, size?: number) => number) {
  if (!Number.isFinite(max) || max <= 0) return;
  const size = parseFloat(getComputedStyle(text).fontSize);
  const width = measure(text);
  if (width <= max) return;
  const fitted = Math.max(size * MIN_TITLE_SCALE, (size * max) / width);
  text.style.fontSize = `${fitted.toFixed(2)}px`;
  let label = text.textContent ?? "";
  while (measure(text, fitted) > max && label.length > 4) {
    label = label.slice(0, -1);
    text.textContent = `${label.trimEnd()}…`;
  }
}

// The RUNNING pill grows leftwards so its right edge stays pinned to the card corner.
function fitBadge(text: SVGTextElement, width: number) {
  const group = text.parentElement;
  if (!group) return;
  const rects = group.querySelectorAll<SVGRectElement>(":scope > rect");
  const base = 40;
  const needed = Math.ceil(width + 10);
  const target = Math.max(base, needed);
  const current = parseFloat(rects[0]?.getAttribute("width") ?? `${base}`);
  if (target === current) return;
  rects.forEach((r) => r.setAttribute("width", String(target)));
  text.setAttribute("x", String(target / 2));
  const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(group.getAttribute("transform") ?? "");
  if (m) group.setAttribute("transform", `translate(${+m[1] - (target - current)} ${m[2]})`);
}

function translateX(el: Element): number {
  const m = /translate\(\s*([-\d.]+)/.exec(el.getAttribute("transform") ?? "");
  return m ? parseFloat(m[1]) : NaN;
}
