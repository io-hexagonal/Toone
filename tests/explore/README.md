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
export EXPLORE_API_BASE_URL=http://127.0.0.1:18787/v1
export EXPLORE_REVALIDATE_SECRET=explore-local-test-secret
npm run build
npm run start -- --hostname 127.0.0.1 --port 13014
```

Run against that server (terminal 3):

```sh
EXPLORE_WEB_URL=http://127.0.0.1:13014 EXPLORE_MOCK_URL=http://127.0.0.1:18787 EXPLORE_EXPECT_CACHE=1 npm run test:explore:http
npm run content:check-routes
```

These tests inspect server-rendered HTML and real HTTP responses: two catalog cards, filtering/search, routine and bundle detail, member-only pages, safe Markdown, all eight locales, permanent id redirects, real 404s, sitemap membership (`/sitemap.xml` lists `/en/explore`; `/sitemap-explore.xml` lists the items), signed cache invalidation, oversized/forged webhook rejection, empty catalogs, missing covers/tags, long content, and API failure with `noindex` retry pages instead of fake emptiness. The production-only cache assertion proves a changed API response stays cached until the signed webhook and becomes visible afterwards. The HTTP suite mutates only the loopback fixture API, resets it in `finally`, and should run separately from manual inspection.

For faster development, replace build/start with `npm run dev -- --hostname 127.0.0.1 --port 13013`, set `EXPLORE_WEB_URL` to that address, and omit `EXPLORE_EXPECT_CACHE`. Development mode does not establish production caching behavior.

## Against the live server

The deployed server predates parts of the contract. `EXPLORE_API_BASE_URL=https://api.trytoone.com/v1` must still render: the one routine has no `slug` or `cover_url` (the id and inline cover fall back), `/v1/bundles`, `/v1/explore/feed` and `/v1/explore/tags` are 404 (the index hides the Bundles filter and shows no topics; `/sitemap-explore.xml` is an empty urlset), and `/en/explore/routines/wfl_fyziwhse2biovg4e` renders without redirecting.

## Manual UI edges

The mock binds only to `127.0.0.1`. Controls do not exist unless `EXPLORE_MOCK_ALLOW_CONTROL=1` is set. `POST /__test/mode` accepts a JSON object; every call replaces the current mode. Use `{}` to reset.

| Mode | Manual check |
|---|---|
| `{}` | Desktop and narrow layout, keyboard search, type/tag filters, bundle/member backlinks, locale chrome |
| `{"edge":true}` | Long unbroken text, long descriptions, missing covers/tags, inert HTML and unsafe Markdown links |
| `{"empty":true}` | Empty-state copy, stable filters, no orphan cards |
| `{"unavailable":true}` | Retry state and noindex; never report the item as missing |
| `{"delayMs":10000}` | Eight-second API timeout followed by retry state |
| `{"removed":true}` | The main routine returns 404 and leaves the Explore sitemap after invalidation |
| `{"title":"revision marker"}` | Cache persistence before webhook and fresh content after webhook |
| `{"profiles":true}` | Hub cards for listing-profile records: display title, card summary, "For:" line, results count |
| `{"malformedProfile":true}` | The profile routine falls back to the legacy layout (and logs why) |

## Listing profiles (contract §13)

`fixtures/listing-profile.json` and the §13 fields in the other fixtures are byte-identical copies of `docs/architecture/explore/fixtures` in the product repository. The mock always serves the fixture routine without its profile, so its page exercises the fallback layout. From the profile it synthesizes `/en/explore/routines/product-launch-prep-directories-qk4m2x7a` (profile layout), `/en/explore/routines/product-launch-prep-draft-w9t3v6pe` (`indexable: false`: `noindex, follow`, not in the sitemap) and `/en/explore/bundles/launch-kit-r5h8c2nd` (bundle with a profile). Check the builders' section with the keyboard: it is a native `<details>` that stays collapsed until opened.

Inspect the Open in Toone link with and without JavaScript. The server emits a usable `/{locale}/download?from=explore` anchor. With JavaScript it attempts the validated scheme URL. Returning from the app, switching tabs, navigating away, or clicking repeatedly must not cause a delayed download redirect.
