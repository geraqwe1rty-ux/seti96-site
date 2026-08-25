import type { Metadata } from "next";
import "./globals.css";

declare global {
  interface Window { ym?: (...args: unknown[]) => void }
}

export const metadata: Metadata = {
  metadataBase: new URL("https://electro.seti96.ru"),
  title: "Сети 96 — электромонтаж и вызов электрика в Екатеринбурге",
  description: "Диагностика, ремонт электрики и электромонтажные работы в Екатеринбурге и Свердловской области.",
  openGraph: {
    title: "СЕТИ 96 — Электрика",
    description: "Электрик для дома и бизнеса в Екатеринбурге",
    images: ["/og.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "СЕТИ 96 — Электрика",
    description: "Электрик для дома и бизнеса в Екатеринбурге",
    images: ["/og.webp"],
  },
  icons: {icon:"/seti96-mark-small.png",shortcut:"/seti96-mark-small.png"},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script dangerouslySetInnerHTML={{__html:`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=111934175','ym');ym(111934175,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}} />
      </head>
      <body className="antialiased">{children}<noscript><div><img src="https://mc.yandex.ru/watch/111934175" style={{position:"absolute",left:"-9999px"}} alt="" /></div></noscript></body>
    </html>
  );
}
