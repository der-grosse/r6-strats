"use client";
import { ServerToClientSocketEvents } from "@/lib/socket/types";
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const useSocketEvent = <Event extends keyof ServerToClientSocketEvents>(
  event: Event,
  callback: ServerToClientSocketEvents[Event]
) => {
  const socket = useSocket();

  useEffect(() => {
    function cb(...args: unknown[]) {
      //@ts-ignore
      if (socket.debug) {
        console.debug(`Socket event received: ${event}`, ...args);
      }
      //@ts-ignore
      return callback(...args);
    }
    socket.on(event, cb as any);

    return () => {
      socket.off(event, cb as any);
    };
  }, [event, callback]);
};

export default useSocketEvent;
