import type {Metadata} from "next";
import SiteShell from "../site-shell";

export const metadata: Metadata = {
  title: "Промывка ИТП и теплообменников для организаций",
  description:
    "Промывка ИТП, теплообменников и систем отопления для УК, ТСЖ и организаций Екатеринбурга. Договор, согласованный регламент, акты.",
  alternates: {canonical: "/organizaciyam"},
};

export default function Page() {
  return <SiteShell page="org" />;
}
