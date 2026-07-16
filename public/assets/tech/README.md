# Substrate marks ("Built on" strip)

Vendored for `components/TechStrip.tsx`. Sources, so nobody has to re-derive them:

| File | Source | Form |
|---|---|---|
| `anthropic.svg` | `@lobehub/icons-static-svg` | mono, `currentColor`, 24×24 |
| `openai.svg` | `@lobehub/icons-static-svg` | mono, `currentColor`, 24×24 |
| `claude.svg` | `@lobehub/icons-static-svg` | mono, `currentColor`, 24×24 |
| `google.svg` | `@lobehub/icons-static-svg` | mono, `currentColor`, 24×24 |
| `context7.png` | `https://context7.com/favicon.ico` (actually a PNG) | **colour raster, 74×75** |

## Gotchas

- **The SVGs here are reference copies.** `TechStrip.tsx` inlines their path
  data instead of loading these files, because they are `fill="currentColor"`
  and an `<img>` is a separate document that never inherits our colour. If you
  update an SVG here, update the path constant in the component too.
- **simple-icons does not have OpenAI or Context7** (both 404 as of 2026-07-15),
  which is why these come from LobeHub's AI/LLM set instead.
- **Context7 has no vector mark.** Their site serves the Next.js SPA shell for
  `/logo.svg` (a false 200), and `upstash/context7` on GitHub ships no logo
  asset. The favicon is the only real mark available, so it is raster and
  greyscaled in CSS to sit with the mono marks. Swap it if they ever publish
  an SVG.
- **"OpenAI for Science" and "Claude Science" have no marks of their own** —
  they are programmes/products under the parent brands, so they reuse the OpenAI
  and Claude marks and lean on the text label to disambiguate.
- **Naming, verified 2026-07-15:** it is "Claude Science" (claude.com/science,
  announced 2026-06-30), **not** "Claude for Science", which does not exist.
  Anthropic separately has "Claude for Life Sciences" (Oct 2025). "OpenAI for
  Science" is correct (openai.com/research/).

## Legal

These are third-party trademarks used nominatively to state what Toone runs on.
Rendering them monochrome is deliberate: it is the lighter-touch treatment and
avoids dressing the page in anyone's official brand colours. No endorsement by
any of these companies is claimed or implied. If any owner objects, drop the
mark and keep the wordmark.
