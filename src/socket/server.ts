import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { type Server } from "socket.io";

let ioInstance: Server | null = null;
export async function createSocketServer() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    // Skip this during build time
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
  const httpServer = createServer({}, (req, res) => {
    if (req.url === "/api/test") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Socket server is running");
    }
  });

  const port = process.env.SOCKET_PORT || 3001;

  httpServer.listen(port, () => {
    console.log(`Socket listening on ${port}`);
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
