import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/journal/api";
import { formatPostDate, hubForType, postEyebrow } from "@/lib/journal/presentation";

/**
 * Generated 1200×630 share image for a post without a cover (contract §10),
 * at `/journal/og/{slug}.png` (dotted, so outside the locale proxy). Cached
 * like the post: rendered on first request, data cache tagged
 * `journal:{slug}`, so a new heading reaches the card when the webhook fires.
 */
export const revalidate = 600;
export const dynamicParams = true;
export function generateStaticParams(): { file: string }[] {
  return [];
}

// public/assets/brand/toone-mark.svg, inlined so the function bundle needs no file read.
const MARK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJub25lIj4KPGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJsYW50IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY3g9IjUwIiBjeT0iNTAiIHI9IjE1Ij48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGRkZGRkYiLz48c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iI0YwRjBGMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzlBOUE5QSIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPgo8cGF0aCBkPSJNNzAuOTIyIDI0LjYxNzMgTDgyLjQ0MzEgNDQuNTcyNCBBMy42IDMuNiAwIDAgMSA3OS4zMjU0IDQ5Ljk3MjQgTDcxLjQ4MjMgNDkuOTcyNCBBMy42IDMuNiAwIDAgMSA2OC4zNjQ2IDQ4LjE3MjQgTDYwLjc2NTEgMzUuMDA5NiBBMy42IDMuNiAwIDAgMSA2MC43NjUxIDMxLjQwOTYgTDY0LjY4NjcgMjQuNjE3MyBBMy42IDMuNiAwIDAgMSA3MC45MjIgMjQuNjE3MyBaIiBmaWxsPSIjNEI0QjRCIi8+PHBhdGggZD0iTTYxLjUyMTEgODAuODEwNCBMMzguNDc4OSA4MC44MTA0IEEzLjYgMy42IDAgMCAxIDM1LjM2MTIgNzUuNDEwNCBMMzkuMjgyOCA2OC42MTgxIEEzLjYgMy42IDAgMCAxIDQyLjQwMDUgNjYuODE4MSBMNTcuNTk5NSA2Ni44MTgxIEEzLjYgMy42IDAgMCAxIDYwLjcxNzIgNjguNjE4MSBMNjQuNjM4OCA3NS40MTA0IEEzLjYgMy42IDAgMCAxIDYxLjUyMTEgODAuODEwNCBaIiBmaWxsPSIjNEI0QjRCIi8+PHBhdGggZD0iTTE3LjU1NjkgNDQuNTcyNCBMMjkuMDc4IDI0LjYxNzMgQTMuNiAzLjYgMCAwIDEgMzUuMzEzMyAyNC42MTczIEwzOS4yMzQ5IDMxLjQwOTYgQTMuNiAzLjYgMCAwIDEgMzkuMjM0OSAzNS4wMDk2IEwzMS42MzU0IDQ4LjE3MjQgQTMuNiAzLjYgMCAwIDEgMjguNTE3NyA0OS45NzI0IEwyMC42NzQ2IDQ5Ljk3MjQgQTMuNiAzLjYgMCAwIDEgMTcuNTU2OSA0NC41NzI0IFoiIGZpbGw9IiM0QjRCNEIiLz48cGF0aCBkPSJNMzkuMDk5MSAxMy4yNTUxIEw2MC45MDA5IDEzLjI1NTEgQTMuNiAzLjYgMCAwIDEgNjQuMDE4NiAxOC42NTUxIEw2MC4wOTcgMjUuNDQ3NCBBMy42IDMuNiAwIDAgMSA1Ni45NzkzIDI3LjI0NzQgTDQzLjAyMDcgMjcuMjQ3NCBBMy42IDMuNiAwIDAgMSAzOS45MDMgMjUuNDQ3NCBMMzUuOTgxNCAxOC42NTUxIEEzLjYgMy42IDAgMCAxIDM5LjA5OTEgMTMuMjU1MSBaIiBmaWxsPSIjQzdDN0M3Ii8+PHBhdGggZD0iTTg3LjI3MjQgNTguOTMyIEw3Ni4zNzE2IDc3LjgxMjkgQTMuNiAzLjYgMCAwIDEgNzAuMTM2MiA3Ny44MTI5IEw2Ni4yMTQ2IDcxLjAyMDYgQTMuNiAzLjYgMCAwIDEgNjYuMjE0NiA2Ny40MjA2IEw3My4xOTQgNTUuMzMyIEEzLjYgMy42IDAgMCAxIDc2LjMxMTcgNTMuNTMyIEw4NC4xNTQ4IDUzLjUzMiBBMy42IDMuNiAwIDAgMSA4Ny4yNzI0IDU4LjkzMiBaIiBmaWxsPSIjQzdDN0M3Ii8+PHBhdGggZD0iTTIzLjYyODQgNzcuODEyOSBMMTIuNzI3NiA1OC45MzIgQTMuNiAzLjYgMCAwIDEgMTUuODQ1MiA1My41MzIgTDIzLjY4ODMgNTMuNTMyIEEzLjYgMy42IDAgMCAxIDI2LjgwNiA1NS4zMzIgTDMzLjc4NTQgNjcuNDIwNiBBMy42IDMuNiAwIDAgMSAzMy43ODU0IDcxLjAyMDYgTDI5Ljg2MzggNzcuODEyOSBBMy42IDMuNiAwIDAgMSAyMy42Mjg0IDc3LjgxMjkgWiIgZmlsbD0iI0M3QzdDNyIvPjxwYXRoIGQ9Ik00My41IDM2Ljc0MTcgTDU2LjUgMzYuNzQxNyBBMiAyIDAgMCAxIDU4LjIzMjEgMzcuNzQxNyBMNjQuNzMyMSA0OSBBMiAyIDAgMCAxIDY0LjczMjEgNTEgTDU4LjIzMjEgNjIuMjU4MyBBMiAyIDAgMCAxIDU2LjUgNjMuMjU4MyBMNDMuNSA2My4yNTgzIEEyIDIgMCAwIDEgNDEuNzY3OSA2Mi4yNTgzIEwzNS4yNjc5IDUxIEEyIDIgMCAwIDEgMzUuMjY3OSA0OSBMNDEuNzY3OSAzNy43NDE3IEEyIDIgMCAwIDEgNDMuNSAzNi43NDE3IFoiIGZpbGw9InVybCgjbGFudCkiLz4KPC9zdmc+Cg==";

const ACCENT = { release: "#aebaf4", spotlight: "#8fdcb8", launch: "#f2b47f" } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.png$/.exec(file)?.[1];
  if (!slug) notFound();
  const lookup = await getPost(slug);
  if (lookup.kind !== "post") notFound();
  const { post } = lookup;
  const accent = ACCENT[post.type];
  const headingSize = post.heading.length > 80 ? 54 : post.heading.length > 50 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#141413",
          backgroundImage: `radial-gradient(circle at 85% 110%, ${accent}33 0%, transparent 55%), radial-gradient(circle at 10% -10%, #2c2c2a 0%, transparent 60%)`,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={MARK} width={48} height={48} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>toone</div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>Journal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              color: accent,
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {postEyebrow(post)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: headingSize,
              lineHeight: 1.04,
              letterSpacing: "-0.045em",
              fontWeight: 700,
              maxWidth: 1000,
            }}
          >
            {post.heading}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "flex" }}>
            {hubForType(post.type).label} · {formatPostDate(post.published_at)}
          </div>
          <div style={{ display: "flex" }}>trytoone.com/journal</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=600, stale-while-revalidate=86400" },
    },
  );
}
