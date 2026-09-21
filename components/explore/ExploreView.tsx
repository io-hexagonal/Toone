import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import OpenInToone from "./OpenInToone";
import CoverImage from "./CoverImage";
import {
  resolveCardCoverUrl,
  resolveCoverUrl,
  resolveSlug,
} from "@/lib/explore/api";
import {
  catalogHref,
  deepLink,
  safeMarkdownUrl,
  type CatalogItem,
} from "@/lib/explore/presentation";
import type {
  PackageMember,
  RoutinePublicDetail,
  BundlePublicDetail,
} from "@/lib/explore/types";
import "./explore.css";

export const COPY_KEYS = [
  "title",
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
}: {
  entry: { cover_url?: string | null; cover_image_data_url?: string | null };
  className?: string;
  inline?: boolean;
}) {
  const url = inline ? resolveCoverUrl(entry) : resolveCardCoverUrl(entry);
  return (
    <span
      className={`explore-cover-frame${url ? "" : " explore-cover-empty"}`}
      aria-hidden="true"
    >
      <span className="explore-cover-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" />
      </span>
      {url && <CoverImage className={`explore-cover ${className}`} src={url} />}
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
export function Counts({
  entry,
  ui,
}: {
  entry: { step_count: number; agent_count: number; sub_routine_count: number };
  ui: ExploreCopy;
}) {
  return (
    <div className="explore-counts">
      <span>{ui.count("steps", entry.step_count)}</span>
      <span>{ui.count("agents", entry.agent_count)}</span>
      {entry.sub_routine_count > 0 && (
        <span>{ui.count("subRoutines", entry.sub_routine_count)}</span>
      )}
    </div>
  );
}
export function CatalogCard({
  item,
  locale,
  ui,
}: {
  item: CatalogItem;
  locale: string;
  ui: ExploreCopy;
}) {
  const { entry } = item;
  const href = `/${locale}/explore/${item.type}s/${resolveSlug(entry)}`;
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
        </div>
        <div className="explore-card-copy">
          <p className="explore-eyebrow">
            {item.type === "bundle"
              ? `${ui.bundle} · ${ui.count("routines", entry.member_count)}`
              : ui.routine}
          </p>
          <h2>{entry.title}</h2>
          <p className="explore-summary">{entry.summary}</p>
          <div className="explore-card-meta">
            {entry.author_name && (
              <span className="explore-byline">
                {ui.by} {entry.author_name}
              </span>
            )}
            {item.type === "routine" && <Counts entry={item.entry} ui={ui} />}
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
export function formatDate(locale: string, iso: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
}
export function DetailHero({
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
              />
              <a
                className="explore-button explore-button-secondary"
                href={`/${locale}/download?from=explore`}
              >
                {ui.getToone}
              </a>
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
function MemberContent({
  member,
  root,
  ui,
  agentNames,
}: {
  member: PackageMember;
  root: boolean;
  ui: ExploreCopy;
  agentNames: Map<string, string>;
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
          <h2>{payload.name || member.key}</h2>
        </header>
      )}
      {payload.purpose && (
        <section className="explore-section">
          <h2>{ui.purpose}</h2>
          <div className="explore-lede">
            <Markdown text={payload.purpose} />
          </div>
          <Markdown text={payload.preamble} />
        </section>
      )}
      {!payload.purpose && payload.preamble && (
        <section className="explore-section">
          <h2>{ui.overview}</h2>
          <Markdown text={payload.preamble} />
        </section>
      )}
      {payload.prerequisites && (
        <section className="explore-section">
          <h2>{ui.prerequisites}</h2>
          <Markdown text={payload.prerequisites} />
        </section>
      )}
      {!!payload.inputs?.length && (
        <section className="explore-section">
          <h2>{ui.inputs}</h2>
          <dl className="explore-inputs">
            {payload.inputs.map((input) => (
              <div key={input.id}>
                <dt>
                  <code>{input.id}</code>
                  {input.requirement && <small>{input.requirement}</small>}
                </dt>
                <dd>
                  <Markdown text={input.description} />
                  {(input.kind || input.valueType) && (
                    <span className="explore-muted">
                      {[input.kind, input.valueType].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!!payload.steps?.length && (
        <section className="explore-section">
          <h2>{ui.steps}</h2>
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
                    <h3>{step.title}</h3>
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
                        <h4>{ui.completion}</h4>
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
                        <h4>{ui.outcomes}</h4>
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
          <h2>{ui.escalation}</h2>
          <Markdown text={payload.escalation} />
        </section>
      )}
    </div>
  );
}
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
  const root = pkg.members.find((member) => member.key === pkg.root_key);
  const children = pkg.members.filter((member) => member.key !== pkg.root_key);
  const requirements = pkg.requirements;
  const agentNames = new Map(
    (pkg.agents ?? []).map((agent) => [agent.source_id, agent.name] as const),
  );
  const named = (ids: string[]) =>
    ids.map((id) => agentNames.get(id) ?? id);
  const hasRequirements = Object.values(requirements ?? {}).some(
    (values) => Array.isArray(values) && values.length > 0,
  );
  return (
    <div className="explore-detail-body explore-width">
      <article className="explore-body">
        {root && (
          <MemberContent member={root} root ui={ui} agentNames={agentNames} />
        )}
        {!!children.length && (
          <section id="sub-routines" className="explore-section">
            <h2>{ui.subRoutines}</h2>
            {children.map((member) => (
              <MemberContent
                key={member.key}
                member={member}
                root={false}
                ui={ui}
                agentNames={agentNames}
              />
            ))}
          </section>
        )}
        {!!pkg.agents?.length && (
          <section id="agents" className="explore-section">
            <h2>{ui.agents}</h2>
            <div className="explore-roster">
              {pkg.agents.map((agent) => (
                <article className="explore-agent" key={agent.source_id}>
                  <div className="explore-agent-head">
                    <span className="explore-avatar" aria-hidden="true">
                      {initials(agent.name)}
                    </span>
                    <div className="explore-agent-title">
                      <h3>{agent.name}</h3>
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
                          <span>{ui.mcps}</span> {agent.mcp_ids.join(", ")}
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
            <h2>{ui.skills}</h2>
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
          <h2>{ui.requirements}</h2>
          {hasRequirements ? (
            <div className="explore-req-groups">
              {!!requirements?.agent_ids?.length && (
                <div className="explore-req-group">
                  <h4>{ui.agentIds}</h4>
                  <Chips items={named(requirements.agent_ids)} mono={false} />
                </div>
              )}
              {!!requirements?.skill_ids?.length && (
                <div className="explore-req-group">
                  <h4>{ui.skillIds}</h4>
                  <Chips items={requirements.skill_ids} />
                </div>
              )}
              {!!requirements?.model_ids?.length && (
                <div className="explore-req-group">
                  <h4>{ui.models}</h4>
                  <Chips items={requirements.model_ids} />
                </div>
              )}
              {!!requirements?.mcp_ids?.length && (
                <div className="explore-req-group">
                  <h4>{ui.mcps}</h4>
                  <Chips items={requirements.mcp_ids} />
                </div>
              )}
              {!!requirements?.resource_bindings?.length && (
                <div className="explore-req-group">
                  <h4>{ui.bindings}</h4>
                  <Chips
                    items={requirements.resource_bindings.map((value) =>
                      typeof value === "string" ? value : JSON.stringify(value),
                    )}
                  />
                </div>
              )}
            </div>
          ) : (
            <p>{ui.noRequirements}</p>
          )}
        </section>
        {!!pkg.resources?.length && (
          <section id="resources" className="explore-section">
            <h2>{ui.resources}</h2>
            <dl className="explore-requirements">
              {pkg.resources.map((resource, i) => (
                <div key={i}>
                  <dt>
                    <code>{resource.input_id}</code>
                  </dt>
                  <dd>
                    <span className="explore-muted">
                      <code>{resource.binding}</code> · {resource.mode}
                    </span>
                    <Markdown text={resource.reason} />
                    {/* File contents are installed by the app, not published:
                        a disclosed directory can be hundreds of KB. */}
                    {!!resource.directory_entries?.length && (
                      <Chips
                        items={resource.directory_entries.map(
                          (entry) => entry.relative_path,
                        )}
                      />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {!!detail.included_in_bundles?.length && (
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
        )}
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
