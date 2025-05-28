import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "./UserContext";
import { getSocketClient, SocketClient } from "@/src/socket/client";

type SocketContextType = SocketClient;
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useUser();
  const socket = useMemo(() => (user ? getSocketClient(user) : null), [user]);

  return (
    <SocketContext.Provider value={socket!}>{children}</SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
