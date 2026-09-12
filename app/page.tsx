import type {Metadata} from "next";
import SiteShell from "./site-shell";

export const metadata: Metadata = {
  title: "Промывка отопления и теплообменников в Екатеринбурге",
  description:
    "Промывка отопления, котлов, теплообменников и ИТП в Екатеринбурге и до 50 км. Сначала диагностика, затем согласованный расчёт.",
  alternates: {canonical: "/"},
};

export default function Home() {
  return <SiteShell page="home" />;
}
