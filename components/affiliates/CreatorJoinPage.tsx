"use client";

import { useEffect, useState, type CSSProperties } from "react";
import RedeemPage from "@/components/account/RedeemPage";
import { Link } from "@/lib/navigation";
import { codeFromFragment, locationWithoutCode } from "@/components/account/redeem-code";
import { rememberPendingCode } from "@/lib/billing/pending-code";
import CreatorIdeas from "./CreatorIdeas";
import styles from "@/components/account/account.module.css";
import css from "./creators.module.css";

const BENEFITS: { title: string; text: string; featured?: boolean }[] = [
  { title: "Toone Pro, for life", text: "Every Pro feature on your account, with no renewal.", featured: true },
  { title: "Your own link", text: "A link and a code that give your audience a discount." },
  { title: "Revenue share", text: "A share of what your link sells, paid monthly." },
  { title: "Your dashboard", text: "Visits, sales and your share, in one place." },
];

/**
 * /creators/join#code=…: what a creator gets, then the code flow of /redeem
 * (sign up with the code, or sign in and redeem it), which gives the account
 * Toone Pro for life. The code stays in the fragment until RedeemPage reads it.
 * English only, like the other pages sent one to one.
 */
export default function CreatorJoinPage() {
  const [started, setStarted] = useState(false);
  // Take the single-use creator code out of the address bar at once (history, screenshots,
  // analytics page views); it stays in this tab's session storage, where RedeemPage reads it.
  useEffect(() => {
    const code = codeFromFragment(window.location.hash);
    if (code) rememberPendingCode(code);
    if (window.location.hash || new URLSearchParams(window.location.search).has("code")) {
      window.history.replaceState(null, "", locationWithoutCode(window.location.pathname, window.location.search));
    }
  }, []);
  if (started) return <RedeemPage doneLink={{ href: "/creators", label: "Open your creator dashboard" }} />;
  return (
    <main className={styles.page}>
      <div className={css.wide}>
        <header className={styles.header} style={{ justifyContent: "center", borderBottom: 0, paddingBottom: 0 }}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
        </header>
        <div className={css.narrow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/creators/hero.webp" alt="" width={1600} height={900} style={{ width: "100%", maxWidth: 460, height: "auto", aspectRatio: "21 / 9", objectFit: "cover", objectPosition: "50% 58%", display: "block", margin: "14px auto 0", mixBlendMode: "lighten" }} />
          <div className={styles.title} style={{ marginTop: 6 }}>
            <p className={styles.eyebrow}>Toone creators</p>
            <h1>Join Toone as a creator</h1>
            <p className={styles.sub}>Toone turns repeatable work into routines that run on your Mac. This invitation is yours and works once.</p>
          </div>
        </div>
        <section className={css.offer} aria-labelledby="creator-offer" style={{ "--offer-bed": "url(/assets/creators/offer-bed.webp)" } as CSSProperties}>
          <div className={css.offerHead}>
            <h2 id="creator-offer">What you get</h2>
            <span className={css.badge}>Founding creator</span>
          </div>
          <ul className={css.benefits}>
            {BENEFITS.map((benefit, index) => (
              <li key={benefit.title} className={`${css.benefit}${benefit.featured ? ` ${css.featured}` : ""}`}>
                <span className={css.num} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className={css.benefitText}>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.text}</span>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className={css.cta} onClick={() => setStarted(true)}>
            Join and claim Toone Pro <span aria-hidden="true">→</span>
          </button>
          <p className={css.footnote}>New to Toone? You will create an account. Already have one? Sign in and the invitation is added to it.</p>
        </section>
        <CreatorIdeas />
      </div>
    </main>
  );
}
