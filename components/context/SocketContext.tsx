"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "./UserContext";
import { getSocketClient, SocketClient } from "@/src/socket/client";
import { toast } from "sonner";
import { RotateCw, Unplug } from "lucide-react";
import { Button } from "../ui/button";

type SocketContextType = SocketClient;
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useUser();
  const socket = useMemo(() => (user ? getSocketClient(user) : null), [user]);

  const [connected, setConnected] = useState<boolean | undefined>(undefined);

  // set handlers for socket disconnect
  useEffect(() => {
    if (!socket) return;
    if (socket.connected) {
      setConnected(true);
    }

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
      toast.error("Connection failed");
      setConnected(false);
    });

    socket.on("disconnect", (err) => {
      console.error("Socket.IO disconnected:", err);
      toast.error("Connection lost", {
        description: "Trying to reconnect...",
      });
      setConnected(false);
    });
  }, [socket]);

  return (
    <SocketContext.Provider value={socket!}>
      {connected === false && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-red-600/90 px-3 py-2 text-md font-medium text-white shadow-lg backdrop-blur-sm">
          <Unplug />
          <h6>Disconnected</h6>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            className="-m-2 ml-0"
          >
            <RotateCw />
          </Button>
        </div>
      )}
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
