"use client";
import { io, type Socket } from "socket.io-client";
import {
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
} from "./types";

export type SocketClient = Socket<
  ServerToClientSocketEvents,
  ClientToServerSocketEvents
>;

// Create a singleton socket instance
let socketInstance: SocketClient = null!;

export function getSocketClient(user: JWTPayload): SocketClient {
  if (!socketInstance && typeof window !== "undefined") {
    const socketUrl = window.location.origin;

    console.debug("Creating Socket.IO client connection to:", socketUrl);

    // Create socket instance with better error handling
    socketInstance = io(socketUrl + `/team-${user.teamID}`, {
      path: "/api/socketio",
      transports: ["polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    // Debug connection events
    socketInstance.on("connect", () => {
      console.debug("Socket.IO connected! ID:", socketInstance?.id);
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
