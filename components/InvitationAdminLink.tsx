"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { useCapability } from "@/lib/hooks/useCapability";

/**
 * The admin entry point for invitation and benefit codes. Discovery follows
 * the server capability; the API authorizes every operation.
 */
export default function InvitationAdminLink({ token, className }: { token?: string; className?: string }) {
  const t = useTranslations("account.links");
  const allowed = useCapability("invitation.manage", token);
  return allowed ? <Link href="/admin/codes" className={className}>{t("codesAdmin")}</Link> : null;
}
