import { Link } from "@/lib/navigation";
import { CREATOR_IDEAS, type CreatorIdea } from "@/lib/creator-ideas";
import { NewcomerIdeasCards } from "@/components/affiliates/CreatorIdeas";
import SetupPrompt from "@/components/affiliates/SetupPrompt";
import {
  NEWCOMER_FAQ,
  NEWCOMER_INDEX,
  SETUP_STEPS,
  jsonLd,
  newcomerIdeaSchemas,
  newcomerIndexSchemas,
} from "@/lib/newcomer-ideas-seo";
import css from "@/components/affiliates/creators.module.css";
import styles from "@/components/account/account.module.css";

/** Public pages for people new to Toone, built from the same ideas as the creator pages. */

function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Toone home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
      </Link>
      <Link href="/download" className={`${styles.button} ${styles.primary}`} data-umami-event="newcomer-ideas-download" data-umami-event-item="header">
        Download Toone
      </Link>
    </header>
  );
}

function Schemas({ data }: { data: unknown[] }) {
  return (
    <>
      {data.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(item) }} />
      ))}
    </>
  );
}

function Faq({ items, heading }: { items: { q: string; a: string }[]; heading: string }) {
  return (
    <section className={styles.panel} aria-labelledby="faq-heading">
      <h2 id="faq-heading">{heading}</h2>
      <dl className={css.faq}>
        {items.map((item) => (
          <div key={item.q}>
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SetupSteps() {
  return (
    <ol className={css.setupSteps}>
      {SETUP_STEPS.map((step) => <li key={step}>{step}</li>)}
    </ol>
  );
}

function TryIt({ where }: { where: string }) {
  return (
    <div className={styles.actions}>
      <Link href="/download" className={`${styles.button} ${styles.primary}`} data-umami-event="newcomer-ideas-download" data-umami-event-item={where}>
        Download Toone for Mac
      </Link>
      <Link href="/explore" className={styles.button}>Browse more routines on Explore</Link>
    </div>
  );
}

/** /newcomers/ideas: every idea, with how to start. */
export function NewcomerIdeasIndex() {
  return (
    <main className={styles.page}>
      <Schemas data={newcomerIndexSchemas()} />
      <div className={css.wide}>
        <Header />
        <div className={css.narrow}>
          <div className={styles.title}>
            <p className={styles.eyebrow}>New to Toone</p>
            <h1>{NEWCOMER_INDEX.heading}</h1>
            <p className={styles.sub}>{NEWCOMER_INDEX.lede}</p>
          </div>
        </div>
        <section className={`${styles.panel} ${css.startPanel}`} aria-labelledby="start-heading">
          <h2 id="start-heading">How to start</h2>
          <SetupSteps />
        </section>
        <NewcomerIdeasCards />
        <div className={`${styles.stack} ${css.indexFoot}`}>
          <Faq items={NEWCOMER_FAQ} heading="Questions from new users" />
          <section className={styles.panel}>
            <h2>Ready to try one?</h2>
            <p>Toone is a Mac app. Download it, open a new conversation and paste a prompt from any idea above.</p>
            <TryIt where="index-footer" />
          </section>
        </div>
      </div>
    </main>
  );
}

/** /newcomers/ideas/{slug}: one idea, written for someone new to Toone. */
export function NewcomerIdeaDetail({ idea }: { idea: CreatorIdea }) {
  const others = CREATOR_IDEAS.filter((other) => other.slug !== idea.slug);
  return (
    <main className={styles.page}>
      <Schemas data={newcomerIdeaSchemas(idea)} />
      <div className={styles.container}>
        <Header />
        <nav aria-label="Breadcrumb" className={css.crumbs}>
          <Link href="/newcomers/ideas">Ideas for newcomers</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{idea.label}</span>
        </nav>
        <div className={styles.title}>
          <p className={styles.eyebrow}>{idea.label}</p>
          <h1>{idea.title}</h1>
          <p className={styles.sub}>{idea.summary}</p>
          <p className={`${styles.sub} ${css.forWho}`}>{idea.newcomer.forWho}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={idea.image} alt={`Illustration for ${idea.label}`} width={1600} height={900} fetchPriority="high" style={{ width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 16, display: "block", marginBottom: 16, mixBlendMode: "lighten" }} />
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>How it works</h2>
            <ul className={styles.facts}>
              {idea.steps.map((step) => <li key={step}>{step}</li>)}
            </ul>
          </section>
          {idea.example && (
            <section className={styles.panel}>
              <h2>{idea.example.name}</h2>
              <p>{idea.example.text}</p>
            </section>
          )}
          <section className={styles.panel}>
            <h2>What you need</h2>
            <ul className={styles.facts}>
              {idea.newcomer.needs.map((need) => <li key={need}>{need}</li>)}
            </ul>
          </section>
          <section className={styles.panel} aria-labelledby="setup-heading">
            <h2 id="setup-heading">Set it up in Toone</h2>
            <SetupSteps />
            {idea.prompts.map((prompt) => (
              <SetupPrompt key={prompt.label} label={prompt.label} text={prompt.text} showLabel={idea.prompts.length > 1} event="newcomer-idea-copy-prompt" />
            ))}
          </section>
          <Faq items={idea.newcomer.faq} heading="Questions" />
          <section className={styles.panel}>
            <h2>Try it on your Mac</h2>
            <p>Download Toone, start a new conversation and paste the prompt above. Toone asks for anything it needs before the first run.</p>
            <TryIt where={idea.slug} />
          </section>
        </div>
        <nav className={styles.footerLinks} aria-label="More ideas">
          {others.map((other) => <Link key={other.slug} href={`/newcomers/ideas/${other.slug}`}>{other.label}</Link>)}
          <Link href="/newcomers/ideas">All ideas for newcomers</Link>
        </nav>
      </div>
    </main>
  );
}
