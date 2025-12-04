"use client";

import StratDisplay from "@/components/StratDisplay/StratDisplay";
import { StratViewModifier } from "@/components/StratDisplay/stratDisplay.functions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

export interface StratViewClientProps {
  id: string;
  editView: boolean;
  initialViewModifier: StratViewModifier;
}

export default function StratViewClient(props: StratViewClientProps) {
  const strat = useQuery(api.strats.get, { id: props.id as Id<"strats"> });
  const team = useQuery(api.team.get, {});

  if (!team) return null;

  if (!strat) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-2xl font-bold text-center">
          Strat not found (id: {props.id})
        </p>
      </div>
    );
  }

  return (
    <StratDisplay
      strat={strat}
      team={team}
      editView={props.editView}
      initialViewModifier={props.initialViewModifier}
    />
  );
}
