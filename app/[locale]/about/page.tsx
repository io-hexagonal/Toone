import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "About Toone",
    description:
      "Meet Toone, the local-first macOS application for organizing governed AI agents into departments, roles, and routines.",
    alternates: {
      canonical: "https://trytoone.com/en/about",
      languages: {
        en: "https://trytoone.com/en/about",
        "x-default": "https://trytoone.com/en/about",
      },
    },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: "https://trytoone.com/en/about",
      title: "About Toone",
      description: "Toone is a local-first, governed AI operating layer published by Hexagonal.io.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/about");
  setRequestLocale(locale);

  return (
    <TrustPage
        eyebrow="Company"
        title="About Toone"
        lede="Toone helps companies organize AI agents as working teams with explicit roles, routines, context, permissions, and human decision points."
        updated="August 10, 2026"
      >
        <section>
          <h2>What Toone is</h2>
          <p>
            Toone is a native macOS application for building and running teams of AI agents. An
            organization can define departments, specialist roles, scheduled or on-demand routines,
            and handoffs so recurring work has a durable operating structure.
          </p>
          <p>
            Users bring their own supported Anthropic or OpenAI access. Toone supplies the operating
            layer around those agents rather than presenting itself as an AI model provider.
          </p>
        </section>

        <section>
          <h2>Local-first by design</h2>
          <p>
            Organization definitions, working context, conversations, and project files live on the
            user&apos;s Mac. Website accounts, early-access requests, anonymous analytics, and optional
            encrypted relay connections are separate services and are described in the{` `}
            <a href="/en/privacy">privacy policy</a>.
          </p>
        </section>

        <section>
          <h2>Publisher and accountability</h2>
          <p>
            Toone is an independent product published by{` `}
            <a href="https://hexagonal.io">Hexagonal.io</a>. It is not affiliated with Anthropic or
            OpenAI. Product, architecture, privacy, and release claims are checked against current
            product, repository, and release evidence before publication.
          </p>
        </section>

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
            <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>. For public technical issues,
            use the <a href="https://github.com/io-hexagonal/Toone">Toone GitHub repository</a>.
          </p>
        </section>
    </TrustPage>
  );
}
