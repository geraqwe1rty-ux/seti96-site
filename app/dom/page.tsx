import type {Metadata} from "next";
import SiteShell from "../site-shell";

export const metadata: Metadata = {
  title: "Промывка отопления частного дома",
  description:
    "Промывка котлов, радиаторов, теплообменников и тёплого пола в частном доме в Екатеринбурге и до 50 км. Осмотр и расчёт до работ.",
  alternates: {canonical: "/dom"},
};

export default function Page() {
  return <SiteShell page="dom" />;
}
