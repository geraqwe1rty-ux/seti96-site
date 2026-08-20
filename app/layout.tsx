import type {Metadata} from "next"; import "./globals.css"; import "./media.css";
export const metadata:Metadata={title:{default:"Сети96 — промывка систем отопления",template:"%s | Сети96"},description:"Химическая промывка котлов, теплообменников, ИТП и систем отопления в Екатеринбурге. Бесплатный выезд специалиста.",icons:{icon:"/favicon.svg"},openGraph:{title:"Сети96",description:"Профессиональная промывка систем отопления",type:"website"}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
