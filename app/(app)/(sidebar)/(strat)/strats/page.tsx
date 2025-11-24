import { getTeam } from "@/lib/auth/team";
import AllStratsClient from "./AllStrats";

export default async function AllStratsPage() {
  const team = await getTeam();

  return <AllStratsClient team={team} />;
}
