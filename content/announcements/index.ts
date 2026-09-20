import type { Announcement } from "./types";
import { firstBelievers } from "./first-believers";

export type * from "./types";

/**
 * Every announcement the site knows about. Each shows only inside its own
 * time window and on its own routes, so it retires with no redeploy. When
 * several are active on the same page, the first in this list wins.
 */
export const announcements: Announcement[] = [firstBelievers];
