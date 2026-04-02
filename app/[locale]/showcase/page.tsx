import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

const SLIDES = [
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---agent-thread.jpg",
    title: "Agent Conversations",
    desc: "Chat with specialized agents across departments. They plan, research, and hand off context to each other — like a real team.",
  },
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---agent-template-thread-media---hook-analysis.jpg",
    title: "Content Analysis",
    desc: "Agents analyze social media posts, score hooks, classify patterns, and surface what makes content perform.",
  },
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---browser-integrations.jpg",
    title: "Browser Integrations",
    desc: "Built-in browser panel. Point an agent at any site and let it work directly with what's on screen.",
  },
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---recording-agent-thread.jpg",
    title: "Meeting Capture",
    desc: "Dual audio recording with live transcription. Agents listen, process, and organize meeting content in real time.",
  },
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---mobile.jpg",
    title: "Work From Anywhere",
    desc: "Take your agents with you. Chat, browse your org, and trigger routines — all from your phone.",
  },
  {
    img: "/assets/screenshots/desktop/desktop---sample-i---mobile---connect-ai-provider-byk.jpg",
    title: "Bring Your Own Keys",
    desc: "Use your existing OpenAI, Claude, or Gemini account. No middleman, no markup — your keys, your data.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Showcase",
    description:
      "See what Toone can do — agent teams, browser integrations, meeting capture, and mobile companion.",
  };
}

export default async function ShowcasePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0b11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

            .carousel { position: fixed; inset: 0; overflow: hidden; }
            .slide {
              position: absolute; inset: 0;
              opacity: 0; transition: opacity 0.8s ease, transform 0.8s ease;
              transform: scale(1.02); pointer-events: none;
            }
            .slide.active { opacity: 1; transform: scale(1); pointer-events: auto; }
            .slide.leaving { opacity: 0; transform: scale(0.97); }
            .slide-bg {
              position: absolute; inset: 0;
              background-size: cover; background-position: center;
              filter: blur(40px) saturate(1.4) brightness(0.3);
              transform: scale(1.15);
            }
            .slide-img {
              position: absolute; top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              max-width: 82vw; max-height: 76vh;
              border-radius: 14px;
              box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
              z-index: 2;
            }
            .nav-arrow {
              position: fixed; top: 50%; z-index: 20;
              transform: translateY(-50%);
              width: 48px; height: 48px; border-radius: 50%;
              background: rgba(255,255,255,0.05);
              backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.4); cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
            }
            .nav-arrow:hover {
              background: rgba(255,255,255,0.1);
              color: rgba(255,255,255,0.8);
              border-color: rgba(255,255,255,0.18);
            }
            .nav-arrow:active { transform: translateY(-50%) scale(0.95); }
            .nav-arrow svg { width: 20px; height: 20px; fill: currentColor; }
            .nav-prev { left: 20px; }
            .nav-next { right: 20px; }
            .dots {
              position: fixed; bottom: 28px; left: 50%;
              transform: translateX(-50%); z-index: 20;
              display: flex; gap: 8px; align-items: center;
            }
            .dot-indicator {
              width: 6px; height: 6px; border-radius: 50%;
              background: rgba(255,255,255,0.15); cursor: pointer;
              transition: background 0.3s, transform 0.3s;
            }
            .dot-indicator:hover { background: rgba(255,255,255,0.3); }
            .dot-indicator.active { background: rgba(255,255,255,0.7); transform: scale(1.3); }
            .top-bar {
              position: fixed; top: 0; left: 0; right: 0; z-index: 20;
              display: flex; justify-content: space-between; align-items: center;
              padding: 16px 24px;
              background: linear-gradient(to bottom, rgba(10,11,17,0.6) 0%, transparent 100%);
              pointer-events: none;
            }
            .top-bar a { pointer-events: auto; }
            .back-link {
              display: inline-flex; align-items: center; gap: 6px;
              color: rgba(255,255,255,0.35); text-decoration: none; font-size: 13px;
              letter-spacing: 0.04em; transition: color 0.2s;
            }
            .back-link:hover { color: rgba(255,255,255,0.6); }
            .back-link svg { width: 14px; height: 14px; fill: currentColor; }
            .dl-link {
              color: rgba(255,255,255,0.35); text-decoration: none; font-size: 12px;
              font-weight: 500; letter-spacing: 0.04em;
              padding: 8px 16px; border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.08);
              background: rgba(255,255,255,0.04);
              transition: color 0.2s, background 0.2s, border-color 0.2s;
            }
            .dl-link:hover {
              color: rgba(255,255,255,0.7);
              background: rgba(255,255,255,0.08);
              border-color: rgba(255,255,255,0.16);
            }
            .counter {
              position: fixed; bottom: 28px; right: 24px; z-index: 20;
              font-size: 11px; color: rgba(255,255,255,0.2);
              letter-spacing: 0.06em; font-variant-numeric: tabular-nums;
            }
          `,
        }}
      />

      {/* Top bar */}
      <div className="top-bar">
        <Link href="/" className="back-link">
          <svg viewBox="0 0 16 16">
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
          </svg>
          Toone
        </Link>
        <a
          className="dl-link"
          href="https://github.com/mattwebhub/toone/releases"
        >
          Download
        </a>
      </div>

      {/* Carousel */}
      <div className="carousel" id="carousel">
        {SLIDES.map((s, i) => (
          <div key={i} className={`slide${i === 0 ? " active" : ""}`}>
            <div
              className="slide-bg"
              style={{ backgroundImage: `url('${s.img}')` }}
            />
            <img
              className="slide-img"
              src={s.img}
              alt={s.title}
              loading={i < 2 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button className="nav-arrow nav-prev" id="btn-prev" aria-label="Previous">
        <svg viewBox="0 0 16 16">
          <path d="M9.78 3.47a.75.75 0 010 1.06L6.81 7.5h5.44a.75.75 0 010 1.5H6.81l2.97 2.97a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" />
        </svg>
      </button>
      <button className="nav-arrow nav-next" id="btn-next" aria-label="Next">
        <svg viewBox="0 0 16 16">
          <path d="M6.22 3.47a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.19 9H3.75a.75.75 0 010-1.5h5.44L6.22 4.53a.75.75 0 010-1.06z" />
        </svg>
      </button>

      {/* Dots */}
      <div className="dots" id="dots">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`dot-indicator${i === 0 ? " active" : ""}`}
            data-index={i}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="counter" id="counter">
        1 / {SLIDES.length}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var TOTAL = ${SLIDES.length};
  var INTERVAL = 5000;
  var current = 0;
  var timer = null;
  var carousel = document.getElementById('carousel');
  var dotsEl = document.getElementById('dots');
  var counterEl = document.getElementById('counter');

  function goTo(idx) {
    if (idx === current) return;
    var slides = carousel.querySelectorAll('.slide');
    var dots = dotsEl.querySelectorAll('.dot-indicator');
    slides[current].classList.remove('active');
    slides[current].classList.add('leaving');
    dots[current].classList.remove('active');
    var prev = current;
    current = idx;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    counterEl.textContent = (current + 1) + ' / ' + TOTAL;
    setTimeout(function(){ slides[prev].classList.remove('leaving'); }, 800);
    resetTimer();
  }

  function go(dir) {
    goTo((current + dir + TOTAL) % TOTAL);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function(){ go(1); }, INTERVAL);
  }
  function resetTimer() { clearInterval(timer); startTimer(); }

  document.getElementById('btn-prev').onclick = function(){ go(-1); };
  document.getElementById('btn-next').onclick = function(){ go(1); };

  var dotEls = dotsEl.querySelectorAll('.dot-indicator');
  dotEls.forEach(function(d, i){ d.onclick = function(){ goTo(i); }; });

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  startTimer();
})();
          `,
        }}
      />
    </>
  );
}
