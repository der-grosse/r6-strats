import ActiveStrat from "@/components/StratDisplay/ActiveStrat";
import { getTeam } from "@/src/auth/team";
import { getActive } from "@/src/strats/strats";
import { Metadata } from "next";

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

  return <ActiveStrat defaultOpen={active} team={team} />;
}
