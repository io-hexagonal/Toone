import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import FeaturedOnStrip from "@/components/FeaturedOnStrip";
import { LEGAL_NOTICE_PATH } from "@/lib/legal/terms";
import { TRADER_DETAILS_COMPLETE } from "@/lib/legal/trader";

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // Already carries the brand twice ("Toone", "Toone AI"): `absolute` keeps
    // the root `%s | Toone` template from adding a third (audit P2-5).
    title: { absolute: "About Toone (Toone AI) | macOS app by Hexagonal.io" },
    description:
      "Toone, also known as Toone AI, is a macOS app published by Matheus Paranhos, a sole trader in Portugal (Hexagonal.io), that turns repeat work into routines: scripts run the steps that never change and AI agents only the steps that need judgment, on your own Claude Code or Codex, with every run visible and editable.",
    alternates: { canonical: "https://trytoone.com/en/about" },
    robots: localeRobots(locale),
    other: localeVersions("/about", ["en"]),
    openGraph: {
      type: "website",
      url: "https://trytoone.com/en/about",
      title: "About Toone (Toone AI)",
      description:
        "Agentic by default, scripted where it counts: describe the work, and Toone runs the fixed steps as scripts and the judgment calls with AI agents, on a live graph you can pause, edit, and resume.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function AboutPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/about", searchParams);
  setRequestLocale(locale);

  return (
    <TrustPage
        eyebrow="Company"
        title="About Toone"
        lede="Agentic by default, scripted where it counts. Toone is a Mac app where you describe repeat work in plain words; the steps that never change run as scripts, the steps that need judgment go to AI agents, and every run plays out on a live graph you can pause, edit, and resume."
        updated="November 25, 2026"
      >
        <section>
          <h2>What Toone is</h2>
          <p>
            Toone is a native macOS app for work that comes back every week or month. You describe
            a multi-step job the way you would brief a colleague (when it runs, which models, which
            accounts) and Toone drafts it as a routine: a graph of steps, in parallel where the work
            allows. Each step is one of two kinds. An <strong>automatic step</strong> runs a script
            that does the mechanical part exactly (an API call, a sort, a file move) with no model
            and no tokens. An <strong>agent step</strong> goes to an AI agent, only where
            the work needs research, writing, or a decision. As the work grows, routines can call
            other routines.
          </p>
          <p>
            A routine is a process, not a prompt on a timer. It runs the same steps and the same
            checks every time, remembers what it already did, so finished work isn&apos;t redone, and
            lets each step use the model that suits it. Contracts check each step&apos;s output; a
            step that falls short pauses on its own, so you can edit it and resume where it
            stopped while finished steps keep their results.
          </p>
        </section>

        <section>
          <h2>Who it is for</h2>
          <p>
            Anyone on a Mac with complex work that comes back every week or month: operators and
            agencies running the same client or back-office work, researchers, marketers, founders,
            and creators. It suits jobs that mix integrations, like moving and matching data between your
            tools, with steps that need judgment. In n8n, Make or Zapier that work takes many
            hand-wired nodes; see <a href="/en/compare">how they compare</a>. For companies, the same routines write down how the team works: steps that send,
            post or pay can wait for a person&apos;s approval, and every run leaves a record.
          </p>
          <p>
            The public <a href="/en/explore">Explore</a> library has reviewed routines and bundles
            you can open in Toone and adapt instead of starting from an empty page.
          </p>
        </section>

        <section>
          <h2>Your models, your accounts</h2>
          <p>
            Toone runs on your own Claude Code or Codex, with the Claude or ChatGPT plan you
            already pay for, and works in your own accounts through its built-in browser.
            Toone supplies the layer around those agents (structure, checks, memory, and control)
            rather than presenting itself as an AI model provider.
          </p>
        </section>

        <section>
          <h2>Local-first by design</h2>
          <p>
            Agents, routines, run history, conversations, and project files live on your Mac.
            Website accounts, early-access requests, anonymous analytics, Explore listings, and
            optional encrypted relay connections are separate services and are described in the{` `}
            <a href="/en/privacy">privacy policy</a>.
          </p>
        </section>

        <section>
          <h2>Who builds Toone</h2>
          <p>
            <strong style={{ color: "rgba(255,255,255,0.92)" }}>Matheus Paranhos</strong>, Founder
          </p>
          <p>
            Matheus is an AI solutions and software engineer and builds Toone at Hexagonal.io,
            alongside <a href="https://truleaf.org/about">Truleaf</a>, a discovery engine for plant
            science. A nomad since birth, Matheus has lived across four continents, from the Amazon
            jungle to China, Argentina, and Spain, and is now based in Europe. Matheus is
            Brazilian by nationality and a Portuguese dual citizen.
          </p>
          <p>
            <a href="https://www.linkedin.com/in/matheusbparanhos/">Connect on LinkedIn</a>
          </p>
        </section>

        <section>
          <h2>Publisher and accountability</h2>
          <p>
            Toone is an independent product published by Matheus Paranhos, a sole trader
            (empresário em nome individual) in Portugal, trading as Toone, and published under his{` `}
            <a href="https://www.hexagonal.io/">Hexagonal.io</a> brand. The trader&apos;s address and
            tax number are in the{` `}
            {TRADER_DETAILS_COMPLETE
              ? <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>
              : <a href="/en/terms#toone-pro">Terms</a>}
            . It is supported by the{` `}
            <a href="https://claude.com/programs/startups">Claude Startups</a> and AWS Startups
            programmes, and is not otherwise affiliated with or endorsed by Anthropic, OpenAI, or
            AWS. Product, privacy, and release claims are checked against current product,
            repository, and release evidence before publication.
          </p>
        </section>

        <FeaturedOnStrip variant="trust" />

        <section>
          <h2>Evidence standards</h2>
          <p>
            Product claims are tied to behavior visible in the application, public repository,
            release evidence, or named deployments. Toone does not publish adoption, performance,
            security, revenue, or customer-outcome claims without a recorded source and method.
            The full standard is in the <a href="/en/editorial-policy">editorial policy</a>.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For product or policy questions, email{` `}
            <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>. Existing users can also ask for help with access and downloads.
          </p>
        </section>
    </TrustPage>
  );
}
