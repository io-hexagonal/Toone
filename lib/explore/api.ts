// Enforce the server boundary; credentials and the API origin never enter a client module graph.
import "server-only";
export * from "./data";

import { cache } from "react";
import { loadCatalog, getExploreTags } from "./data";
import type { CatalogQuery } from "./presentation";
// Metadata and the page share one catalog read per request, including failures.
export const getCatalog = cache(async (serializedQuery: string) => {
  const [catalog, tags] = await Promise.all([
    loadCatalog(JSON.parse(serializedQuery) as CatalogQuery),
    getExploreTags(),
  ]);
  return { ...catalog, tags };
});
