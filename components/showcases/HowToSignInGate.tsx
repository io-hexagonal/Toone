import LandingAudienceBar from "@/components/LandingAudienceBar";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import HowToSessionGate from "./HowToSessionGate";
import pageStyles from "./ProductShowcase.module.css";
import styles from "./HowToSignInGate.module.css";

/**
 * /how-to for a request without a live site session: the site chrome and a
 * sign-in card. No guide content (title, body, navigation) is rendered.
 */
export default function HowToSignInGate({ path }: { path: string }) {
  return (
    <div className={pageStyles.page}>
      <LandingAudienceBar activeAudience="personal" />
      <SiteHeader landingPath="/" scrollThreshold={260} />
      <main className={styles.wrap}>
        <HowToSessionGate path={path} />
      </main>
      <Footer landingPath="/" />
    </div>
  );
}
