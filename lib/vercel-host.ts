/**
 * TECH-010 / TECH-013: trytoone.com is the only indexable host. Vercel also
 * serves the production build on its own hosts, which duplicate every page:
 * the project alias `toone-landing.vercel.app`, per-deployment URLs
 * (`toone-landing-<hash>-<team>.vercel.app`) and branch aliases
 * (`toone-landing-git-<branch>-<team>.vercel.app`). Those hosts get an
 * `X-Robots-Tag: noindex` header (next.config.ts), matched by host name only,
 * so no trytoone.com response is touched.
 *
 * Next.js anchors `has` host values as `^…$`, so this pattern matches whole
 * host names only.
 */
export const VERCEL_APP_HOST_PATTERN = "toone-landing(?:-[a-z0-9-]+)?\\.vercel\\.app";
