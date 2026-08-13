import { getPublications } from "@/lib/content";

export default function ResourcesSection() {
  const publications = getPublications().filter((publication) => publication.featured).slice(0, 2);

  return (
    <section className="section resource-preview" aria-labelledby="resources-title">
      <style dangerouslySetInnerHTML={{ __html: `
        .resource-preview-head {
          display: flex; justify-content: space-between; align-items: end;
          gap: 28px; margin-bottom: 36px;
        }
        .resource-preview-head .sub { margin-bottom: 0; }
        .resource-preview-all {
          color: rgba(29,28,25,.64); font-size: 13px; text-decoration: none;
          border-bottom: 1px solid rgba(29,28,25,.24); padding-bottom: 3px;
        }
        .resource-preview-all:hover { color: #1d1c19; border-color: #1d1c19; }
        .resource-preview-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
        .resource-preview-card {
          position: relative; display: flex; flex-direction: column; min-height: 310px;
          padding: 28px; overflow: hidden; color: inherit; text-decoration: none;
          border: 1px solid rgba(29,28,25,.11); border-radius: 18px;
          background: rgba(255,255,255,.46); transition: transform .25s,border-color .25s;
        }
        .resource-preview-card::after {
          content: ''; position: absolute; width: 220px; height: 220px;
          right: -95px; bottom: -110px; border-radius: 50%;
          background: radial-gradient(circle,rgba(92,124,114,.18),transparent 68%);
        }
        .resource-preview-card:nth-child(2)::after { background: radial-gradient(circle,rgba(118,104,127,.17),transparent 68%); }
        .resource-preview-card:hover { transform: translateY(-4px); border-color: rgba(29,28,25,.3); }
        .resource-preview-type {
          color: rgba(29,28,25,.48); font-size: 10px; font-weight: 750;
          letter-spacing: .15em; text-transform: uppercase;
        }
        .resource-preview-card h3 {
          position: relative; z-index: 1; max-width: 16ch; margin-top: 44px;
          color: #1d1c19; font-size: clamp(25px,3.2vw,35px); line-height: 1.1;
          letter-spacing: -.035em; font-weight: 640;
        }
        .resource-preview-card p {
          position: relative; z-index: 1; margin-top: 14px;
          color: rgba(29,28,25,.6); font-size: 13px; line-height: 1.6;
        }
        .resource-preview-meta {
          position: relative; z-index: 1; margin-top: auto; padding-top: 26px;
          color: rgba(29,28,25,.42); font-size: 11px;
        }
        @media (max-width: 700px) {
          .resource-preview-head { align-items: start; flex-direction: column; }
          .resource-preview-grid { grid-template-columns: 1fr; }
          .resource-preview-card { min-height: 280px; }
        }
      ` }} />
      <div className="resource-preview-head">
        <div>
          <h2 id="resources-title">Ideas you can put to work</h2>
          <p className="sub">Practical guides for designing AI-native operations with evidence and accountable boundaries.</p>
        </div>
        <a href="/en/resources" className="resource-preview-all">Browse all resources</a>
      </div>
      <div className="resource-preview-grid">
        {publications.map((publication) => (
          <a key={publication.slug} href={`/en${publication.canonicalPath}`} className="resource-preview-card">
            <span className="resource-preview-type">{publication.eyebrow}</span>
            <h3>{publication.title}</h3>
            <p>{publication.description}</p>
            <span className="resource-preview-meta">{publication.readTime}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
