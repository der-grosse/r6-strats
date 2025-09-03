import { type Server, type Socket } from "socket.io";
import * as cookie from "cookie";
import { verifyJWT } from "../auth/jwt";
import { createSocketActions } from "./server.actions";
import {
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
} from "./types";

const activeConnections = new Map<string, JWTPayload>();
export async function createSocketServer(io: Server) {
  io.on("connection", async (socket) => {
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

    const namespaceIO = io.of(`/team-${user.teamID}`);

    createSocketActions(namespaceIO, userSocket);
  });
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
