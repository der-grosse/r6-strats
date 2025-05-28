"use client";
import { DefaultEventsMap } from "socket.io";
import { io, type Socket } from "socket.io-client";

// Create a singleton socket instance
let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null | null =
  null;

export function getSocketClient(): Socket<
  DefaultEventsMap,
  DefaultEventsMap
> | null {
  if (!socketInstance && typeof window !== "undefined") {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;

    console.log("Creating Socket.IO client connection to:", socketUrl);

    // Create socket instance with better error handling
    socketInstance = io(socketUrl, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    // Debug connection events
    socketInstance.on("connect", () => {
      console.log("Socket.IO connected! ID:", socketInstance?.id);
      console.log("Using transport:", socketInstance?.io.engine.transport.name);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
    });

    // Add to window for debugging purposes
    if (typeof window !== "undefined") {
      (window as any).socketClient = socketInstance;
    }
  }

  return socketInstance;
}

export const socket = getSocketClient();
