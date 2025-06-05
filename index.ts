import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { createSocketServer } from "./src/socket/server.init";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port, turbopack: true });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const teamIO = io.of(/^\/team-(\d+)$/);

  createSocketServer(teamIO);
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

  // Handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    io.close(() => {
      console.log("Socket.IO server closed");
    });

    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log("Force closing server");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
});
