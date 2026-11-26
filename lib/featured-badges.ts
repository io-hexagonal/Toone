/**
 * Directory badges shown in the "Featured on" strip on the landing pages.
 *
 * Each entry copies the snippet the directory issued: same href (query
 * strings and listing ids included), same image URL, same rel. Directories
 * check these links by loading the page, so never rewrite them, add
 * `nofollow`, or proxy the image through next/image.
 *
 * Only list a directory where Toone is actually submitted or listed.
 * `width` is set even when the issued snippet only gave a height, so the
 * browser reserves the space before the image loads (no layout shift);
 * it is the image's own ratio at the issued height.
 */
export type FeaturedBadge = {
  name: string;
  href: string;
  img: string;
  alt: string;
  width: number;
  height: number;
  /** The rel the directory issued; omitted when its snippet had none. */
  rel?: string;
  /** The link title the directory issued; omitted when its snippet had none. */
  title?: string;
  /**
   * The image is a bordered rounded rectangle. The strip trims its outer
   * 2.5px so the directory's own border (each a different weight and colour)
   * is not shown; the image itself is untouched.
   */
  framed?: boolean;
  /** Inline image style from the issued snippet, kept as given. */
  style?: { height: string; width: "auto" };
};

export const FEATURED_BADGES: readonly FeaturedBadge[] = [
  {
    name: "Product Hunt",
    framed: true,
    // The 18 Nov 2026 launch (post 1259097), with its day rank.
    href: "https://www.producthunt.com/products/toone?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_campaign=badge-toone-4",
    img: "https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=1259097&theme=light&period=daily",
    alt: "Toone - #3 Product of the Day on Product Hunt",
    width: 250,
    height: 54,
    rel: "noopener noreferrer",
  },
  {
    name: "MacIgniter",
    framed: true,
    // The issued listing link; published and answering 200 (checked 23 Nov 2026).
    href: "https://macigniter.com/apps/toone",
    img: "https://macigniter.com/badge/cc33b1c2-3157-463b-a10d-da740ba24906.svg",
    alt: "Listed on MacIgniter",
    width: 200,
    height: 54,
    rel: "noopener",
  },
  {
    name: "DodoLaunch",
    framed: true,
    href: "https://dodolaunch.com/p/toone?ref=badge",
    img: "https://dodolaunch.com/badge/toone?theme=light",
    alt: "Toone on DodoLaunch",
    // Source SVG is 250×54; shown at its own size so it matches the other rectangles' height.
    width: 250,
    height: 54,
  },
  {
    name: "MacBase",
    href: "https://macbase.app/apps/toone?ref=badge",
    img: "https://macbase.app/badge/featured-on-macbase.svg",
    alt: "Toone is featured on MacBase",
    // Source SVG is 313×100; 72px high → 225px wide.
    width: 225,
    height: 72,
    rel: "noopener",
    style: { height: "72px", width: "auto" },
  },
  {
    name: "StartupBase",
    framed: true,
    href: "https://startupbase.io/products/toone?utm_source=startupbase&utm_medium=badge&utm_campaign=launch-badge-light",
    img: "https://statics.startupbase.io/site/badges/launched-on-sb.svg",
    alt: "Launched on StartupBase",
    // Source SVG is 300×80; 54px high (the height of every rectangular badge) → 203px wide.
    width: 203,
    height: 54,
    rel: "noopener noreferrer",
    style: { height: "54px", width: "auto" },
  },
  {
    name: "Startup Fame",
    framed: true,
    // Issued snippet: 224×36, no rel. Source WebP is 655×105; shown 54px high
    // (the height of every rectangular badge) → 337px wide.
    href: "https://startupfa.me/s/toone?utm_source=trytoone.com",
    img: "https://startupfa.me/badges/featured-badge-small.webp",
    alt: "Toone - Featured on Startup Fame",
    width: 337,
    height: 54,
    style: { height: "54px", width: "auto" },
  },
  {
    name: "Mac App Index",
    framed: true,
    // Issued snippet: 224×56, with a link title and no rel. Shown 54px high
    // (the height of every rectangular badge) → 216px wide.
    href: "https://macappindex.com/apps/toone?ref=badge",
    img: "https://macappindex.com/apps/toone/badge.svg?theme=light&height=56",
    alt: "Toone on Mac App Index",
    title: "Toone on Mac App Index",
    width: 216,
    height: 54,
    style: { height: "54px", width: "auto" },
  },
  // To add a directory, append one entry here; the strip sizes its loop from this list.
];
