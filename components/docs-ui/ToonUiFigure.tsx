import Figure from "./Figure";
import { SCENES } from "./registry";

/**
 * Renders a registered docs UI figure by id. Used by the ```toone-ui fence in
 * product guides (components/showcases/ProductShowcasePage.tsx) and by the
 * dev gallery. Unknown ids throw in development and render nothing in
 * production.
 */
export default function ToonUiFigure({ id }: { id: string }) {
  const scene = SCENES[id];
  if (!scene) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Unknown toone-ui figure "${id}". Register it in components/docs-ui/registry.ts. Known: ${Object.keys(SCENES).join(", ")}`,
      );
    }
    return null;
  }
  const { Component } = scene;
  return (
    <Figure caption={scene.caption} label={scene.label} radius={scene.radius} width={scene.width}>
      <Component />
    </Figure>
  );
}
