import { permanentRedirect } from "next/navigation";

/** /newcomers has no page of its own yet: send it to the ideas. */
export default function Newcomers() {
  permanentRedirect("/en/newcomers/ideas");
}
