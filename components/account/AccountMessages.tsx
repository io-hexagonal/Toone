import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

type Messages = Record<string, unknown>;

/**
 * The slice of `account.*` every page needs on the client: the signed-in
 * links (header, sign-in panel) and the invite page's benefit line. The root
 * layout ships only this; the account pages load the whole namespace below.
 */
export function accountShellMessages(account: unknown): Messages {
  const all = (account ?? {}) as { links?: unknown; invite?: unknown; redeem?: Record<string, unknown> };
  const redeem = all.redeem ?? {};
  return {
    links: all.links,
    invite: all.invite,
    redeem: Object.fromEntries(Object.entries(redeem).filter(([key]) => key.startsWith("benefit"))),
  };
}

/** Client messages for the account, redeem and contract pages: sign-in and the whole `account` namespace. */
export default async function AccountMessages({ children }: { children: ReactNode }) {
  const messages = (await getMessages()) as Messages;
  return (
    <NextIntlClientProvider messages={{ auth: messages.auth, account: messages.account } as never}>
      {children}
    </NextIntlClientProvider>
  );
}
