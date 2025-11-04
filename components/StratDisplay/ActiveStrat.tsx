"use client";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import useSocketEvent from "../hooks/useSocketEvent";
import StratDisplay from "./StratDisplay";

export interface ActiveStratProps {
  defaultOpen?: Strat | null;
  team: Team;
  initialViewModifier?: "none" | "hideForeign" | "grayscaleForeign";
}

export default function ActiveStrat(props: ActiveStratProps) {
  const socket = useSocket();
  useEffect(() => {
    socket.emit("active-strat:subscribe");
    return () => {
      socket.emit("active-strat:unsubscribe");
    };
  }, []);
  const [strat, setStrat] = useState<Strat | null>(props.defaultOpen ?? null);

  useSocketEvent("active-strat:changed", (strat) => {
    setStrat(strat);
    if (!strat) document.title = "Current strat";
    else
      document.title = `Current strat | ${strat.name} | ${strat.map} - ${strat.site}`;
  });

  return (
    <StratDisplay
      strat={strat}
      team={props.team}
      initialViewModifier={props.initialViewModifier}
    />
  );
}
