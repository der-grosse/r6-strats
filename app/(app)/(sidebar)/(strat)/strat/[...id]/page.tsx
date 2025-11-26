import { getStratViewModifierFromCookies } from "@/components/StratDisplay/stratDisplay.functions";
import { cookies } from "next/headers";
import { Metadata } from "next";
import StratDisplay from "@/components/StratDisplay/StratDisplay";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getJWT } from "@/server/jwt";

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
    description: `${strat?.map} | ${strat?.site}`,
  };
}

export default async function Page({
  params: paramsRaw,
}: Readonly<{
  params: Promise<{ id: string[] }>;
}>) {
  const params = (await paramsRaw).id;
  const id = params[0];
  const strat = await fetchQuery(
    api.strats.get,
    { id: id as Id<"strats"> },
    { token: await getJWT() }
  );
  const team = await fetchQuery(api.team.get, {}, { token: await getJWT() });
  const cookieStore = await cookies();
  const initialViewModifier = getStratViewModifierFromCookies(cookieStore);

  const editView = params[1] === "edit";

  if (!strat) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-2xl font-bold text-center">
          Strat not found (id: {id})
          <br />
          <span className="text-sm font-mono">{JSON.stringify(params)}</span>
        </p>
      </div>
    );
  }

  return (
    <StratDisplay
      strat={strat}
      editView={editView}
      team={team}
      initialViewModifier={initialViewModifier}
    />
  );
}
