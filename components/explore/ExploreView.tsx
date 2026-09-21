import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import OpenInToone from "./OpenInToone";
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
  return url ? (
    <img
      className={`explore-cover ${className}`}
      src={url}
      alt=""
      loading="lazy"
    />
  ) : (
    <div
      className={`explore-cover explore-cover-empty ${className}`}
      aria-hidden="true"
    >
      <img src="/assets/brand/toone-mark.svg" alt="" />
    </div>
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
  return (
    <ul className="explore-tags" aria-label={ui.tags}>
      {tags.map((tag) => (
        <li key={tag}>
          <a
            href={catalogHref(locale, { type: "all", page: 1, query: "", tag })}
          >
            #{tag}
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
          {entry.author_name && (
            <p className="explore-byline">
              {ui.by} {entry.author_name}
            </p>
          )}
          {item.type === "routine" && <Counts entry={item.entry} ui={ui} />}
        </div>
      </a>
      <div className="explore-card-tags">
        <Tags tags={entry.tags} locale={locale} ui={ui} />
      </div>
    </article>
  );
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
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(detail.approved_at));
  return (
    <header className="explore-hero">
      <div className="explore-width">
        <nav className="explore-breadcrumb" aria-label={ui.breadcrumb}>
          <a href={`/${locale}`}>{ui.home}</a>
          <span>/</span>
          <a href={`/${locale}/explore`}>{ui.title}</a>
          <span>/</span>
          <span>{ui[type]}</span>
        </nav>
        <div className="explore-detail-head">
          <div>
            <p className="explore-eyebrow">
              {ui[type]}
              {type === "bundle"
                ? ` · ${ui.count("routines", detail.member_count)}`
                : ""}
            </p>
            <h1>{detail.title}</h1>
            <p className="explore-deck">{detail.summary}</p>
            <p className="explore-byline">
              {detail.author_name && (
                <>
                  {ui.by} {detail.author_name} <span>·</span>{" "}
                </>
              )}
              {ui.approved}{" "}
              <time dateTime={detail.approved_at}>{date}</time>
            </p>
            {"license" in detail && (
              <>
                <Counts entry={detail} ui={ui} />
                <p className="explore-byline">
                  {ui.license}: {detail.license}
                </p>
              </>
            )}
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
function MemberContent({
  member,
  root,
  ui,
}: {
  member: PackageMember;
  root: boolean;
  ui: ExploreCopy;
}) {
  const payload = member.payload;
  return (
    <section
      id={root ? "routine" : "member-" + encodeURIComponent(member.key)}
      className="explore-member"
    >
      {!root && <h2>{payload.name || member.key}</h2>}
      {payload.purpose && (
        <section>
          <h2>{ui.purpose}</h2>
          <Markdown text={payload.purpose} />
        </section>
      )}
      <Markdown text={payload.preamble} />
      {payload.prerequisites && (
        <section>
          <h2>{ui.prerequisites}</h2>
          <Markdown text={payload.prerequisites} />
        </section>
      )}
      {payload.escalation && (
        <section>
          <h2>{ui.escalation}</h2>
          <Markdown text={payload.escalation} />
        </section>
      )}
      {!!payload.inputs?.length && (
        <section>
          <h2>{ui.inputs}</h2>
          <dl>
            {payload.inputs.map((input) => (
              <div key={input.id}>
                <dt>
                  {input.id}{" "}
                  {input.requirement && <small>({input.requirement})</small>}
                </dt>
                <dd>
                  <Markdown text={input.description} />
                  {[input.kind, input.valueType].filter(Boolean).join(" · ")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!!payload.steps?.length && (
        <section>
          <h2>{ui.steps}</h2>
          <ol className="explore-steps">
            {payload.steps.map((step, index) => (
              <li key={step.id} id={root ? `step-${index + 1}` : undefined}>
                <h3>
                  <span className="explore-step-number">{index + 1}</span>
                  {step.title}
                </h3>
                <Markdown text={step.description} />
                {!!step.completionCriteria?.length && (
                  <>
                    <h4>{ui.completion}</h4>
                    <ul>
                      {step.completionCriteria.map((criterion, i) => (
                        <li key={i}>
                          <Markdown text={criterion} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {!!step.outcomes?.length && (
                  <details>
                    <summary>{ui.outcomes}</summary>
                    <ul>
                      {step.outcomes.map((outcome) => (
                        <li key={outcome.id}>
                          <strong>{outcome.id}</strong>
                          <Markdown text={outcome.description} />
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {step.subRoutineId && (
                  <p>
                    {ui.routine}: <code>{step.subRoutineId}</code>
                  </p>
                )}
                {step.executorAgentId && (
                  <p>
                    {ui.agents}: <code>{step.executorAgentId}</code>
                  </p>
                )}
                {!!step.skillIds?.length && (
                  <p>
                    {ui.skills}: {step.skillIds.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
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
  return (
    <div className="explore-detail-body explore-width">
      <article className="explore-body">
        {root && <MemberContent member={root} root ui={ui} />}
        {!!children.length && (
          <section id="sub-routines">
            <h2>{ui.subRoutines}</h2>
            {children.map((member) => (
              <MemberContent
                key={member.key}
                member={member}
                root={false}
                ui={ui}
              />
            ))}
          </section>
        )}
        {!!pkg.agents?.length && (
          <section id="agents">
            <h2>{ui.agents}</h2>
            {pkg.agents.map((agent) => (
              <section className="explore-panel" key={agent.source_id}>
                <h3>{agent.name}</h3>
                <Markdown text={agent.description} />
                <Markdown text={agent.greeting} />
                <ul>
                  {agent.capabilities?.map((capability, i) => (
                    <li key={i}>
                      <Markdown text={capability} />
                    </li>
                  ))}
                </ul>
                {!!agent.skill_ids?.length && (
                  <p>
                    {ui.skills}: {agent.skill_ids.join(", ")}
                  </p>
                )}
                {!!agent.mcp_ids?.length && (
                  <p>
                    {ui.mcps}: {agent.mcp_ids.join(", ")}
                  </p>
                )}
              </section>
            ))}
          </section>
        )}
        {!!pkg.skills?.length && (
          <section id="skills">
            <h2>{ui.skills}</h2>
            {pkg.skills.map((skill) => (
              <section className="explore-panel" key={skill.id}>
                <h3>{skill.id}</h3>
                <Markdown text={skill.markdown} />
              </section>
            ))}
          </section>
        )}
        <section id="requirements">
          <h2>{ui.requirements}</h2>
          {pkg.minimum_app_version && (
            <p>
              {ui.minimumVersion}: {pkg.minimum_app_version}
            </p>
          )}
          <dl>
            {(
              [
                ["agent_ids", "agentIds"],
                ["skill_ids", "skillIds"],
                ["model_ids", "models"],
                ["mcp_ids", "mcps"],
                ["resource_bindings", "bindings"],
              ] as const
            ).map(
              ([key, label]) =>
                !!requirements?.[key]?.length && (
                  <div key={key}>
                    <dt>{ui[label]}</dt>
                    <dd>
                      <ul>
                        {requirements[key]!.map((value, i) => (
                          <li key={i}>
                            <code>
                              {typeof value === "string"
                                ? value
                                : JSON.stringify(value)}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ),
            )}
          </dl>
          {!Object.values(requirements ?? {}).some(
            (values) => Array.isArray(values) && values.length > 0,
          ) && <p>{ui.noRequirements}</p>}
        </section>
        {!!pkg.resources?.length && (
          <section id="resources">
            <h2>{ui.resources}</h2>
            {pkg.resources.map((resource, i) => (
              <section className="explore-panel" key={i}>
                <h3>{resource.input_id}</h3>
                <p>
                  <code>{resource.binding}</code> · {resource.mode}
                </p>
                <Markdown text={resource.reason} />
                {/* File contents are installed by the app, not published:
                    a disclosed directory can be hundreds of KB. */}
                {!!resource.directory_entries?.length && (
                  <ul>
                    {resource.directory_entries.map((entry) => (
                      <li key={entry.relative_path}>
                        <code>{entry.relative_path}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </section>
        )}
        {!!detail.included_in_bundles?.length && (
          <section>
            <h2>{ui.includedBundles}</h2>
            <ul>
              {detail.included_in_bundles.map((bundle) => (
                <li key={bundle.bundle_id}>
                  <a href={`/${locale}/explore/bundles/${resolveSlug(bundle)}`}>
                    {bundle.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="explore-revision">
          <h2>
            {ui.revision} {detail.sequence}
          </h2>
          <p>
            <code>{detail.revision_id}</code>
          </p>
          <p>
            <code>{detail.content_hash}</code>
          </p>
        </section>
      </article>
      <aside className="explore-toc">
        <strong>{ui.contents}</strong>
        <a href="#routine">{ui.routine}</a>
        {!!children.length && <a href="#sub-routines">{ui.subRoutines}</a>}
        {!!pkg.agents?.length && <a href="#agents">{ui.agents}</a>}
        {!!pkg.skills?.length && <a href="#skills">{ui.skills}</a>}
        <a href="#requirements">{ui.requirements}</a>
        <a href={`/${locale}/explore`}>← {ui.back}</a>
      </aside>
    </div>
  );
}
