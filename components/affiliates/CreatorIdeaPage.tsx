import { Link } from "@/lib/navigation";
import { CREATOR_IDEAS, type CreatorIdea } from "@/lib/creator-ideas";
import CreatorIdeas from "./CreatorIdeas";
import SetupPrompt from "./SetupPrompt";
import css from "./creators.module.css";
import styles from "@/components/account/account.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Toone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
      </Link>
      <Link href="/creators">Creator dashboard</Link>
    </header>
  );
}

/** /creators/ideas: every idea. */
export function CreatorIdeasIndex() {
  return (
    <main className={styles.page}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Header />
        <CreatorIdeas heading="Ideas to explore" headingLevel={1} />
      </div>
    </main>
  );
}

/** /creators/ideas/{slug}: one idea. */
export function CreatorIdeaDetail({ idea }: { idea: CreatorIdea }) {
  const others = CREATOR_IDEAS.filter((other) => other.slug !== idea.slug);
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Header />
        <div className={styles.title}>
          <p className={styles.eyebrow}>{idea.label}</p>
          <h1>{idea.title}</h1>
          <p className={styles.sub}>{idea.summary}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={idea.image} alt="" width={1600} height={900} style={{ width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 16, display: "block", marginBottom: 16, mixBlendMode: "lighten" }} />
        <div className={styles.stack}>
          {idea.example && (
            <section className={styles.panel}>
              <h2>{idea.example.name}</h2>
              <p>{idea.example.text}</p>
            </section>
          )}
          <section className={styles.panel}>
            <h2>How it works</h2>
            <ul className={styles.facts}>
              {idea.steps.map((step) => <li key={step}>{step}</li>)}
            </ul>
          </section>
          <section className={styles.panel} aria-labelledby="setup-heading">
            <h2 id="setup-heading">Set it up in Toone</h2>
            <ol className={css.setupSteps}>
              <li>Open Toone on your Mac and start a new conversation.</li>
              <li>Paste the prompt{idea.prompts.length > 1 ? " for the watcher you want" : ""}.</li>
              <li>Toone builds the routine, asks you for what is missing, and shows it before the first run.</li>
            </ol>
            {idea.prompts.map((prompt) => (
              <SetupPrompt key={prompt.label} label={prompt.label} text={prompt.text} showLabel={idea.prompts.length > 1} />
            ))}
          </section>
          <section className={styles.panel}>
            <h2>Show your audience</h2>
            <p>{idea.showYourAudience}</p>
            <div className={styles.actions}>
              {idea.links.map((link) => (
                <a key={link.href} href={link.href} className={styles.button} target="_blank" rel="noopener noreferrer">{link.label}</a>
              ))}
              <Link href="/download" className={`${styles.button} ${styles.primary}`}>Download Toone</Link>
              <Link href="/explore" className={styles.button}>Browse Explore</Link>
            </div>
          </section>
        </div>
        <nav className={styles.footerLinks} aria-label="More ideas">
          {others.map((other) => <Link key={other.slug} href={`/creators/ideas/${other.slug}`}>{other.label}</Link>)}
          <Link href="/creators/ideas">All ideas</Link>
        </nav>
      </div>
    </main>
  );
}
