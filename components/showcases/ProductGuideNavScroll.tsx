"use client";

import { useEffect } from "react";

type Props = {
  activeSlug: string;
};

/** Keeps the current guide entry visible inside the independently scrolling desktop nav. */
export default function ProductGuideNavScroll({ activeSlug }: Props) {
  useEffect(() => {
    const navigation = document.querySelector<HTMLElement>(
      '[data-product-guide-nav="desktop"]',
    );
    const active = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!navigation || !active) return;

    const target = Math.max(0, active.offsetTop - navigation.clientHeight * 0.32);
    navigation.scrollTo({ top: target, behavior: "instant" });
  }, [activeSlug]);

  return null;
}
