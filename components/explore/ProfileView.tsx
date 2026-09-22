/**
 * Explore page layout for records with a listing profile (contract §13,
 * page spec §3): the job in plain words first, the routine definition last,
 * collapsed but still in the server HTML for builders, search and AI answers.
 * Records without a profile keep the legacy layout in `ExploreView`.
 */
import type { ReactNode } from "react";
import { termLabel, type ExploreTaxonomy } from "@/lib/explore/taxonomy";
import { resolveSlug } from "@/lib/explore/api";
import {
  cardText,
  categoryHref,
  deepLink,
  requestAccessHref,
} from "@/lib/explore/presentation";
import type {
  BundlePublicDetail,
  ListingProfilePublic,
  ListingProfileThirdParty,
  RoutinePublicDetail,
  ThirdPartyAction,
} from "@/lib/explore/types";
import OpenInToone from "./OpenInToone";
import {
  Cover,
  IncludedInBundles,
  RoutineDefinition,
  capitalize,
  formatDate,
  type ExploreCopy,
} from "./ExploreView";

type Detail = RoutinePublicDetail | BundlePublicDetail;
type Props = {
  detail: Detail;
  profile: ListingProfilePublic;
  type: "routine" | "bundle";
  locale: string;
  ui: ExploreCopy;
  taxonomy: ExploreTaxonomy | null;
};

function recordId(detail: Detail) {
  return "workflow_id" in detail ? detail.workflow_id : detail.bundle_id;
}
function label(taxonomy: ExploreTaxonomy | null, id: string) {
  return capitalize(termLabel(taxonomy, id));
}

export function ProfileHero({ detail, profile, type, locale, ui, taxonomy }: Props) {
  const id = recordId(detail);
  const category = detail.classification?.category_id;
  const audiences = profile.for_whom.map((entry) => label(taxonomy, entry.useful_for_id));
  const size =
    "step_count" in detail
      ? ui.count("steps", detail.step_count)
      : ui.count("routines", detail.member_count);
  return (
    <header className="explore-hero explore-hero-detail explore-hero-profile">
      <div className="explore-width">
        <nav className="explore-breadcrumb" aria-label={ui.breadcrumb}>
          <a href={`/${locale}`}>{ui.home}</a>
          <span aria-hidden="true">/</span>
          <a href={`/${locale}/explore`}>{ui.title}</a>
          {category && (
            <>
              <span aria-hidden="true">/</span>
              <a href={categoryHref(locale, category)}>{label(taxonomy, category)}</a>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{profile.search.display_title}</span>
        </nav>
        <div className="explore-detail-head">
          <div className="explore-detail-copy">
            <p className="explore-eyebrow">{ui[type]}</p>
            <h1>{profile.search.display_title}</h1>
            <p className="explore-answer">{profile.answer}</p>
            <ul className="explore-hero-chips" aria-label={ui.details}>
              {category && <li>{label(taxonomy, category)}</li>}
              {audiences.length > 0 && (
                <li>
                  {ui.forLabel}: {audiences.join(", ")}
                </li>
              )}
              <li>{size}</li>
              <li>{ui.runsInToone}</li>
            </ul>
            <div className="explore-actions">
              <OpenInToone
                url={deepLink(type, id, detail.revision_id)}
                label={ui.useRoutine}
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
            </div>
          </div>
          <Cover entry={detail} inline alt={profile.cover_alt} />
        </div>
      </div>
    </header>
  );
}

const ACTION_COPY: Record<ThirdPartyAction, Exclude<keyof ExploreCopy, "count">> = {
  read: "actionRead",
  signup: "actionSignup",
  profile: "actionProfile",
  post: "actionPost",
  submit: "actionSubmit",
  pay: "actionPay",
};
const COST_COPY: Record<ListingProfileThirdParty["cost"], Exclude<keyof ExploreCopy, "count">> = {
  free: "costFree",
  freemium: "costFreemium",
  paid: "costPaid",
  unknown: "costUnknown",
};

type Section = { id: string; title: string; body: ReactNode };

/** Sections in page-spec order; empty optional ones are left out. */
function profileSections(
  { detail, profile, locale, ui, taxonomy }: Props,
  routinesInside: ReactNode,
): Section[] {
  const reviews = new Map(
    (detail.third_party_reviews ?? []).map((review) => [review.domain, review]),
  );
  const sections: Section[] = [];
  sections.push({
    id: "what-you-get",
    title: ui.whatYouGet,
    body: (
      <ul className="explore-profile-cards">
        {profile.results.map((result, index) => (
          <li key={index} className="explore-profile-card">
            <h3>{result.name}</h3>
            <p>{result.description}</p>
            {result.format_label && (
              <p className="explore-profile-format">{result.format_label}</p>
            )}
          </li>
        ))}
      </ul>
    ),
  });
  if (routinesInside)
    sections.push({ id: "routines", title: ui.routinesInside, body: routinesInside });
  sections.push({
    id: "who-its-for",
    title: ui.whoItsFor,
    body: (
      <>
        <dl className="explore-profile-audiences">
          {profile.for_whom.map((entry) => (
            <div key={entry.useful_for_id}>
              <dt>{label(taxonomy, entry.useful_for_id)}</dt>
              <dd>{entry.why}</dd>
            </div>
          ))}
        </dl>
        {profile.use_cases.length > 0 && (
          <>
            <h3>{ui.useItWhen}</h3>
            <ul className="explore-profile-list">
              {profile.use_cases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </>
        )}
      </>
    ),
  });
  sections.push({
    id: "how-it-works",
    title: ui.howItWorks,
    body: (
      <ol className="explore-profile-steps">
        {profile.how_it_works.map((step, index) => (
          <li key={index} id={`how-it-works-${index + 1}`}>
            {step}
          </li>
        ))}
      </ol>
    ),
  });
  const time = profile.time_and_effort;
  if (profile.you_provide.length || time.you_prepare || time.run_estimate)
    sections.push({
      id: "what-you-provide",
      title: ui.whatYouProvide,
      body: (
        <>
          {profile.you_provide.length > 0 && (
            <ul className="explore-profile-inputs">
              {profile.you_provide.map((input, index) => (
                <li key={index}>
                  <h3>{input.label}</h3>
                  <p>{input.description}</p>
                  {input.example && (
                    <p className="explore-profile-example">
                      <span>{ui.example}:</span> {input.example}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {(time.you_prepare || time.run_estimate) && (
            <dl className="explore-profile-effort">
              {time.you_prepare && (
                <div>
                  <dt>{ui.youPrepare}</dt>
                  <dd>{time.you_prepare}</dd>
                </div>
              )}
              {time.run_estimate && (
                <div>
                  <dt>{ui.runEstimate}</dt>
                  <dd>{time.run_estimate}</dd>
                </div>
              )}
            </dl>
          )}
        </>
      ),
    });
  sections.push({
    id: "customize",
    title: ui.customize,
    body: profile.customization.length ? (
      <ul className="explore-profile-inputs">
        {profile.customization.map((point) => (
          <li key={point.id}>
            <h3>{point.label}</h3>
            <dl className="explore-profile-pairs">
              {point.default && (
                <div>
                  <dt>{ui.defaultValue}</dt>
                  <dd>{point.default}</dd>
                </div>
              )}
              {point.allowed && (
                <div>
                  <dt>{ui.allowedValues}</dt>
                  <dd>{point.allowed}</dd>
                </div>
              )}
            </dl>
            {point.note && <p>{point.note}</p>}
          </li>
        ))}
      </ul>
    ) : (
      <p>{ui.runsAsPublished}</p>
    ),
  });
  if (profile.third_parties.length)
    sections.push({
      id: "works-with",
      title: ui.worksWith,
      body: (
        <ul className="explore-profile-cards explore-profile-sites">
          {profile.third_parties.map((site) => {
            const review = reviews.get(site.domain);
            const notes = [site.note, review?.note].filter(
              (note, index, all): note is string => !!note && all.indexOf(note) === index,
            );
            return (
              <li key={site.id} className="explore-profile-card">
                <h3>
                  <a href={site.url} rel="nofollow noopener noreferrer" target="_blank">
                    {site.name}
                  </a>
                </h3>
                <p className="explore-profile-format">{site.domain}</p>
                <dl className="explore-profile-pairs">
                  <div>
                    <dt>{ui.whatItDoesThere}</dt>
                    <dd>{site.actions.map((action) => ui[ACTION_COPY[action]]).join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>{ui.cost}</dt>
                    <dd>{ui[COST_COPY[site.cost]]}</dd>
                  </div>
                  {notes.length > 0 && (
                    <div>
                      <dt>{ui.reviewNote}</dt>
                      <dd>{notes.join(" ")}</dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      ),
    });
  sections.push({
    id: "in-your-control",
    title: ui.staysInControl,
    body: (
      <ul className="explore-profile-list explore-profile-control">
        {profile.stays_in_your_control.map((rule, index) => (
          <li key={index}>{rule}</li>
        ))}
      </ul>
    ),
  });
  if (profile.faq.length)
    sections.push({
      id: "faq",
      title: ui.faq,
      body: (
        <div className="explore-profile-faq">
          {profile.faq.map((entry, index) => (
            <div key={index}>
              <h3>{entry.question}</h3>
              <p>{entry.answer}</p>
            </div>
          ))}
        </div>
      ),
    });
  const related = detail.related ?? [];
  if (related.length)
    sections.push({
      id: "related",
      title: ui.relatedRoutines,
      body: (
        <ul className="explore-profile-related">
          {related.map((entry) => {
            const text = cardText(entry);
            return (
              <li key={entry.workflow_id}>
                <a href={`/${locale}/explore/routines/${resolveSlug(entry)}`}>
                  <strong>{text.title}</strong>
                  <span>{text.summary}</span>
                </a>
              </li>
            );
          })}
        </ul>
      ),
    });
  return sections;
}

/** Right rail facts; internal ids and hashes stay in the API and the app. */
function ProfileDetailsCard({ detail, ui, locale }: { detail: Detail; ui: ExploreCopy; locale: string }) {
  const minimum = "package" in detail ? detail.package.minimum_app_version : undefined;
  return (
    <section className="explore-details" aria-label={ui.details}>
      <h2>{ui.details}</h2>
      <dl>
        {detail.author_name && (
          <div>
            <dt>{ui.by}</dt>
            <dd>{detail.author_name}</dd>
          </div>
        )}
        <div>
          <dt>{ui.approved}</dt>
          <dd>
            <time dateTime={detail.approved_at}>{formatDate(locale, detail.approved_at)}</time>
          </dd>
        </div>
        <div>
          <dt>{ui.revision}</dt>
          <dd>{detail.sequence}</dd>
        </div>
        {"license" in detail && detail.license && (
          <div>
            <dt>{ui.license}</dt>
            <dd>{detail.license}</dd>
          </div>
        )}
        {minimum && (
          <div>
            <dt>{ui.minimumVersion}</dt>
            <dd>{minimum}</dd>
          </div>
        )}
        <div>
          <dt>{"package" in detail ? ui.routineName : ui.bundleName}</dt>
          <dd>{detail.title}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ProfileBody(
  props: Props & { routinesInside?: ReactNode },
) {
  const { detail, profile, locale, ui } = props;
  const sections = profileSections(props, props.routinesInside ?? null);
  const routine = "package" in detail ? detail : null;
  const guide = profile.guide_path;
  return (
    <div className="explore-detail-body explore-width">
      <article className="explore-body explore-profile">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="explore-section">
            <h2>{section.title}</h2>
            {section.body}
          </section>
        ))}
        {guide && (
          <p className="explore-profile-guide">
            <a href={guide}>{ui.learnRoutines} →</a>
          </p>
        )}
        {routine && <IncludedInBundles detail={routine} ui={ui} locale={locale} />}
        {routine && (
          <details className="explore-builders" id="builders">
            <summary>
              <h2>{ui.builders}</h2>
            </summary>
            <div className="explore-builders-body">
              <RoutineDefinition detail={routine} ui={ui} builder />
            </div>
          </details>
        )}
      </article>
      <aside className="explore-rail">
        <nav className="explore-toc" aria-label={ui.contents}>
          <strong>{ui.contents}</strong>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
          {!!routine?.included_in_bundles?.length && <a href="#bundles">{ui.includedBundles}</a>}
          {routine && <a href="#builders">{ui.builders}</a>}
        </nav>
        <ProfileDetailsCard detail={detail} ui={ui} locale={locale} />
        <a className="explore-back" href={`/${locale}/explore`}>
          ← {ui.back}
        </a>
      </aside>
    </div>
  );
}
