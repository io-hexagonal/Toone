"use client";

import { EXPLORE_EDIT_CAPABILITY, type ListingKind } from "@/lib/explore/admin";
import { useCapability } from "@/lib/hooks/useCapability";

/**
 * "Edit listing" for platform admins. Renders nothing on the server and until
 * the stored session's capabilities include `explore.edit`, so the ISR HTML is
 * the same for every visitor. The admin API authorizes the edit itself.
 */
export default function EditListingLink({ kind, id, locale }: { kind: ListingKind; id: string; locale: string }) {
  const allowed = useCapability(EXPLORE_EDIT_CAPABILITY);
  if (!allowed) return null;
  const query = new URLSearchParams({ kind, id });
  return (
    <a className="explore-edit-link" href={`/${locale}/admin/explore/edit?${query}`} rel="nofollow">
      <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14">
        <path d="M11.2 2.3a1.5 1.5 0 0 1 2.1 0l.4.4a1.5 1.5 0 0 1 0 2.1L6 12.5l-3 .8.8-3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      Edit listing
    </a>
  );
}
