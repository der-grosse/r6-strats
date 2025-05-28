"use client";

import { Button } from "@/components/ui/button";
import { socket } from "@/src/socket/client";
import { useEffect, useState } from "react";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;
    console.log("Socket test page mounted, socket:", socket);

    // Handle initial state if already connected
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("Socket connected with ID:", socket!.id);
      setIsConnected(true);
      setConnectionError(null);
      setTransport(socket!.io?.engine?.transport?.name || "unknown");

      // Listen for transport upgrades (e.g., from polling to websocket)
      socket!.io.engine.on("upgrade", (transport) => {
        console.log("Transport upgraded to:", transport.name);
        setTransport(transport.name);
      });
    }

    function onDisconnect(reason: string) {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      setTransport("N/A");
    }

    function onConnectError(err: Error) {
      console.error("Connection error:", err);
      setConnectionError(err.message);
      setIsConnected(false);
    }

    function onMessage(message: string) {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message].slice(-5)); // Keep last 5 messages
    }

    // Set up event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message", onMessage);

    // Force a connection attempt if not already connected
    if (!socket.connected) {
      console.log("Attempting to connect socket...");
      socket.connect();
    }

    // Clean up listeners when component unmounts
    return () => {
      socket!.off("connect", onConnect);
      socket!.off("disconnect", onDisconnect);
      socket!.off("connect_error", onConnectError);
      socket!.off("message", onMessage);
    };
  }, [socket]);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Socket.IO Test Page</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Connection Status</h2>
          <div className="space-y-2">
            <p className="flex items-center">
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              Status:{" "}
              <span className="font-medium ml-1">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </p>
            <p>
              Transport: <span className="font-medium">{transport}</span>
            </p>
            <p>
              Socket ID:{" "}
              <span className="font-mono text-sm">
                {socket?.id || "Not connected"}
              </span>
            </p>

            {connectionError && (
              <p className="text-red-500">Error: {connectionError}</p>
            )}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <Button
              onClick={() => socket?.connect()}
              disabled={isConnected}
              className="mr-2"
            >
              Connect
            </Button>

            <Button
              onClick={() => socket?.disconnect()}
              disabled={!isConnected}
              variant="outline"
            >
              Disconnect
            </Button>

            <div className="mt-4">
              <Button
                onClick={() => {
                  const timestamp = new Date().toISOString().substring(11, 19);
                  socket?.emit("message", `Test message (${timestamp})`);
                }}
                disabled={!isConnected}
                variant="default"
              >
                Send Test Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Message Log</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages received yet</p>
        ) : (
          <ul className="space-y-1">
            {messages.map((msg, idx) => (
              <li key={idx} className="p-2 border-b last:border-b-0">
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-sm text-gray-500 mt-8">
        <p>
          This page tests the Socket.IO connection. Check the browser console
          for detailed logs.
        </p>
      </div>
    </div>
  );
}
