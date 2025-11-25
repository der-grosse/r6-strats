"use client";
import { useEffect } from "react";
import StratDisplay from "./StratDisplay";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Strat } from "@/lib/types/strat.types";
import { Skeleton } from "../ui/skeleton";

export interface ActiveStratProps {
  defaultOpen?: Strat | null;
  initialViewModifier?: "none" | "hideForeign" | "grayscaleForeign";
}

export default function ActiveStrat(props: ActiveStratProps) {
  const team = useQuery(api.team.get);
  const activeStrat = useQuery(api.activeStrat.get);

  useEffect(() => {
    if (!activeStrat) {
      document.title = "Current strat";
    } else {
      document.title = `Current strat | ${activeStrat.name} | ${activeStrat.map} - ${activeStrat.site}`;
    }
  }, [activeStrat]);

  if (!team) {
    return <Skeleton className="w-full h-96 rounded-md" />;
  }

  return (
    <StratDisplay
      strat={activeStrat ?? props.defaultOpen ?? null}
      team={team}
      initialViewModifier={props.initialViewModifier}
    />
  );
}
