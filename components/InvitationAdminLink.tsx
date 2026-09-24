"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { useCapability } from "@/lib/hooks/useCapability";

/** Discovery follows the server capability; the API authorizes every operation. */
export default function InvitationAdminLink({ token, className }: { token?: string; className?: string }) {
  const t = useTranslations("nav");
  const allowed = useCapability("invitation.manage", token);
  return allowed ? <Link href="/admin/invitations" className={className}>{t("invitations")}</Link> : null;
}
