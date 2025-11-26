import { StratEditor } from "@/components/StratEditor/StratEditor";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getJWT } from "@/server/jwt";
import { fetchQuery } from "convex/nextjs";
import { CircleX } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const strat = await fetchQuery(
    api.strats.get,
    { id: id as Id<"strats"> },
    { token: await getJWT() }
  );

  return {
    title: `${strat?.name} | ${strat?.map} - ${strat?.site}`,
  };
}

export default async function StratEditorPage({
  params: paramsRaw,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const id = (await paramsRaw).id;
  const strat = id
    ? await fetchQuery(
        api.strats.get,
        { id: id as Id<"strats"> },
        { token: await getJWT() }
      )
    : null;
  const team = await fetchQuery(api.team.get, {}, { token: await getJWT() });

  if (!strat) {
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center">
        <CircleX className="text-destructive" size={64} />
        <h2 className="text-destructive">Strat not found</h2>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <StratEditor team={team} strat={strat} />
    </div>
  );
}
