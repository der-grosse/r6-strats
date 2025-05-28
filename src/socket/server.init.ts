import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { type Namespace, type Socket } from "socket.io";
import cookie from "cookie";
import { verifyJWT } from "../auth/jwt";
import { createSocketActions } from "./server.actions";
import {
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
} from "./types";

let socketServer: Namespace | null = null;
const activeConnections = new Map<string, JWTPayload>();
export async function getSocketServer() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    // Skip this during build time
    return null;
  }
  //@ts-ignore -- is defined by next.js
  // https://vercel.com/docs/functions/runtimes/edge#check-if-you're-running-on-the-edge-runtime
  if (typeof EdgeRuntime === "string") {
    console.warn("Running on Edge Runtime, aborting loading socket server.");
    return;
  }
  if (socketServer) return socketServer;

  // in development mode, we need to ensure the socket server is shut down
  // before starting a new one, to avoid port conflicts during hot reloads
  const port = process.env.SOCKET_PORT || 3001;
  if (process.env.NODE_ENV === "development") {
    await fetch(`http://localhost:${port}/api/shutdown`).catch(() => {});
  }

  console.info("Creating socket server...");
  const { createServer } = await import("node:http");
  const { Server } = await import("socket.io");

  const httpServer = createServer((req, res) => {
    if (req.url === "/api/test") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Socket server is running");
    }

    if (process.env.NODE_ENV === "development" && req.url === "/api/shutdown") {
      console.info("Shutting down socket server due to hot reload...");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Socket server is shutting down");
      httpServer.close();
    }
  });

  httpServer.listen(port, () => {
    console.info(`Socket listening on ${port}`);
  });

  const io = new Server(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const teamIO = io.of(/^\/team-(\d+)$/);

  teamIO.on("connection", async (socket) => {
    const namespace = socket.nsp.name;
    const teamID = parseInt(namespace.split("-")[1]);
    if (isNaN(teamID)) {
      console.error(`Invalid team ID in namespace: ${namespace}`);
      socket.disconnect(true);
      return;
    }

    const user = await checkUserAuthentication(
      socket.handshake.headers.cookie || ""
    );
    if (!user) {
      console.error(
        `Socket ${socket.id} disconnected due to authentication failure.`
      );
      console.debug(socket.handshake.headers.cookie);
      socket.disconnect(true);
      return;
    }
    if (user.teamID !== teamID) {
      console.error(
        `Socket ${socket.id} tried to connect to team ${teamID} but is not a member.`
      );
      socket.disconnect(true);
      return;
    }

    console.info(`Socket ${socket.id} authenticated as user ${user.id}`);
    activeConnections.set(socket.id, user);

    socket.on("disconnect", (reason) => {
      console.info(`Socket ${socket.id} disconnected: ${reason}`);
      activeConnections.delete(socket.id);
    });

    const userSocket = (() => {
      const userSocket = socket as any;
      userSocket.user = user;
      userSocket.teamID = user.teamID;
      return userSocket as Socket<
        ClientToServerSocketEvents,
        ServerToClientSocketEvents
      > & { user: JWTPayload; teamID: number };
    })();
    createSocketActions(teamIO, userSocket);
  });

  socketServer = teamIO;
  return socketServer;
}

async function checkUserAuthentication(
  cookieHeader: string
): Promise<JWTPayload | null> {
  const cookies = cookie.parse(cookieHeader || "");
  let jwt = cookies.jwt || cookies.dev_jwt;
  if (process.env.NODE_ENV === "development") {
    jwt = process.env.DEV_SOCKET_JWT || jwt;
  }
  if (!jwt) return null;

  const user = await verifyJWT(jwt);
  if (!user) return null;
  return user;
}
