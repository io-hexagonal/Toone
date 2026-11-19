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
  /** Inline image style from the issued snippet, kept as given. */
  style?: { height: string; width: "auto" };
};

export const FEATURED_BADGES: readonly FeaturedBadge[] = [
  {
    name: "Product Hunt",
    href: "https://www.producthunt.com/products/toone?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-toone",
    img: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1106020&theme=light",
    alt: "Toone - Featured on Product Hunt",
    width: 250,
    height: 54,
    rel: "noopener noreferrer",
  },
  {
    name: "MacIgniter",
    href: "https://macigniter.com/apps/toone",
    img: "https://macigniter.com/badge/cc33b1c2-3157-463b-a10d-da740ba24906.svg",
    alt: "Listed on MacIgniter",
    width: 200,
    height: 54,
    rel: "noopener",
  },
  {
    name: "DodoLaunch",
    href: "https://dodolaunch.com/p/toone?ref=badge",
    img: "https://dodolaunch.com/badge/toone?theme=light",
    alt: "Toone on DodoLaunch",
    width: 200,
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
    href: "https://startupbase.io/products/toone?utm_source=startupbase&utm_medium=badge&utm_campaign=launch-badge-light",
    img: "https://statics.startupbase.io/site/badges/launched-on-sb.svg",
    alt: "Launched on StartupBase",
    // Source SVG is 300×80; 55px high → 206px wide.
    width: 206,
    height: 55,
    rel: "noopener noreferrer",
    style: { height: "55px", width: "auto" },
  },
];
