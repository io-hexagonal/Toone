import { permanentRedirect } from "next/navigation";

export default function LegacyPersonalShowcasesRoute() {
  permanentRedirect("/en/how-to");
}
