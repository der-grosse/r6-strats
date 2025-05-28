import { type Namespace, type Socket } from "socket.io";
import {
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
} from "./types";
import ActiveStratDB from "../strats/activeStrat";
import StratsDB from "../strats/stratsDB";

export async function createSocketActions(
  io: Namespace,
  socket: Socket<ClientToServerSocketEvents, ServerToClientSocketEvents> & {
    user: JWTPayload;
    teamID: number;
  }
) {
  socket.on("active-strat:subscribe", () => {
    socket.join("active-strat");
    console.debug(
      `User ${socket.user.id}:${socket.id} subscribed to active-strat channel`
    );
  });
  socket.on("active-strat:unsubscribe", () => {
    socket.leave("active-strat");
    console.debug(
      `User ${socket.user.id}:${socket.id} unsubscribed from active-strat channel`
    );
  });

  socket.on("active-strat:change", async (stratID) => {
    ActiveStratDB.setActiveStrat(socket.user, stratID);
  });

  socket.on("active-strat:change", async (stratID) => {
    const strat = await StratsDB.get(socket.user, stratID);
    if (!strat) return;
    io.in("active-strat").emit("active-strat:changed", strat);
  });
}
