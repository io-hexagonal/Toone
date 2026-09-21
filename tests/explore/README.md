# Explore verification

`npm test` runs content validation, the behavior suite, and TypeScript. The behavior suite uses independent public fixture snapshots, so it also runs outside the Toone monorepo. The fixtures mirror `docs/architecture/explore/fixtures` in the product repository; update the snapshots when the frozen contract changes.

The tests exercise global mixed pagination past 100 items, fractional timestamp ordering, API response validation, safe cover paths and Markdown URLs, exact-body HMAC verification, English canonicals, translated `noindex`, scheme-id validation, and cancellation of the 1.5-second fallback on blur, page hide, unmount, and repeated clicks.

## Full HTTP path

Start the fixture API (terminal 1):

```sh
PORT=18787 EXPLORE_MOCK_ENRICH=1 EXPLORE_MOCK_ALLOW_CONTROL=1 npm run explore:mock
```

Build and start the real Next server (terminal 2; use the same environment for both commands):

```sh
export NEXT_DIST_DIR=.next-explore-build
export EXPLORE_API_BASE_URL=http://127.0.0.1:18787/v1
export EXPLORE_REVALIDATE_SECRET=explore-local-test-secret
npm run build
npm run start -- --hostname 127.0.0.1 --port 13014
```

Run against that server (terminal 3):

```sh
EXPLORE_WEB_URL=http://127.0.0.1:13014 EXPLORE_MOCK_URL=http://127.0.0.1:18787 EXPLORE_EXPECT_CACHE=1 npm run test:explore:http
NEXT_DIST_DIR=.next-explore-build npm run content:check-routes
```

These tests inspect server-rendered HTML and real HTTP responses: two catalog cards, filtering/search, routine and bundle detail, member-only pages, safe Markdown, all eight locales, exact 301 id redirects, real 404s, sitemap membership, signed cache invalidation, oversized/forged webhook rejection, empty catalogs, missing covers/tags, long content, and API failure with `noindex` retry pages instead of fake emptiness. The production-only cache assertion proves a changed API response stays cached until the signed webhook and becomes visible afterwards. The HTTP suite mutates only the loopback fixture API, resets it in `finally`, and should run separately from manual inspection.

For faster development, replace build/start with `npm run dev -- --hostname 127.0.0.1 --port 13013`, set `EXPLORE_WEB_URL` to that address, and omit `EXPLORE_EXPECT_CACHE`. Development mode does not establish production caching behavior.

## Manual UI edges

The mock binds only to `127.0.0.1`. Controls do not exist unless `EXPLORE_MOCK_ALLOW_CONTROL=1` is set. `POST /__test/mode` accepts a JSON object; every call replaces the current mode. Use `{}` to reset.

| Mode | Manual check |
|---|---|
| `{}` | Desktop and narrow layout, keyboard search, type/tag filters, bundle/member backlinks, locale chrome |
| `{"edge":true}` | Long unbroken text, long descriptions, missing covers/tags, inert HTML and unsafe Markdown links |
| `{"empty":true}` | Empty-state copy, stable filters, no orphan cards |
| `{"unavailable":true}` | Retry state and noindex; never report the item as missing |
| `{"delayMs":10000}` | Eight-second API timeout followed by retry state |
| `{"removed":true}` | The main routine returns 404 and leaves the sitemap after invalidation |
| `{"title":"revision marker"}` | Cache persistence before webhook and fresh content after webhook |

Inspect the Open in Toone link with and without JavaScript. The server emits a usable `/en/download?from=explore` anchor. With JavaScript it attempts the validated scheme URL. Returning from the app, switching tabs, navigating away, or clicking repeatedly must not cause a delayed download redirect.

## TDD evidence from implementation

The initial behavior suite failed on catalog-404 handling, accepting external cover URLs, and missing mixed pagination; those assertions passed after implementation. Later red/green cases caught malformed detail acceptance, lexicographic ordering of RFC3339 timestamps with different fractional precision, and an already-queued fallback callback navigating after cancellation. Handoff cancellation and HMAC validation are covered by deterministic tests. Full HTML/HTTP checks and the manual browser review complement those unit tests; no rich-result eligibility is claimed for `HowTo` JSON-LD.
