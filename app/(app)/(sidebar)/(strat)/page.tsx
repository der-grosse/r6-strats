import ActiveStrat from "@/components/StratDisplay/ActiveStrat";
import { getStratViewModifierFromCookies } from "@/components/StratDisplay/stratDisplay.functions";
import { api } from "@/convex/_generated/api";
import { getJWT } from "@/server/jwt";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const active = await fetchQuery(
    api.activeStrat.get,
    {},
    {
      token: await getJWT(),
    }
  );

  return {
    title: `Current strat${
      active ? ` | ${active?.name} | ${active?.map} - ${active?.site}` : ""
    }`,
    description: "View the currently active strat",
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const initialViewModifier = getStratViewModifierFromCookies(cookieStore);

  return <ActiveStrat initialViewModifier={initialViewModifier} />;
}
