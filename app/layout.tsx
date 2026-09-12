/* eslint-disable @next/next/no-img-element */
import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://seti96.ru"),
  title: {
    default: "Промывка отопления и теплообменников в Екатеринбурге | Сети96",
    template: "%s | Сети96",
  },
  description:
    "Промывка систем отопления, котлов, теплообменников и ИТП в Екатеринбурге и до 50 км. Осмотр и расчёт стоимости до начала работ.",
  icons: {icon: "/favicon.svg"},
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Сети96",
    title: "Сети96 — промывка отопления и теплообменников",
    description: "Диагностика, подбор технологии и расчёт стоимости до начала работ.",
    url: "/",
  },
};

const metrika =
  "(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=111900032','ym');ym(111900032,'init',{ssr:true,webvisor:true,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});";

const organization = {
  "@context": "https://schema.org",
  "@type": ["ProfessionalService", "Organization"],
  name: "Сети96",
  legalName: "ООО «Танзанит»",
  url: "https://seti96.ru",
  telephone: "+79931060423",
  email: "seti-96@yandex.ru",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Екатеринбург",
    streetAddress: "ул. Вишнёвая, д. 69Б, офис 9",
    addressCountry: "RU",
  },
  areaServed: "Екатеринбург и населённые пункты в радиусе до 50 км",
  serviceType: [
    "Промывка систем отопления",
    "Промывка котлов и теплообменников",
    "Промывка ИТП",
  ],
};

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
      <head>
        <meta name="codex-preview" content="development" />
        <script dangerouslySetInnerHTML={{__html: metrika}} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(organization).replace(/</g, "\\u003c")}}
        />
      </head>
      <body>
        {children}
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/111900032"
              style={{position: "absolute", left: "-9999px"}}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
