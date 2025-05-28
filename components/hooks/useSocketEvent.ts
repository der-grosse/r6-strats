"use client";
import { ServerToClientSocketEvents } from "@/src/socket/types";
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const useSocketEvent = <Event extends keyof ServerToClientSocketEvents>(
  event: Event,
  callback: ServerToClientSocketEvents[Event]
) => {
  const socket = useSocket();

  useEffect(() => {
    socket.on(event, callback as any);

    return () => {
      socket.off(event, callback as any);
    };
  }, [event, callback]);
};

export default useSocketEvent;
