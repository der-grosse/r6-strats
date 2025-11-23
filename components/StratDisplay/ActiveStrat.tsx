"use client";
import { useEffect, useState } from "react";
// import { useSocket } from "../context/SocketContext";
// import useSocketEvent from "../hooks/useSocketEvent";
import StratDisplay from "./StratDisplay";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getStrat } from "@/src/strats/strats";

export interface ActiveStratProps {
  defaultOpen?: Strat | null;
  team: Team;
  initialViewModifier?: "none" | "hideForeign" | "grayscaleForeign";
}

export default function ActiveStrat(props: ActiveStratProps) {
  const activeStratID = useQuery(api.activeStrat.get);

  useEffect(() => {
    if (!activeStratID) {
      document.title = "Current strat";
      setStrat(null);
      return;
    }
    let mounted = true;
    (async () => {
      const strat = await getStrat(activeStratID);
      if (!mounted) return;
      setStrat(strat);
      if (!strat) {
        document.title = "Current strat";
      } else {
        document.title = `Current strat | ${strat.name} | ${strat.map} - ${strat.site}`;
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeStratID]);

  // const socket = useSocket();
  // useEffect(() => {
  //   socket.emit("active-strat:subscribe");
  //   return () => {
  //     socket.emit("active-strat:unsubscribe");
  //   };
  // }, []);
  const [strat, setStrat] = useState<Strat | null>(props.defaultOpen ?? null);

  // useSocketEvent("active-strat:changed", (strat) => {
  //   setStrat(strat);
  //   if (!strat) document.title = "Current strat";
  //   else
  //     document.title = `Current strat | ${strat.name} | ${strat.map} - ${strat.site}`;
  // });

  return (
    <StratDisplay
      strat={strat}
      team={props.team}
      initialViewModifier={props.initialViewModifier}
    />
  );
}
