import { Link } from "@/lib/navigation";
import { CREATOR_IDEAS } from "@/lib/creator-ideas";
import css from "./creators.module.css";

/** "Ideas to explore": a grid of cards, each linking to its idea page. */
export default function CreatorIdeas({ heading = "Ideas to explore", headingLevel = 2 }: { heading?: string; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={css.ideas} aria-labelledby="creator-ideas">
      <div className={css.ideasHead}>
        <Heading id="creator-ideas">{heading}</Heading>
        <p>Things Toone already runs, to try yourself or show your audience.</p>
      </div>
      <div className={css.grid}>
        {CREATOR_IDEAS.map((idea) => (
          <Link key={idea.slug} href={`/creators/ideas/${idea.slug}`} className={css.card}>
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
