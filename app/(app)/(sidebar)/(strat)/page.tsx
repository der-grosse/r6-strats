import ActiveStrat from "@/components/StratDisplay/ActiveStrat";
import { getStratViewModifierFromCookies } from "@/components/StratDisplay/stratDisplay.functions";
import { getTeam } from "@/lib/auth/team";
import { getActive } from "@/lib/strats/strats";
import { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const active = await getActive();

  return {
    title: `Current strat${
      active ? ` | ${active?.name} | ${active?.map} - ${active?.site}` : ""
    }`,
    description: "View the currently active strat",
  };
}

export default async function Home() {
  const active = await getActive();
  const team = await getTeam();
  const cookieStore = await cookies();
  const initialViewModifier = getStratViewModifierFromCookies(cookieStore);

  return (
    <ActiveStrat
      defaultOpen={active}
      team={team}
      initialViewModifier={initialViewModifier}
    />
  );
}
