import { fetchQuery } from "convex/nextjs";
import SidebarLayout from "./SidebarLayout";
import { api } from "@/convex/_generated/api";
import { getJWT } from "@/server/jwt";

export default async function SidebarLayoutPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const team = await fetchQuery(api.team.get, undefined, {
    token: await getJWT(),
  });
  return <SidebarLayout team={team}>{children}</SidebarLayout>;
}
