import { requirementFacts } from "@/lib/explore/requirements";
import { termLabel, type ExploreTaxonomy } from "@/lib/explore/taxonomy";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import OpenInToone from "./OpenInToone";
import EditListingLink from "./EditListingLink";
import CoverImage from "./CoverImage";
import {
  getExploreTaxonomy,
  resolveCardCoverUrl,
  resolveCoverUrl,
  resolveSlug,
} from "@/lib/explore/api";
import {
  cardText,
  catalogHref,
  deepLink,
  requestAccessHref,
  safeMarkdownUrl,
  type CatalogItem,
} from "@/lib/explore/presentation";
import type {
  PackageMember,
  RoutinePublicDetail,
  BundlePublicDetail,
} from "@/lib/explore/types";
import { formatPrice, isFree, type ExplorePrice } from "@/lib/explore/price";
import "./explore.css";

export const COPY_KEYS = [
  "category",
  "usefulFor",
  "filters",
  "applyFilters",
  "clearFilters",
  "closeFilters",
  "allCategories",
  "invalidFilters",
  "classification",
  "included",
  "youProvide",
  "produces",
  "useRoutine",
  "runsInToone",
  "forLabel",
  "whatYouGet",
  "whoItsFor",
  "useItWhen",
  "howItWorks",
  "whatYouProvide",
  "featured",
  "featuredLabel",
  "previousSlide",
  "nextSlide",
  "goToSlide",
  "pauseSlides",
  "playSlides",
  "viewRoutine",
  "viewBundle",
  "preparedDuringSetupNote",
  "youPrepare",
  "runEstimate",
  "example",
  "customize",
  "runsAsPublished",
  "defaultValue",
  "allowedValues",
  "worksWith",
  "whatItDoesThere",
  "cost",
  "reviewNote",
  "actionRead",
  "actionSignup",
  "actionProfile",
  "actionPost",
  "actionSubmit",
  "actionPay",
  "costFree",
  "costFreemium",
  "costPaid",
  "costUnknown",
  "staysInControl",
  "faq",
  "relatedRoutines",
  "learnRoutines",
  "routinesInside",
  "builders",
  "doneWhen",
  "connectedTools",
  "routineName",
  "bundleName",

  "title",
  "heading",
  "intro",
  "all",
  "routines",
  "bundles",
  "routine",
  "bundle",
  "search",
  "searchPlaceholder",
  "tags",
  "show",
  "topics",
  "clearTopic",
  "empty",
  "emptyCatalog",
  "unavailable",
  "unavailableBody",
  "retry",
  "results",
  "previous",
  "next",
  "page",
  "by",
  "approved",
  "open",
  "getToone",
  "steps",
  "agents",
  "subRoutines",
  "includedRoutines",
  "includedBundles",
  "purpose",
  "prerequisites",
  "escalation",
  "completion",
  "outcomes",
  "inputs",
  "skills",
  "requirements",
  "models",
  "mcps",
  "resources",
  "bindings",
  "revision",
  "details",
  "revisionId",
  "contentHash",
  "runsAs",
  "overview",
  "noTags",
  "eyebrow",
  "newer",
  "license",
  "back",
  "home",
  "breadcrumb",
  "contents",
  "minimumVersion",
  "bundleDescription",
  "skillIds",
  "agentIds",
  "noRequirements",
  "pinned",
  "free",
  "price",
  "viewRoutine",
] as const;
export type ExploreCopy = Record<(typeof COPY_KEYS)[number], string> & {
  count: (
    unit: "steps" | "agents" | "subRoutines" | "results" | "routines",
    count: number,
  ) => string;
};
export async function getExploreCopy(locale: string): Promise<ExploreCopy> {
  const t = await getTranslations({ locale, namespace: "explore" });
  return {
    ...Object.fromEntries(COPY_KEYS.map((key) => [key, t(key)])),
    count: (unit, count) => t(`${unit}Count`, { count }),
  } as ExploreCopy;
}
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function ExploreShell({ children }: { children: ReactNode }) {
  return (
    <div className="explore-shell">
      <SiteHeader scrollThreshold={160} />
      {children}
      <Footer />
    </div>
  );
}
export function ExploreUnavailable({
  ui,
  locale,
  retryHref,
}: {
  ui: ExploreCopy;
  locale: string;
  retryHref?: string;
}) {
  return (
    <ExploreShell>
      <main className="explore-hero">
        <div className="explore-width">
          <p className="explore-eyebrow">{ui.title}</p>
          <h1>{ui.unavailable}</h1>
          <p>{ui.unavailableBody}</p>
          <a
            href={retryHref || `/${locale}/explore`}
            className="explore-button"
          >
            {ui.retry}
          </a>
        </div>
      </main>
    </ExploreShell>
  );
}
export function Markdown({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="explore-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeMarkdownUrl}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                rel="nofollow noopener noreferrer"
                target={/^https?:/.test(href) ? "_blank" : undefined}
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ alt }) => <span>{alt}</span>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
/**
 * `inline` permits the legacy data-URL cover (detail hero only). Cards use
 * the placeholder tile instead so a page of them stays light.
 */
export function Cover({
  entry,
  className = "",
  inline = false,
  alt,
}: {
  entry: { cover_url?: string | null; cover_image_data_url?: string | null };
  className?: string;
  inline?: boolean;
  /** Described covers (listing profile `cover_alt`) are exposed to assistive tech. */
  alt?: string;
}) {
  const url = inline ? resolveCoverUrl(entry) : resolveCardCoverUrl(entry);
  const described = !!(url && alt);
  return (
    <span
      className={`explore-cover-frame${url ? "" : " explore-cover-empty"}`}
      aria-hidden={described ? undefined : "true"}
    >
      <span className="explore-cover-mark" aria-hidden={described ? "true" : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" />
      </span>
      {url && <CoverImage className={`explore-cover ${className}`} src={url} alt={described ? alt : undefined} />}
    </span>
  );
}
export function Tags({
  tags,
  locale,
  ui,
}: {
  tags: string[];
  locale: string;
  ui: ExploreCopy;
}) {
  if (!tags.length) return null;
  return (
    <ul className="explore-tags" aria-label={ui.tags}>
      {tags.map((tag) => (
        <li key={tag}>
          <a
            href={catalogHref(locale, { type: "all", page: 1, query: "", tag })}
          >
            {tag}
          </a>
        </li>
      ))}
    </ul>
  );
}
/** "Free", or the localized currency amount (contract §5 `price`). */
export function priceLabel(price: ExplorePrice | null | undefined, locale: string, ui: ExploreCopy): string {
  return formatPrice(price, locale, ui.free);
}
export function PriceTag({
  price,
  locale,
  ui,
  className = "explore-price",
}: {
  price: ExplorePrice | null | undefined;
  locale: string;
  ui: ExploreCopy;
  className?: string;
}) {
  return (
    <span className={className} data-free={isFree(price) || undefined}>
      <span className="explore-sr-only">{ui.price}: </span>
      {priceLabel(price, locale, ui)}
    </span>
  );
}
export function Counts({
  entry,
  ui,
}: {
  entry: { step_count: number; agent_count: number; sub_routine_count: number };
  ui: ExploreCopy;
}) {
  const stats: Array<["steps" | "agents" | "subRoutines", number]> = [
    ["steps", entry.step_count],
    ["agents", entry.agent_count],
  ];
  if (entry.sub_routine_count > 0) stats.push(["subRoutines", entry.sub_routine_count]);
  return (
    <ul className="explore-counts explore-stats">
      {stats.map(([unit, count]) => (
        <li key={unit}>
          <strong>{count}</strong>
          <span>{ui.count(unit, count).replace(/^[\d\s.,]+/, "")}</span>
        </li>
      ))}
    </ul>
  );
}
export function CatalogCard({
  item,
  locale,
  ui,
  taxonomy = null,
}: {
  item: CatalogItem;
  locale: string;
  ui: ExploreCopy;
  taxonomy?: ExploreTaxonomy | null;
}) {
  const { entry } = item;
  const href = `/${locale}/explore/${item.type}s/${resolveSlug(entry)}`;
  const text = cardText(entry);
  const audiences = entry.classification?.useful_for_ids ?? [];
  return (
    <article className="explore-card" data-explore-type={item.type}>
      <a href={href} className="explore-card-main">
        <div className="explore-card-art">
          <Cover entry={entry} />
          {item.type === "bundle" && (
            <div className="explore-cover-stack">
              {item.entry.members.slice(0, 2).map((member) => (
                <Cover key={member.workflow_id} entry={member} />
              ))}
            </div>
          )}
          <PriceTag price={entry.price} locale={locale} ui={ui} className="explore-price explore-price-card" />
        </div>
        <div className="explore-card-copy">
          <p className="explore-eyebrow">
            {item.type === "bundle"
              ? `${ui.bundle} · ${ui.count("routines", entry.member_count)}`
              : ui.routine}
          </p>
          <h2>{text.title}</h2>
          {entry.classification && <p className="explore-category-label">{termLabel(taxonomy, entry.classification.category_id)}</p>}
          <p className="explore-summary">{text.summary}</p>
          {audiences.length > 0 && (
            <p className="explore-card-for">
              <span>{ui.forLabel}:</span> {audiences.map((id) => capitalize(termLabel(taxonomy, id))).join(", ")}
            </p>
          )}
          <div className="explore-card-meta">
            {item.type === "routine" && <Counts entry={item.entry} ui={ui} />}
            {!!entry.results_count && (
              <span className="explore-card-results">{ui.count("results", entry.results_count)}</span>
            )}
            {entry.author_name && (
              <span className="explore-byline">
                {ui.by} {entry.author_name}
              </span>
            )}
          </div>
        </div>
      </a>
      {entry.tags.length > 0 && (
        <div className="explore-card-tags">
          <Tags tags={entry.tags} locale={locale} ui={ui} />
        </div>
      )}
    </article>
  );
}
export function capitalize(label: string): string {
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}
export function formatDate(
  locale: string,
  iso: string,
  style: "long" | "medium" = "long",
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: style,
    timeZone: "UTC",
  }).format(new Date(iso));
}
export async function DetailHero({
  detail,
  type,
  locale,
  ui,
}: {
  detail: RoutinePublicDetail | BundlePublicDetail;
  type: "routine" | "bundle";
  locale: string;
  ui: ExploreCopy;
}) {
  const id = "workflow_id" in detail ? detail.workflow_id : detail.bundle_id;
  const taxonomy = detail.classification ? await getExploreTaxonomy().catch(() => null) : null;
  return (
    <header className="explore-hero explore-hero-detail">
      <div className="explore-width">
        <nav className="explore-breadcrumb" aria-label={ui.breadcrumb}>
          <a href={`/${locale}`}>{ui.home}</a>
          <span>/</span>
          <a href={`/${locale}/explore`}>{ui.title}</a>
          <span>/</span>
          <span>{ui[type]}</span>
        </nav>
        <div className="explore-detail-head">
          <div className="explore-detail-copy">
            <p className="explore-eyebrow">
              {ui[type]}
              {type === "bundle"
                ? ` · ${ui.count("routines", detail.member_count)}`
                : ""}
            </p>
            <h1>{detail.title}</h1>
            <p className="explore-deck">{detail.summary}</p>
            <ul className="explore-hero-chips">
              <li className="explore-price-chip" data-free={isFree(detail.price) || undefined}>
                <span className="explore-sr-only">{ui.price}: </span>
                {priceLabel(detail.price, locale, ui)}
              </li>
            </ul>
            {detail.classification && <dl className="explore-classification" aria-label={ui.classification}>
              <div><dt>{ui.category}</dt><dd>{termLabel(taxonomy, detail.classification.category_id)}</dd></div>
              <div><dt>{ui.topics}</dt><dd>{detail.classification.topic_ids.map((id) => termLabel(taxonomy, id)).join(", ")}</dd></div>
              <div><dt>{ui.usefulFor}</dt><dd>{detail.classification.useful_for_ids.map((id) => termLabel(taxonomy, id)).join(", ")}</dd></div>
            </dl>}
            <dl className="explore-meta">
              {detail.author_name && (
                <div>
                  <dt>{ui.by}</dt>
                  <dd>{detail.author_name}</dd>
                </div>
              )}
              <div>
                <dt>{ui.approved}</dt>
                <dd>
                  <time dateTime={detail.approved_at}>
                    {formatDate(locale, detail.approved_at)}
                  </time>
                </dd>
              </div>
              {"license" in detail && (
                <div>
                  <dt>{ui.license}</dt>
                  <dd>{detail.license}</dd>
                </div>
              )}
              {"license" in detail && (
                <div>
                  <dt>{ui.steps}</dt>
                  <dd>{detail.step_count}</dd>
                </div>
              )}
              {"license" in detail && (
                <div>
                  <dt>{ui.agents}</dt>
                  <dd>{detail.agent_count}</dd>
                </div>
              )}
              {"license" in detail && detail.sub_routine_count > 0 && (
                <div>
                  <dt>{ui.subRoutines}</dt>
                  <dd>{detail.sub_routine_count}</dd>
                </div>
              )}
            </dl>
            <Tags tags={detail.tags} locale={locale} ui={ui} />
            <div className="explore-actions">
              <OpenInToone
                url={deepLink(type, id, detail.revision_id)}
                label={ui.open}
                locale={locale}
                item={`${type}:${id}`}
              />
              <a
                className="explore-button explore-button-secondary"
                href={requestAccessHref(locale, `${type}:${id}`)}
                data-umami-event="explore-request-access"
                data-umami-event-item={`${type}:${id}`}
              >
                {ui.getToone}
              </a>
              <EditListingLink kind={type} id={id} locale={locale} />
            </div>
          </div>
          <Cover entry={detail} inline />
        </div>
      </div>
    </header>
  );
}
/** Sticky right-rail card with the facts a reader can act on. Internal
    ids and content hashes stay in the API and the app, not on the page. */
export function DetailsCard({
  detail,
  ui,
  locale,
}: {
  detail: RoutinePublicDetail | BundlePublicDetail;
  ui: ExploreCopy;
  locale: string;
}) {
  const minimum =
    "package" in detail ? detail.package.minimum_app_version : undefined;
  return (
    <section className="explore-details" aria-label={ui.details}>
      <h2>{ui.details}</h2>
      <dl>
        <div>
          <dt>{ui.revision}</dt>
          <dd>{detail.sequence}</dd>
        </div>
        <div>
          <dt>{ui.approved}</dt>
          <dd>
            <time dateTime={detail.approved_at}>
              {formatDate(locale, detail.approved_at)}
            </time>
          </dd>
        </div>
        {detail.author_name && (
          <div>
            <dt>{ui.by}</dt>
            <dd>{detail.author_name}</dd>
          </div>
        )}
        {"license" in detail ? (
          <>
            <div>
              <dt>{ui.license}</dt>
              <dd>{detail.license}</dd>
            </div>
            <div>
              <dt>{ui.steps}</dt>
              <dd>{detail.step_count}</dd>
            </div>
            <div>
              <dt>{ui.agents}</dt>
              <dd>{detail.agent_count}</dd>
            </div>
            {detail.sub_routine_count > 0 && (
              <div>
                <dt>{ui.subRoutines}</dt>
                <dd>{detail.sub_routine_count}</dd>
              </div>
            )}
          </>
        ) : (
          <div>
            <dt>{ui.routines}</dt>
            <dd>{detail.member_count}</dd>
          </div>
        )}
        {minimum && (
          <div>
            <dt>{ui.minimumVersion}</dt>
            <dd>{minimum}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
function Chips({ items, mono = true }: { items: string[]; mono?: boolean }) {
  return (
    <ul className={`explore-chips${mono ? "" : " explore-chips-plain"}`}>
      {items.map((item, i) => (
        <li key={i}>{mono ? <code>{item}</code> : <span>{item}</span>}</li>
      ))}
    </ul>
  );
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
/**
 * Heading at `level + shift`. The fallback page renders the definition at
 * shift 0; inside the builders' `<details>` (under its own h2) it shifts by
 * one so the outline stays in order.
 */
function H({
  level,
  shift,
  children,
}: {
  level: 2 | 3 | 4;
  shift: 0 | 1;
  children: ReactNode;
}) {
  const Tag = `h${level + shift}` as "h2" | "h3" | "h4" | "h5";
  return <Tag>{children}</Tag>;
}
/** Labels that differ between the legacy page and the builders' section. */
type DefinitionLabels = { completion: string; mcps: string };
function MemberContent({
  member,
  root,
  ui,
  agentNames,
  shift = 0,
  labels,
}: {
  member: PackageMember;
  root: boolean;
  ui: ExploreCopy;
  agentNames: Map<string, string>;
  shift?: 0 | 1;
  labels: DefinitionLabels;
}) {
  const payload = member.payload;
  return (
    <div
      id={root ? "routine" : "member-" + encodeURIComponent(member.key)}
      className="explore-member"
    >
      {!root && (
        <header className="explore-member-head">
          <p className="explore-eyebrow">{ui.subRoutines}</p>
          <H level={2} shift={shift}>{payload.name || member.key}</H>
        </header>
      )}
      {payload.purpose && (
        <section className="explore-section">
          <H level={2} shift={shift}>{ui.purpose}</H>
          <div className="explore-lede">
            <Markdown text={payload.purpose} />
          </div>
          <Markdown text={payload.preamble} />
        </section>
      )}
      {!payload.purpose && payload.preamble && (
        <section className="explore-section">
          <H level={2} shift={shift}>{ui.overview}</H>
          <Markdown text={payload.preamble} />
        </section>
      )}
      {payload.prerequisites && (
        <section className="explore-section">
          <H level={2} shift={shift}>{ui.prerequisites}</H>
          <Markdown text={payload.prerequisites} />
        </section>
      )}
      {!!payload.steps?.length && (
        <section className="explore-section">
          <H level={2} shift={shift}>{ui.steps}</H>
          <ol className="explore-steps">
            {payload.steps.map((step, index) => {
              const executor = step.executorAgentId
                ? (agentNames.get(step.executorAgentId) ?? step.executorAgentId)
                : null;
              return (
                <li
                  key={step.id}
                  id={root ? `step-${index + 1}` : undefined}
                  className="explore-step"
                >
                  <div className="explore-step-head">
                    <span className="explore-step-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <H level={3} shift={shift}>{step.title}</H>
                    {executor && (
                      <span className="explore-step-agent">
                        <span>{ui.runsAs}</span>
                        {executor}
                      </span>
                    )}
                  </div>
                  <div className="explore-step-body">
                    <Markdown text={step.description} />
                    {!!step.completionCriteria?.length && (
                      <div className="explore-criteria">
                        <H level={4} shift={shift}>{labels.completion}</H>
                        <ul>
                          {step.completionCriteria.map((criterion, i) => (
                            <li key={i}>
                              <Markdown text={criterion} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!!step.outcomes?.length && (
                      <div className="explore-outcomes">
                        <H level={4} shift={shift}>{ui.outcomes}</H>
                        <ul>
                          {step.outcomes.map((outcome) => (
                            <li key={outcome.id}>
                              <code>{outcome.id}</code>
                              <Markdown text={outcome.description} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(step.subRoutineId || !!step.skillIds?.length) && (
                      <ul className="explore-step-meta">
                        {step.subRoutineId && (
                          <li>
                            <span>{ui.routine}</span>{" "}
                            <code>{step.subRoutineId}</code>
                          </li>
                        )}
                        {!!step.skillIds?.length && (
                          <li>
                            <span>{ui.skills}</span> {step.skillIds.join(", ")}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {payload.escalation && (
        <section className="explore-section">
          <H level={2} shift={shift}>{ui.escalation}</H>
          <Markdown text={payload.escalation} />
        </section>
      )}
    </div>
  );
}
/**
 * The routine definition as published: members, steps, agents, skills and
 * requirements. The legacy page shows it as the page body; a page with a
 * listing profile keeps it, collapsed, in the builders' section.
 */
export function RoutineDefinition({
  detail,
  ui,
  builder = false,
}: {
  detail: RoutinePublicDetail;
  ui: ExploreCopy;
  builder?: boolean;
}) {
  const shift = builder ? 1 : 0;
  const labels: DefinitionLabels = builder
    ? { completion: ui.doneWhen, mcps: ui.connectedTools }
    : { completion: ui.completion, mcps: ui.mcps };
  const pkg = detail.package;
  const root = pkg.members.find((member) => member.key === pkg.root_key);
  const children = pkg.members.filter((member) => member.key !== pkg.root_key);
  const requirements = pkg.requirements;
  const facts = requirementFacts(pkg);
  const agentNames = new Map(
    (pkg.agents ?? []).map((agent) => [agent.source_id, agent.name] as const),
  );
  const hasRequirements = !!(requirements?.model_ids?.length || requirements?.mcp_ids?.length);
  const factKinds = (["included", "youProvide", "produces"] as const).filter((kind) => facts[kind].length > 0);
  return (
    <>
      {root && (
        <MemberContent member={root} root ui={ui} agentNames={agentNames} shift={shift} labels={labels} />
      )}
      {!!children.length && (
        <section id="sub-routines" className="explore-section">
          <H level={2} shift={shift}>{ui.subRoutines}</H>
          {children.map((member) => (
            <MemberContent
              key={member.key}
              member={member}
              root={false}
              ui={ui}
              agentNames={agentNames}
              shift={shift}
              labels={labels}
            />
          ))}
        </section>
      )}
      {!!pkg.agents?.length && (
        <section id="agents" className="explore-section">
          <H level={2} shift={shift}>{ui.agents}</H>
          <div className="explore-roster">
            {pkg.agents.map((agent) => (
              <article className="explore-agent" key={agent.source_id}>
                <div className="explore-agent-head">
                  <span className="explore-avatar" aria-hidden="true">
                    {initials(agent.name)}
                  </span>
                  <div className="explore-agent-title">
                    <H level={3} shift={shift}>{agent.name}</H>
                    <Markdown text={agent.description} />
                  </div>
                </div>
                {!!agent.capabilities?.length && (
                  <Chips items={agent.capabilities} mono={false} />
                )}
                {(!!agent.skill_ids?.length || !!agent.mcp_ids?.length) && (
                  <ul className="explore-step-meta">
                    {!!agent.skill_ids?.length && (
                      <li>
                        <span>{ui.skills}</span> {agent.skill_ids.join(", ")}
                      </li>
                    )}
                    {!!agent.mcp_ids?.length && (
                      <li>
                        <span>{labels.mcps}</span> {agent.mcp_ids.join(", ")}
                      </li>
                    )}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {!!pkg.skills?.length && (
        <section id="skills" className="explore-section">
          <H level={2} shift={shift}>{ui.skills}</H>
          {pkg.skills.map((skill) => (
            <details className="explore-skill" key={skill.id}>
              <summary>
                <code>{skill.id}</code>
              </summary>
              <Markdown text={skill.markdown} />
            </details>
          ))}
        </section>
      )}
      <section id="requirements" className="explore-section">
        <H level={2} shift={shift}>{ui.requirements}</H>
        {factKinds.length > 0 && <dl className="explore-requirement-summary">
          {factKinds.map((kind) => <div key={kind}>
            <dt>{ui[kind]}</dt>
            <dd><ul className="explore-requirement-list" data-kind={kind}>
              {facts[kind].map((fact) => <li key={fact}>{fact}</li>)}
            </ul></dd>
          </div>)}
        </dl>}
        {hasRequirements && (
          <div className="explore-req-groups">
            {!!requirements?.model_ids?.length && (
              <div className="explore-req-group">
                <H level={4} shift={shift}>{ui.models}</H>
                <Chips items={requirements.model_ids} />
              </div>
            )}
            {!!requirements?.mcp_ids?.length && (
              <div className="explore-req-group">
                <H level={4} shift={shift}>{labels.mcps}</H>
                <Chips items={requirements.mcp_ids} />
              </div>
            )}
          </div>
        )}
        {!hasRequirements && factKinds.length === 0 && <p>{ui.noRequirements}</p>}
      </section>
    </>
  );
}
export function IncludedInBundles({
  detail,
  ui,
  locale,
}: {
  detail: RoutinePublicDetail;
  ui: ExploreCopy;
  locale: string;
}) {
  if (!detail.included_in_bundles?.length) return null;
  return (
    <section className="explore-section" id="bundles">
      <h2>{ui.includedBundles}</h2>
      <ul className="explore-bundle-links">
        {detail.included_in_bundles.map((bundle) => (
          <li key={bundle.bundle_id}>
            <a href={`/${locale}/explore/bundles/${resolveSlug(bundle)}`}>
              <span className="explore-eyebrow">{ui.bundle}</span>
              <strong>{bundle.title}</strong>
              <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
/** The legacy layout: used whenever the record has no listing profile. */
export function RoutineContent({
  detail,
  ui,
  locale,
}: {
  detail: RoutinePublicDetail;
  ui: ExploreCopy;
  locale: string;
}) {
  const pkg = detail.package;
  const children = pkg.members.filter((member) => member.key !== pkg.root_key);
  return (
    <div className="explore-detail-body explore-width">
      <article className="explore-body">
        <RoutineDefinition detail={detail} ui={ui} />
        <IncludedInBundles detail={detail} ui={ui} locale={locale} />
      </article>
      <aside className="explore-rail">
        <nav className="explore-toc" aria-label={ui.contents}>
          <strong>{ui.contents}</strong>
          <a href="#routine">{ui.routine}</a>
          {!!children.length && <a href="#sub-routines">{ui.subRoutines}</a>}
          {!!pkg.agents?.length && <a href="#agents">{ui.agents}</a>}
          {!!pkg.skills?.length && <a href="#skills">{ui.skills}</a>}
          <a href="#requirements">{ui.requirements}</a>
          {!!detail.included_in_bundles?.length && (
            <a href="#bundles">{ui.includedBundles}</a>
          )}
        </nav>
        <DetailsCard detail={detail} ui={ui} locale={locale} />
        <a className="explore-back" href={`/${locale}/explore`}>
          ← {ui.back}
        </a>
      </aside>
    </div>
  );
}
