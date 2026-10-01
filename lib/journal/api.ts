// Enforce the server boundary; the API origin never enters a client module graph.
import "server-only";
export * from "./data";

import { cache } from "react";
import { getPost, getPreview } from "./data";
// Metadata and the page share one detail read per request, including failures.
export const getPostCached = cache(getPost);
// Same for previews: the read is `no-store`, so without this every preview
// request would hit the API twice (metadata, then the page).
export const getPreviewCached = cache(getPreview);
