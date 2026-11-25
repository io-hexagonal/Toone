import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";

/**
 * Help for the online Toone connector in Claude (claude.ai, Claude Desktop,
 * the Claude phone app): what it does, what it needs, how to connect, and the
 * answers people actually see when something is off. English only, like the
 * privacy policy it links to. Public: no tool names, prompts or server
 * internals beyond the connector's own address.
 */
type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

const CANONICAL = "https://trytoone.com/en/claude";
const TITLE = "Toone connector for Claude";
const DESCRIPTION =
  "Use Toone from Claude: see what your routines are doing, start one, follow it live, answer its questions and make new routines. Requirements, setup, access and troubleshooting.";
/** The address Claude connects to; the only server address this page names. */
const CONNECTOR_URL = "https://api.trytoone.com/mcp";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // The title carries the brand; `absolute` skips the root template (F26).
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/claude", ["en"]),
    // R7: og:url must equal the canonical.
    openGraph: {
      type: "website",
      url: CANONICAL,
      title: TITLE,
      description: "See, start and follow your Toone routines from Claude.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function ClaudeConnectorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/claude", searchParams);
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Help"
      title={TITLE}
      lede="Ask Claude about your Toone routines from claude.ai, Claude Desktop or the Claude phone app. Claude asks Toone on your Mac, and Toone does the work there."
      updated="November 25, 2026"
      updatedLabel="Updated"
    >
      <section id="what-it-does">
        <h2>What it does</h2>
        <p>With the Toone connector, Claude can:</p>
        <ul>
          <li>tell you which routines are running and what is waiting for you;</li>
          <li>start a routine and show a live view of the run in the chat;</li>
          <li>follow a run until it finishes or needs you;</li>
          <li>pass on a routine&apos;s questions and send your answer back;</li>
          <li>make a new routine from a description and publish it;</li>
          <li>add a shared routine from Toone Explore.</li>
        </ul>
        <p>
          Your routines still run in Toone on your Mac, with the AI you use in Toone. Claude asks,
          and shows you what Toone answers.
        </p>
      </section>

      <section id="requirements">
        <h2>What you need</h2>
        <ul>
          <li>
            Toone for Mac 1.0.90 or later, downloaded from trytoone.com, signed in to your Toone
            account, with Toone Pro. The Mac App Store edition does not include the connector.
          </li>
          <li>
            &ldquo;Claude and other assistants (online)&rdquo; turned on in Toone, under Settings
            &rarr; Connected Apps.
          </li>
          <li>Your Mac awake, with Toone open.</li>
        </ul>
      </section>

      <section id="connect">
        <h2>How to connect</h2>
        <ul>
          <li>
            In Claude, open the connector settings and add Toone from the connectors directory. If
            you don&apos;t see Toone there, add a custom connector with this address:{" "}
            <code>{CONNECTOR_URL}</code>
          </li>
          <li>Claude opens a Toone page in your browser. Sign in to your Toone account.</li>
          <li>Pick your Mac, choose the access, then select Allow.</li>
          <li>Back in Claude, ask about your routines.</li>
        </ul>
        <p>
          Once connected, Toone is available in Claude on the web, in Claude Desktop and in the
          Claude phone app.
        </p>
      </section>

      <section id="access">
        <h2>Access</h2>
        <p>
          You choose the access for each connection. You can change it later in Toone, under
          Settings &rarr; Connected Apps.
        </p>
        <dl>
          <dt>Read only</dt>
          <dd>Claude can see your routines, runs and what is waiting for you, and changes nothing.</dd>
          <dt>Ask me each time</dt>
          <dd>Before anything changes, Toone asks you to confirm on your Mac.</dd>
          <dt>Auto (recommended)</dt>
          <dd>Toone runs what you asked for without asking again.</dd>
        </dl>
        <p>
          Shared routines that contain scripts are never installed through the online connector. Add
          those in Toone on your Mac, where installing one always asks you first.
        </p>
      </section>

      <section id="privacy">
        <h2>Privacy</h2>
        <p>
          Claude&apos;s requests pass through Toone&apos;s server to your Mac over an encrypted
          connection, and the answers come back the same way. Toone passes them on without storing
          what they contain. What Claude reads from Toone goes to Claude under your Anthropic
          account. The details are in the{" "}
          <a href="/en/privacy#claude-connector">Privacy Policy</a>.
        </p>
      </section>

      <section id="examples">
        <h2>Things to ask</h2>
        <ul>
          <li>What&apos;s going on in Toone?</li>
          <li>Run the Greeting card routine for Ada Lovelace and follow it to the end.</li>
          <li>What is waiting for me in Toone?</li>
          <li>Set up a routine that counts the words in a text.</li>
        </ul>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <p>Claude passes on what Toone says when something is in the way. The usual answers:</p>

        <h3>Toone is not taking requests from assistants</h3>
        <p>
          The online switch is off on that Mac. In Toone, open Settings &rarr; Connected Apps and turn
          on &ldquo;Claude and other assistants (online)&rdquo;.
        </p>

        <h3>Your Mac is offline</h3>
        <p>
          The Mac is asleep, or Toone is closed. Wake the Mac, open Toone, and ask again. Claude can
          only reach Toone while the Mac is awake and Toone is open.
        </p>

        <h3>Update Toone</h3>
        <p>
          Toone on that Mac is too old for the connector, which needs Toone for Mac 1.0.90 or later. In
          Toone, choose Toone &rarr; Check for Updates, then ask again.
        </p>

        <h3>No Mac signed in to this account</h3>
        <p>
          No Mac running Toone is signed in to the Toone account you connected, or Toone on that Mac
          was signed out. Open Toone, sign in with the same account, and turn on the online switch.
        </p>

        <h3>Toone Pro required</h3>
        <p>
          The connector is part of Toone Pro, and the account you connected does not have it. If you
          have Toone Pro on another account, disconnect and connect again with that account.
        </p>

        <h3>Your AI isn&apos;t signed in in Toone</h3>
        <p>
          Making a routine uses the AI you set up in Toone on your Mac. Open Toone, go to Settings
          &rarr; AI Provider, sign in, and ask again.
        </p>

        <h3>A big routine shows a simpler view</h3>
        <p>
          A very large routine is shown as a list of its steps instead of a live graph. The full run
          is always in Toone on your Mac.
        </p>

        <h3>Nothing happens after you ask</h3>
        <p>
          With &ldquo;Ask me each time&rdquo;, Toone waits for you to confirm on your Mac. Look for
          Toone&apos;s request there.
        </p>
      </section>

      <section id="disconnect">
        <h2>Disconnecting</h2>
        <p>
          In Toone, open Settings &rarr; Connected Apps and disconnect Claude, or remove the Toone
          connector in Claude&apos;s connector settings.
        </p>
      </section>

      <section id="claude-code">
        <h2>Claude Code</h2>
        <p>
          To use Toone from Claude Code on the same Mac, there is a local plugin that talks to Toone
          directly, without Toone&apos;s server:{" "}
          <a href="https://github.com/io-hexagonal/toone-connector">github.com/io-hexagonal/toone-connector</a>.
        </p>
      </section>

      <section id="support">
        <h2>Support</h2>
        <p>
          Email <a href="mailto:support@trytoone.com">support@trytoone.com</a> with what you asked
          Claude and the message you saw. Do not send passwords, API keys or other sensitive data.
        </p>
      </section>
    </TrustPage>
  );
}
