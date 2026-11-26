import { getProductGuidePage } from "@/lib/product-showcase";
import { CREATOR_IDEAS } from "@/lib/creator-ideas";
import { NEWCOMER_IDEAS_PATH, NEWCOMER_INDEX } from "@/lib/newcomer-ideas-seo";

const FEATURED_GUIDE_SLUGS = ["getting-started", "getting-started/create-a-routine"];

export default function ResourcesSection() {
  const guides = FEATURED_GUIDE_SLUGS.map((slug) => {
    const page = getProductGuidePage(slug);
    if (!page) throw new Error(`Missing featured product guide page: ${slug}`);
    return page;
  });

  return (
    <section className="section resource-preview" aria-labelledby="resources-title">
      <style dangerouslySetInnerHTML={{ __html: `
        .resource-preview-head {
          display: flex; justify-content: space-between; align-items: end;
          gap: 28px; margin-bottom: clamp(28px, 3vw, 40px);
        }
        .resource-preview-head .sub { margin-bottom: 0; }
        .resource-preview-head .text-link { white-space: nowrap; }
        .resource-preview-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; }
        .resource-preview-card {
          position: relative; display: flex; flex-direction: column; min-height: 252px;
          padding: 28px 30px 26px; overflow: hidden; color: inherit; text-decoration: none;
          border-radius: var(--r-m); box-shadow: 0 0 0 1px rgba(29,28,25,.09);
          background: rgba(255,255,255,.4); transition: box-shadow .2s, background-color .2s;
        }
        .resource-preview-card:hover { background: #fff; box-shadow: var(--e2); }
        .resource-preview-card:focus-visible { outline: 2px solid #1d1c19; outline-offset: 3px; }
        .resource-preview-more {
          margin-top: 24px; color: rgba(29,28,25,.64); font-size: 15px; line-height: 1.6;
        }
        .resource-preview-more a {
          color: inherit; text-decoration: none;
          border-bottom: 1px solid rgba(29,28,25,.24); padding-bottom: 1px;
        }
        .resource-preview-more a:hover { color: #1d1c19; border-color: #1d1c19; }
        .resource-preview-type { color: rgba(29,28,25,.52); font-size: 14px; font-weight: 500; }
        .resource-preview-card h3 {
          position: relative; z-index: 1; max-width: 22ch; margin-top: 18px;
          color: #1d1c19; font-size: clamp(19px,1.6vw,22px); line-height: 1.2;
          letter-spacing: -.015em; font-weight: 600;
        }
        .resource-preview-card p {
          position: relative; z-index: 1; margin-top: 12px; max-width: 52ch;
          color: rgba(29,28,25,.64); font-size: 16px; line-height: 1.6;
        }
        .resource-preview-meta {
          position: relative; z-index: 1; margin-top: auto; padding-top: 22px;
          color: rgba(29,28,25,.5); font-size: 14px;
        }
        @media (max-width: 1000px) { .resource-preview-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
        @media (max-width: 700px) {
          .resource-preview-head { align-items: start; flex-direction: column; }
          .resource-preview-grid { grid-template-columns: 1fr; }
          .resource-preview-card { min-height: 0; padding: 24px 22px 22px; }
        }
      ` }} />
      <div className="resource-preview-head">
        <div>
          <h2 id="resources-title">From install to your first run</h2>
          <p className="sub">Set up Toone, build a routine you can run and inspect, or start from an idea Toone already runs.</p>
        </div>
        <a href="/en/how-to" className="text-link">Browse the full guide</a>
      </div>
      <div className="resource-preview-grid">
        {guides.map((guide) => (
          <a key={guide.slug} href={`/en/how-to/${guide.slug}`} className="resource-preview-card">
            {/* The guide's section only ("Getting started"), without its step counter. */}
            <span className="resource-preview-type">{guide.eyebrow.split(" · ")[0]}</span>
            <h3>{guide.title}</h3>
            <p>{guide.description}</p>
            {guide.estimatedTime ? (
              <span className="resource-preview-meta">{guide.estimatedTime}</span>
            ) : null}
          </a>
        ))}
        <a href={`/en${NEWCOMER_IDEAS_PATH}`} className="resource-preview-card">
          <span className="resource-preview-type">Ideas</span>
          <h3>{NEWCOMER_INDEX.heading}</h3>
          <p>Ready-made routines, like a Reddit watcher or a YouTube channel that improves with every review. Copy a prompt to start.</p>
          <span className="resource-preview-meta">{CREATOR_IDEAS.length} ideas</span>
        </a>
      </div>
      <p className="resource-preview-more">
        New to routines? Read{" "}
        <a href="/en/ai-agent-routines">what an AI agent routine is</a>, or start from one someone
        already built in{" "}
        <a href="/en/journal/introducing-explore-reviewed-ai-routines">
          Explore, a library of reviewed routines you can add to Toone
        </a>
        .
      </p>
    </section>
  );
}
