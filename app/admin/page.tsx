import AdminClient from "./admin-client";
export const dynamic="force-dynamic";
export default async function Admin(){return <AdminClient user="Администратор" signout="/"/>}
