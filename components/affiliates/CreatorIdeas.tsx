import { Link } from "@/lib/navigation";
import { CREATOR_IDEAS } from "@/lib/creator-ideas";
import css from "./creators.module.css";

type Props = {
  heading?: string;
  headingLevel?: 1 | 2 | false;
  /** Where each card links: `/creators/ideas` or `/newcomers/ideas`. */
  basePath?: "/creators/ideas" | "/newcomers/ideas";
  intro?: string;
};

/** "Ideas to explore": a grid of cards, each linking to its idea page. */
export default function CreatorIdeas({
  heading = "Ideas to explore",
  headingLevel = 2,
  basePath = "/creators/ideas",
  intro = "Things Toone already runs, to try yourself or show your audience.",
}: Props) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const language = basePath === "/newcomers/ideas" ? "en" : undefined;
  return (
    <section lang={language} className={css.ideas} aria-labelledby={headingLevel === false ? undefined : "creator-ideas"} aria-label={headingLevel === false ? heading : undefined}>
      {headingLevel !== false && (
        <div className={css.ideasHead}>
          <Heading id="creator-ideas">{heading}</Heading>
          <p>{intro}</p>
        </div>
      )}
      <div className={css.grid}>
        {CREATOR_IDEAS.map((idea) => (
          <Link key={idea.slug} href={`${basePath}/${idea.slug}`} locale={language} className={css.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={idea.image} alt="" width={1600} height={900} loading="lazy" />
            <div className={css.cardBody}>
              <p className={css.cardLabel}>{idea.label}</p>
              <h3>{idea.title}</h3>
              <p>{idea.summary}</p>
              <span className={css.more}>Explore the idea →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function NewcomerIdeasCards() {
  return (
    <CreatorIdeas
      heading="Ideas you can set up today"
      basePath="/newcomers/ideas"
      intro="Each one comes with a prompt you can paste into Toone as it is."
    />
  );
}
