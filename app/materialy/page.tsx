import type {Metadata} from "next";
import SiteShell from "../site-shell";

export const metadata: Metadata = {
  title: "Материалы о промывке отопления",
  description:
    "Практические материалы о диагностике, промывке систем отопления, котлов, теплообменников, ИТП и подготовке к сезону.",
  alternates: {canonical: "/materialy"},
};

export default function Page() {
  return <SiteShell page="blog" />;
}
