"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import {
  ApiError,
  clearSession,
  getMe,
  downloadDesktop,
  resolveDesktopDownload,
  loadSession,
  type ToneSession,
} from "@/lib/api";

type Variant = "standard" | "liquid-glass";

type Copy = {
  choicesLabel: string;
  standardBadge: string;
  standardTitle: string;
  standardRequirement: string;
  standardDescription: string;
  standardButton: string;
  liquidBadge: string;
  liquidTitle: string;
  liquidRequirement: string;
  liquidDescription: string;
  liquidButton: string;
};

function AppleLogo() {
  return (
    <svg viewBox="0 0 814 1000" aria-hidden="true" focusable="false">
      <path d="M788 341c-6 4-107 61-107 189 0 148 130 200 134 202-1 3-21 72-69 143-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-167 41s-107-58-157-129C43 787 0 664 0 547c0-187 122-286 242-286 64 0 117 42 157 42 38 0 97-45 170-45 27 0 127 3 219 83zM555 172c32-38 55-90 55-143 0-7-1-15-2-21-52 2-114 35-152 78-29 33-57 86-57 139 0 8 1 16 2 19 3 1 9 2 14 2 47 0 106-31 140-74z" />
    </svg>
  );
}

export default function AuthenticatedDownloadGrid({ copy }: { copy: Copy }) {
  const auth = useTranslations("auth");
  const [session, setSession] = useState<ToneSession | null>(null);
  const [downloading, setDownloading] = useState<Variant | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    const persisted = loadSession();
    if (!persisted) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    getMe(persisted.token)
      .then(() => {
        if (!cancelled) setSession(persisted);
      })
      .catch((caught) => {
        if (
          caught instanceof ApiError &&
          ["unauthorized", "invalid_token", "token_expired"].includes(caught.code)
        ) {
          clearSession();
        } else if (!cancelled) {
          setValidationError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function download(variant: Variant) {
    if (!session || downloading) return;
    setDownloading(variant);
    setDownloadError(false);
    // Prefer the brokered signed link: the bytes then come from GitHub's CDN instead of
    // the API host. Any failure other than an expired session falls back to the stream.
    try {
      const artifact = await resolveDesktopDownload(session.token, variant);
      window.location.assign(artifact.url);
      window.setTimeout(() => setDownloading(null), 4000);
      return;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setSession(null);
        setDownloading(null);
        return;
      }
    }
    try {
      const blob = await downloadDesktop(session.token, variant);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = variant === "standard" ? "Toone.dmg" : "Toone-Liquid-Glass.dmg";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setSession(null);
      } else setDownloadError(true);
    } finally { setDownloading(null); }
  }

  if (checking) {
    return <div className="download-access" aria-busy="true">…</div>;
  }

  if (validationError) {
    return (
      <div className="download-access">
        <p role="alert">{auth("errGeneric")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="download-access">
        <h2>{auth("signinTitle")}</h2>
        <p>{auth("signinSub")}</p>
        <Link className="download-button" href="/signin">{auth("signinBtn")}</Link>
        <Link className="download-waitlist-link" href="/request-access">{auth("requestAccess")}</Link>
      </div>
    );
  }

  return (
    <>
      {downloadError && <p role="alert" className="download-error">{auth("downloadUnavailable")}</p>}
      <section className="download-grid" aria-label={copy.choicesLabel}>
        <article className="download-card">
          <div className="download-badge">{copy.standardBadge}</div>
          <div className="download-card-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="download-appicon"
              src="/assets/icons/desktop/AppIcon/icon_light_128x128.png"
              srcSet="/assets/icons/desktop/AppIcon/icon_light_128x128.png 1x, /assets/icons/desktop/AppIcon/icon_light_128x128@2x.png 2x"
              alt=""
              width={56}
              height={56}
            />
            <h2>{copy.standardTitle}</h2>
          </div>
          <div className="download-requirement"><AppleLogo />{copy.standardRequirement}</div>
          <p>{copy.standardDescription}</p>
          <button
            type="button"
            className="download-button"
            disabled={downloading !== null}
            onClick={() => void download("standard")}
            data-umami-event="download-dmg-standard"
            data-umami-event-placement="download-page"
          >
            {downloading === "standard" ? auth("downloading") : copy.standardButton}
          </button>
        </article>

        <article className="download-card liquid">
          <div className="download-badge">{copy.liquidBadge}</div>
          <div className="download-card-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="download-appicon"
              src="/assets/icons/desktop/AppIcon/icon_dark_128x128.png"
              srcSet="/assets/icons/desktop/AppIcon/icon_dark_128x128.png 1x, /assets/icons/desktop/AppIcon/icon_dark_128x128@2x.png 2x"
              alt=""
              width={56}
              height={56}
            />
            <h2>{copy.liquidTitle}</h2>
          </div>
          <div className="download-requirement"><AppleLogo />{copy.liquidRequirement}</div>
          <p>{copy.liquidDescription}</p>
          <button
            type="button"
            className="download-button"
            disabled={downloading !== null}
            onClick={() => void download("liquid-glass")}
            data-umami-event="download-dmg-liquid-glass"
            data-umami-event-placement="download-page"
          >
            {downloading === "liquid-glass" ? auth("downloading") : copy.liquidButton}
          </button>
        </article>
      </section>
    </>
  );
}
