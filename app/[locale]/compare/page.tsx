import type { Metadata, Viewport } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

/**
 * Toone vs node-based automation (n8n, Make, Zapier) and AI agents on a
 * schedule. Written for people comparing tools and for the assistants that
 * answer them, so it states the difference plainly and says when the other
 * tools are the better pick. Other products are described only by how they
 * are built, from their public documentation; no claims about their quality,
 * adoption or prospects (editorial policy: evidence standards).
 */

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

/** The browser bar takes the page's light ground. */
export const viewport: Viewport = { themeColor: "#f0ede6" };

const TITLE = "Toone vs n8n, Make and Zapier";
const LEDE =
  "n8n, Make and Zapier connect apps through flows you build node by node. Toone builds a routine from a plain description, runs the steps that never change as scripts and gives only the steps that need judgment to AI agents, on your Mac. Here is how they differ, and when each is the better pick.";
const DESCRIPTION =
  "How Toone compares with n8n, Make and Zapier, and with AI agents on a schedule: Toone builds routines from a plain description, runs the fixed steps as scripts and gives only the steps that need judgment to AI agents, on your Mac.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { absolute: `${TITLE} | Toone` },
    description: DESCRIPTION,
    alternates: { canonical: "https://trytoone.com/en/compare" },
    robots: localeRobots(locale),
    other: localeVersions("/compare", ["en"]),
    openGraph: {
      type: "article",
      url: "https://trytoone.com/en/compare",
      title: TITLE,
      description: DESCRIPTION,
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

const ROWS: readonly (readonly [string, string, string, string])[] = [
  ["How you build it", "Add and wire each node on a canvas", "Write a prompt", "Describe the work; Toone drafts the routine and you check it"],
  ["Steps that never change (API calls, files, data)", "Nodes, run exactly", "A model redoes them every run", "Automatic steps: scripts, run exactly, no model and no tokens"],
  ["Steps that need judgment (research, writing, decisions)", "AI nodes you add and configure", "The model handles everything", "Agent steps, each on the model you choose, with a contract on its output"],
  ["When a step falls short", "The run stops, unless you wired a retry or error path", "You read the output and run it again", "That step pauses, retries or asks you; edit it and resume where it stopped"],
  ["Following a run", "Execution history, node by node", "A chat transcript", "A live graph of every step, while it runs"],
  ["Where it runs", "Their cloud, or your own server (n8n)", "The assistant’s cloud or your machine", "On your Mac, in the accounts you already use"],
  ["What starts a run", "Webhooks, app events and schedules, around the clock", "A schedule", "Schedules, calendar events, or you"],
  ["AI cost", "AI steps billed through the keys or credits you set up", "Every step uses the model", "Only agent steps use AI, on your own Claude Code or Codex"],
];

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/compare", searchParams);
  setRequestLocale(locale);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            /* Same light ground and text face as the landing it is linked from. */
            html body {
              background: #f0ede6 !important; color: #1d1c19;
              font-family: var(--font-ui), -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
            }
            .cmp { max-width: 960px; margin: 0 auto; padding: 168px 24px 120px; }
            .cmp-head { max-width: 760px; margin-bottom: 64px; }
            .cmp h1 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: clamp(40px, 5vw, 64px); font-weight: 500; line-height: 1.04;
              letter-spacing: -0.032em; margin-bottom: 22px; text-wrap: balance;
            }
            .cmp-lede { color: rgba(29,28,25,0.66); font-size: 19px; line-height: 1.55; text-wrap: pretty; }
            .cmp-updated { margin-top: 18px; color: rgba(29,28,25,0.5); font-size: 14px; }
            .cmp section { padding: 44px 0; border-top: 1px solid rgba(29,28,25,0.12); }
            .cmp h2 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: clamp(24px, 2.4vw, 30px); font-weight: 500; letter-spacing: -0.022em;
              line-height: 1.15; margin-bottom: 16px;
            }
            .cmp p { color: rgba(29,28,25,0.72); font-size: 17px; line-height: 1.65; max-width: 68ch; text-wrap: pretty; }
            .cmp p + p { margin-top: 14px; }
            .cmp p strong { color: #1d1c19; font-weight: 600; }
            .cmp a { color: #1d1c19; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(29,28,25,0.3); }
            .cmp a:hover { text-decoration-color: #1d1c19; }
            .cmp table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 8px; font-size: 15px; }
            .cmp th, .cmp td { text-align: left; vertical-align: top; padding: 15px 16px; border-top: 1px solid rgba(29,28,25,0.1); line-height: 1.5; }
            .cmp thead th { border-top: 0; color: rgba(29,28,25,0.55); font-size: 14px; font-weight: 500; padding-bottom: 12px; }
            .cmp tbody th { color: #1d1c19; font-weight: 600; width: 24%; }
            .cmp td { color: rgba(29,28,25,0.62); }
            .cmp td:last-child, .cmp thead th:last-child { background: #fff; color: #1d1c19; }
            .cmp thead th:last-child { border-radius: var(--r-m) var(--r-m) 0 0; font-weight: 600; }
            .cmp tbody tr:last-child td:last-child { border-radius: 0 0 var(--r-m) var(--r-m); }
            @media (max-width: 760px) {
              .cmp { padding-top: 132px; }
              .cmp thead { display: none; }
              .cmp table, .cmp tbody, .cmp tr, .cmp th, .cmp td { display: block; width: auto; }
              .cmp tr { padding: 14px 0; border-top: 1px solid rgba(29,28,25,0.1); }
              .cmp th, .cmp td { border: 0; padding: 3px 0; }
              .cmp tbody th { width: auto; margin-bottom: 4px; }
              .cmp td::before { content: attr(data-side) ": "; color: rgba(29,28,25,0.5); font-weight: 600; }
              .cmp td:last-child { background: transparent; padding-left: 10px; box-shadow: inset 2px 0 0 #1d1c19; color: #1d1c19; }
            }
          `,
        }}
      />
      <SiteHeader tone="light" audience="any" />
      <main className="cmp">
        <header className="cmp-head">
          <h1>{TITLE}</h1>
          <p className="cmp-lede">{LEDE}</p>
          <p className="cmp-updated">Last reviewed: November 25, 2026</p>
        </header>
      <section>
        <h2>The short answer</h2>
        <p>
          <strong>Pick n8n, Make or Zapier</strong> when the job is mostly moving data between hosted
          apps in reaction to events, around the clock: a webhook fires, a record syncs, a message is
          sent, whether or not your computer is on. That is what they are built for, and they connect
          to a very large catalog of apps.
        </p>
        <p>
          <strong>Pick Toone</strong> when the work that comes back every week mixes mechanical steps
          with research, writing or decisions, and you would rather describe it than wire it. Toone
          decides which steps a script can do exactly and which need an agent, checks every output
          against a contract, and lets you watch, pause and edit each run.
        </p>
      </section>

      <section>
        <h2>Side by side</h2>
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">n8n, Make, Zapier</th>
              <th scope="col">AI agents on a schedule</th>
              <th scope="col">Toone</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, nodes, agents, toone]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td data-side="n8n, Make, Zapier">{nodes}</td>
                <td data-side="AI agents on a schedule">{agents}</td>
                <td data-side="Toone">{toone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Agentic by default, scripted where it counts</h2>
        <p>
          In node-based tools, every step is a node you place and configure, and AI is one more kind
          of node. In Toone, a routine is agentic by default: you describe the job, Toone drafts it, and
          agents take every step that needs judgment. The steps that never change become{` `}
          <strong>automatic steps</strong>, scripts that call an API, sort a list or move a file the
          same way every time, with no model and no tokens.
        </p>
        <p>
          A weekly SEO refresh shows the split: pulling rankings, picking the pages that lost
          positions, saving drafts and sending the report are automatic steps; rewriting each page
          and fact-checking the changes are agent steps. Four of the six steps use no AI.
        </p>
      </section>

      <section>
        <h2>Toone vs AI agents on a schedule</h2>
        <p>
          A scheduled chat task or a coding agent on a timer is flexible, but every step runs through
          a model: it draws on your AI plan for work a script could do exactly, and the result can
          come out different from one run to the next. Toone keeps the mechanical steps out of the model, checks each agent
          step’s output against a contract, and remembers what earlier runs already did, so
          work they finished isn’t redone.
        </p>
      </section>

      <section>
        <h2>Can I use both?</h2>
        <p>
          Yes. An automatic step is a script, so it can call any service with an API, including a
          webhook in n8n, Make or Zapier. A common split is to keep always-on app-to-app syncs where
          they are and move the weekly work that needs judgment into a Toone routine.
        </p>
      </section>

      <section>
        <h2>What Toone needs</h2>
        <p>
          A Mac, and your own Claude Code or Codex for the agent steps (the Claude or ChatGPT plan you
          already pay for). Toone runs on your Mac, so its routines run while your Mac is awake and
          Toone is open.
          Running routines is never limited; see <a href="/en/pricing">pricing</a> for what Toone Pro
          adds.
        </p>
      </section>

      <section>
        <h2>About this comparison</h2>
        <p>
          Other products are described by how they are built, from their public documentation as of
          November 2026. Features change; check each product’s own documentation before you
          decide. Toone’s claims follow our <a href="/en/editorial-policy">editorial policy</a>.
        </p>
      </section>
      </main>
      <Footer />
    </>
  );
}
