# Toone Privacy Policy — release review

**Status:** The source page is indexable and linked from the footer, About
page, and sitemap so it can serve as a public App Store privacy URL after
deployment. It replaces inaccurate local-only and direct-AI claims in the old
policy. This commit does not deploy the page or publish App Store Connect
privacy answers. Final release review must consider the exact binary, deployed
backend and site, provider behavior, and applicable legal disclosures.

[Apple requires a public privacy-policy URL and complete App Privacy answers](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).
Those answers are at the app level and must cover the existing iPhone app as
well as the Mac edition and integrated partners. Deploying this page alone
does not complete that requirement.

## Verified implementation facts used in the page

| Disclosure | Source checked 2026-09-28 |
| --- | --- |
| Store Mac disables Umami and browser cookie import; Codex only | `toone/distributions/toone-appstore/desktop-distribution.json`; `toone/apps/toone-desktop/Toone/Toone/Store/BrowserSessionImportUnavailable.swift`; `AnalyticsService.swift` |
| AI may receive prompts, authorized files/tool output and browser page content/images | `toone/docs/audits/2026-09-26-macos-app-store-sandbox/privacy-answer-matrix.md`, Codex and browser rows, with paths cited there |
| Mobile relay holds Mac/iPhone device IDs and creator IP, forwards encrypted application frames | Same matrix, relay rows and cited server migrations / relay implementation |
| Live Share receives share metadata and invitee email; approved peers view shared content | Same matrix, Live Share rows and cited migrations / session hub implementation |
| Speech may use Apple servers | Same matrix, speech row and cited `SpeechCaptureService.swift` |
| Website Apple login sends identity token and optional first-time name, but not authorization code; Apple private relay address possible | `lib/api.ts`, `lib/appleSignIn.ts`, `components/AppleSignInButton.tsx`, website callback route; `toone` server Apple auth implementation |
| Website account session is in browser `localStorage` | `lib/api.ts` (`toone.session`) |
| Website loads Umami only after a stored allow choice and remembers that choice for up to 180 days | `components/PrivacyChoices.tsx`, `lib/privacy-choices.ts`; the current layout mounts the choice control rather than an unconditional Umami script |
| Limited reviewer-funded Codex route, when enabled, forwards sanitized requests and responses through Toone and stores usage/cost ledger records | `toone/apps/toone-server/internal/services/reviewer_ai.go`, `reviewer_ai_stream.go`, and the reviewer AI privacy row in the matrix; production feature is currently off |
| Mac Store account deletion can be initiated in Settings when the backend intake is enabled; retained-category and status information are server-driven | `toone/apps/toone-desktop/Toone/Toone/Features/Settings/Views/AccountDeletionSettingsView.swift`, `toone/docs/audits/2026-09-26-macos-app-store-sandbox/account-deletion-release-decision.md`; production intake is currently off |
| Contact form forwards name/email/company/message to Discord | `app/api/contact/route.ts` |
| Website may store locale preference and announcement dismissal | `proxy.ts` with next-intl; `lib/announcements.ts` |

These are source observations, not a production network trace or proof of
third-party retention. The current website has a privacy choice and dynamically
loads analytics only for an allow choice. The page no longer claims the site
sets no cookies or that all Toone content stays on-device in every feature.

## Product and technical questions to close

1. Confirm exact signed Store and current iPhone binary behavior, including
   analytics/crash SDKs, speech and meeting capture, relay, Live Share, and
   any runtime configuration that differs from source.
2. Trace OpenAI Codex network behavior and terms for each Store auth mode:
   what prompts, files, images, screenshots, page content/URLs, tool output,
   and identifiers are retained, for how long and under which account? Check
   the reviewer-funded proxy's application/reverse-proxy logs and OpenAI API
   retention. Reconcile that path before making any direct-connection claim.
3. Confirm Direct analytics default, opt-out UI and transmitted event fields;
   verify whether content or account identifiers can enter event `data` or
   `identify` payloads. The policy avoids an absolute “never” claim because
   the generic analytics client accepts arbitrary fields.
4. Confirm relay room expiry and sweep cadence, backup/log retention, whether
   additional IPs are logged, and whether account and device records can be
   joined. Inspect Live Share invite/share data, provider email delivery,
   server logs, backups and content forwarding/TURN use.
5. Check which speech features reach the signed Store target, on-device versus
   Apple server recognition, and whether raw audio/transcripts are stored by
   Toone or another provider.
6. Confirm Apple sign-in production configuration (Services ID and native
   audience), identity-token processing, private-relay sender registration,
   and manual revocation disclosure after account deletion. Confirm web sign-in
   is enabled only when registered return URL and server config are ready.
7. Audit cookies and data retention on the deployed site and
   `analytics.truleaf.org`. The checked-in code gates script loading on an
   explicit allow choice; confirm the deployed version and whether the
   analytics host stores IP addresses or sets browser storage before making
   stronger claims.
8. Verify the signed iPhone version, account configuration, App Store privacy
   manifest, and Apple crash-data sharing. The same App Store Connect app
   record spans the iPhone and Mac editions.
9. Confirm exact website hosting (Vercel), infrastructure/CDN access logs,
   Discord and email provider retention, and the named recipients of contact,
   waitlist, and verification email data.
10. Confirm account deletion's production intake, the daily operations owner,
    completion notice, financial-retention basis, and category purge schedules.
    The current target decision document is an implementation plan rather than
    evidence of an enforced retention policy.

## Legal and publication decisions

- Identify the controller legal entity, postal address and contact, EU/UK
  representative if applicable, GDPR legal bases, data-subject rights and
  complaint route, retention periods, processors, transfers and minors policy.
  These are substantive [GDPR Article 13 disclosure fields](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679),
  so an indexable URL alone does not establish EU readiness. Do not invent a
  retention period or legal basis to fill the gap.
- Reconcile invitee email processing and any subscription/purchase history
  with the policy, Apple privacy manifests and the shared App Store Connect
  privacy labels. The app privacy answer matrix in the Toone audit is a draft.
- Confirm the deployed website uses the reviewed consent gate and document the
  legal basis for analytics and the website's other processing.
- Confirm the published policy's revision date and changes notification
  mechanism. Reconcile the final copy with matching app binaries, site
  deployment, and App Store Connect answers.
