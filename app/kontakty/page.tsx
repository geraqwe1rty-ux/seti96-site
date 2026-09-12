import type {Metadata} from "next";
import SiteShell from "../site-shell";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Телефон и адреса Сети96. Выезд на промывку отопления и теплообменников по Екатеринбургу и до 50 км от города.",
  alternates: {canonical: "/kontakty"},
};

export default function Page() {
  return <SiteShell page="contacts" />;
}
