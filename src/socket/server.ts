import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { type Server } from "socket.io";

let ioInstance: Server | null = null;
export async function createSocketServer() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    console.info("Skipping socket server creation in production build phase.");
    return;
  }
  //@ts-ignore -- is defined by next.js
  // https://vercel.com/docs/functions/runtimes/edge#check-if-you're-running-on-the-edge-runtime
  if (typeof EdgeRuntime === "string") {
    console.log("Running on Edge Runtime, aborting loading socket server.");
    return;
  }
  if (ioInstance) return;
  console.log("Creating socket server...");
  const { createServer } = await import("node:http");
  const { Server } = await import("socket.io");
  const httpServer = createServer({});

  const port = process.env.SOCKET_PORT || 3001;

  httpServer.listen(port, () => {
    console.log(`server listening at http://localhost:${port}`);
  });

  const io = new Server(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`connected new socket ${socket.id}`);

    socket.on("message", (msg) => {
      console.log(`message from ${socket.id}: ${msg}`);
      socket.broadcast.emit("message", msg);
      socket.emit("message", `Echo: ${msg}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`disconnected due to ${reason}`);
    });
  });

  ioInstance = io;
  return ioInstance;
}
