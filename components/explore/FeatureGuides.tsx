import { FEATURE_GUIDES, featureGuides } from "@/lib/explore/requirements";
import type { BundlePublicDetail, RoutinePublicDetail } from "@/lib/explore/types";
import type { ExploreCopy } from "./ExploreView";

/** Details-card row linking the how-to guides for the features a record
    declares. Shared by every routine and bundle page variant. */
export function FeatureGuides({
  detail,
  ui,
}: {
  detail: RoutinePublicDetail | BundlePublicDetail;
  ui: ExploreCopy;
}) {
  const keys = featureGuides(detail);
  if (!keys.length) return null;
  return (
    <div className="explore-feature-guides">
      <dt>{ui.featureGuides}</dt>
      <dd>
        <ul>
          {keys.map((key) => (
            <li key={key}>
              <a href={FEATURE_GUIDES[key]}>{ui[key]}</a>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
