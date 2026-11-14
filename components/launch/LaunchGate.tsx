import type { ReactNode } from "react";
import { isLaunched } from "@/lib/launch";
import { LaunchSwitch } from "./LaunchState";

/**
 * Server-component form of <LaunchSwitch>. Rendered after the launch it emits
 * only `after`, so the pre-launch variant is not even in the page's RSC
 * payload; rendered before it, it hands both to the client switch, which
 * keeps statically built pages correct once the launch has passed.
 * Client components use <LaunchSwitch> directly.
 */
export function LaunchGate({ before, after }: { before: ReactNode; after: ReactNode }) {
  return isLaunched() ? <>{after}</> : <LaunchSwitch before={before} after={after} />;
}
