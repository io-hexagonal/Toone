# Explore prerelease announcement

Generated on 2026-09-22 using the built-in image generation tool and the production `explore-cover-v2` art direction from `WorkflowCoverArtDirection.swift` in the Toone desktop repository.

- Objective: discover reusable work and bring useful routines together in a workspace.
- Concept: shared possibility, expressed through confluence.
- Composition: broad organic color fields meet in a luminous area on the right; the dark left half leaves space for the modal copy and invitation code.
- Palette: midnight indigo, ocean teal, luminous cyan and a small warm-ivory glow.
- Style: blurred organic fields, luminous transitions, visible fine film grain, restrained depth, full bleed, no text or literal objects.

`explore-prerelease.image-prompt.txt` is the exact image-generation prompt. `explore-prerelease-original.png` preserves the generated 1672 × 941 image. The public WebP is an encoded web delivery copy, with no compositional changes.

Campaign content is prepared in `content/announcements/explore-prerelease.ts`. The displayed and prefilled invitation code is `EXPLORE`; the invitation service normalizes custom codes to uppercase. The user will create the code separately.

The announcement is not registered yet. Once the code exists, register this content with the exact invitation start and expiry timestamps, replacing First Believers in `content/announcements/index.ts`. Its new campaign ID ensures dismissals of First Believers do not hide the new announcement. The three-day limit describes the time to redeem the invitation, not three days of product access.

Mac visitors receive the invitation action. Other devices receive the launch-waitlist wording through the existing early-access form. That form currently submits to the general waitlist; it does not create a separate launch segment or send a new launch-specific email automatically.

## Carousel

Campaigns can add optional `panels` in `content/announcements/types.ts`. The original invitation stays first; each additional panel has its own image, copy, optional list of included routines and a destination link. Explore currently showcases **Product Launch Essentials**, using the cover encoded in the reviewed publication seed and its two actual member routines. `public/assets/announcements/product-launch-essentials.webp` is a delivery copy of that existing cover, not new artwork.

The modal cycles every 12 seconds and wraps. Playback sits beside the close button, with centered navigation dots at the bottom. Desktop visitors can use subtle arrows at the sides or drag horizontally; mobile visitors swipe, with no arrows. Hover and hidden tabs pause rotation; keyboard focus, dragging, swiping and manual navigation stop it until explicitly resumed. Reduced-motion visitors use manual navigation. Short viewports scroll the panel content while keeping carousel controls available. Vertical scrolling, interactive controls and invitation-code selection do not trigger slide changes.

With the local Next development server running, preview the unscheduled campaign at `/en?preview-announcement=mac&preview-campaign=explore-prerelease`, or change `mac` to `other`. Draft previews are disabled in production, omit an unconfirmed deadline and do not record campaign impressions or dismissals. The campaign registry still requires the real invitation dates before activation.
