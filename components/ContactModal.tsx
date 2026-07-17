"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * ContactCta — a CTA button that opens the contact modal instead of a mailto
 * link. Submissions go to /api/contact, which forwards them to the team's
 * Discord channel. Styling follows the landing design language: the dark
 * ground (#141413), rgba-white hairline borders, the cream primary button
 * (see HeroAuth's .ha-continue) and the .sc-btn trigger it replaces.
 */
export default function ContactCta({
  className,
  source,
  children,
}: {
  className?: string;
  /** Where the modal was opened from — shown in the Discord message. */
  source: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        data-umami-event={`contact-open-${source}`}
      >
        {children}
      </button>
      {open && <ContactModal source={source} onClose={() => setOpen(false)} />}
    </>
  );
}

function ContactModal({ source, onClose }: { source: string; onClose: () => void }) {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const nameRef = useRef<HTMLInputElement>(null);

  // Escape closes; the page behind the overlay must not scroll.
  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, message, source }),
      });
      if (res.ok) {
        setStatus("success");
        (window as unknown as { umami?: { track: (n: string) => void } })
          .umami?.track("contact-submit");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cm-overlay {
              position: fixed; inset: 0; z-index: 80;
              background: rgba(10,10,9,0.72);
              backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
              display: flex; align-items: center; justify-content: center;
              padding: 20px;
              animation: cm-fade 0.18s ease;
            }
            @keyframes cm-fade { from { opacity: 0; } to { opacity: 1; } }
            .cm-card {
              width: 100%; max-width: 440px;
              border: 1px solid rgba(255,255,255,0.11); border-radius: 16px;
              background: #1b1b19;
              padding: 30px 28px 26px;
              display: flex; flex-direction: column; gap: 12px;
              animation: cm-rise 0.22s ease;
              max-height: calc(100svh - 40px); overflow-y: auto;
            }
            @keyframes cm-rise {
              from { opacity: 0; transform: translateY(10px) scale(0.985); }
              to { opacity: 1; transform: none; }
            }
            .cm-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
            .cm-title {
              color: rgba(255,255,255,0.94); font-size: 20px; font-weight: 600;
              letter-spacing: -0.02em; line-height: 1.25; margin: 0; flex: 1;
            }
            .cm-close {
              flex: none; border: none; background: transparent; cursor: pointer;
              color: rgba(255,255,255,0.4); font-size: 20px; line-height: 1;
              padding: 2px 6px; border-radius: 8px;
            }
            .cm-close:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.06); }
            .cm-sub {
              color: rgba(255,255,255,0.44); font-size: 13.5px; line-height: 1.6;
              margin: 0 0 8px;
            }
            .cm-label {
              color: rgba(255,255,255,0.4); font-size: 10.5px; font-weight: 600;
              letter-spacing: 0.12em; text-transform: uppercase;
            }
            .cm-input, .cm-textarea {
              width: 100%; box-sizing: border-box; padding: 11px 13px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.92);
              font-size: 14px; outline: none; font-family: inherit;
            }
            .cm-input::placeholder, .cm-textarea::placeholder { color: rgba(255,255,255,0.35); }
            .cm-input:focus, .cm-textarea:focus { border-color: rgba(255,255,255,0.35); }
            .cm-textarea { resize: vertical; min-height: 96px; line-height: 1.55; }
            .cm-submit {
              width: 100%; padding: 12px; border-radius: 10px; border: none;
              background: #f0ede6; color: #1d1c19; cursor: pointer;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
              transition: transform 0.15s ease; margin-top: 4px;
            }
            .cm-submit:hover { transform: scale(1.015); }
            .cm-submit:disabled { opacity: 0.6; transform: none; cursor: default; }
            .cm-error { color: rgba(255,160,150,0.85); font-size: 12.5px; text-align: center; margin: 0; }
            .cm-done { text-align: center; padding: 26px 0 18px; }
            .cm-done-mark { font-size: 30px; margin-bottom: 12px; }
            .cm-done p { color: rgba(255,255,255,0.85); font-size: 14.5px; line-height: 1.6; margin: 0; }
          `,
        }}
      />
      <div
        className="cm-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="cm-card" role="dialog" aria-modal="true" aria-label={t("title")}>
          <div className="cm-head">
            <h3 className="cm-title">{t("title")}</h3>
            <button type="button" className="cm-close" onClick={close} aria-label={t("close")}>
              ×
            </button>
          </div>

          {status === "success" ? (
            <div className="cm-done">
              <div className="cm-done-mark">✓</div>
              <p>{t("done")}</p>
            </div>
          ) : (
            <>
              <p className="cm-sub">{t("sub")}</p>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label className="cm-label" htmlFor="cm-name">
                  {t("nameLabel")}
                </label>
                <input
                  id="cm-name"
                  ref={nameRef}
                  className="cm-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePh")}
                  required
                  maxLength={200}
                />
                <label className="cm-label" htmlFor="cm-email">
                  {t("emailLabel")}
                </label>
                <input
                  id="cm-email"
                  className="cm-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPh")}
                  required
                  maxLength={320}
                />
                <label className="cm-label" htmlFor="cm-company">
                  {t("companyLabel")}
                </label>
                <input
                  id="cm-company"
                  className="cm-input"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t("companyPh")}
                  maxLength={200}
                />
                <label className="cm-label" htmlFor="cm-message">
                  {t("messageLabel")}
                </label>
                <textarea
                  id="cm-message"
                  className="cm-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePh")}
                  required
                  maxLength={2000}
                />
                {status === "error" && <p className="cm-error">{t("error")}</p>}
                <button className="cm-submit" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "…" : t("send")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
