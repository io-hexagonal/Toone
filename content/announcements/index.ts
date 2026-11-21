import type { Announcement } from "./types";
import { explorePrereleaseContent } from "./explore-prerelease";
import { launchWeek } from "./launch-week-2026-11";

export type * from "./types";

/**
 * Every announcement the site knows about. Each shows only inside its own
 * time window and on its own routes, so it retires with no redeploy. When
 * several are active on the same page, the first in this list wins.
 */
export const announcements: Announcement[] = [...launchWeek, {
  ...explorePrereleaseContent,
  startsAt: "2026-09-23T00:00:00+01:00",
  // The active EXPLORE shared invitation shows 29 Sep, 17:40 in Lisbon.
  // End at the start of that minute so the modal never offers an expired code.
  endsAt: "2026-09-29T17:40:00+01:00",
}];
