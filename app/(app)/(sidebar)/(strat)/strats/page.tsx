import { fetchQuery } from "convex/nextjs";
import AllStratsClient from "./AllStrats";
import { api } from "@/convex/_generated/api";
import { getJWT } from "@/server/jwt";

export default async function AllStratsPage() {
  const team = await fetchQuery(api.team.get, {}, { token: await getJWT() });

  return <AllStratsClient team={team} />;
}
