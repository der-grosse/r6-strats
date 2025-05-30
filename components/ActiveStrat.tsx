"use client";
import { useEffect, useState } from "react";
import StratDisplay from "./StratDisplay";
import { useSocket } from "./context/SocketContext";
import useSocketEvent from "./hooks/useSocketEvent";

export interface ActiveStratProps {
  defaultOpen?: Strat | null;
  team: Team;
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

  return <StratDisplay strat={strat} team={props.team} />;
}
