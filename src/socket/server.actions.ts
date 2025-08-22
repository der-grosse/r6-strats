import { type Namespace, type Socket } from "socket.io";
import {
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
} from "./types";

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

  socket.on("active-strat:change", async (strat) => {
    io.in("active-strat").emit("active-strat:changed", strat);
  });

  socket.on("operator-bans:subscribe", () => {
    socket.join("operator-bans");
    console.debug(
      `User ${socket.user.id}:${socket.id} subscribed to operator-bans channel`
    );
  });
  socket.on("operator-bans:unsubscribe", () => {
    socket.leave("operator-bans");
    console.debug(
      `User ${socket.user.id}:${socket.id} unsubscribed from operator-bans channel`
    );
  });

  socket.on("operator-bans:change", (bans) => {
    socket.to("operator-bans").emit("operator-bans:changed", bans);
  });

  socket.on("strat-editor:subscribe", (stratID) => {
    socket.join(`strat-editor-${stratID}`);
    console.debug(
      `User ${socket.user.id}:${socket.id} subscribed to strat-editor-${stratID} channel`
    );
  });
  socket.on("strat-editor:unsubscribe", (stratID) => {
    socket.leave(`strat-editor-${stratID}`);
    console.debug(
      `User ${socket.user.id}:${socket.id} unsubscribed from strat-editor-${stratID} channel`
    );
  });

  socket.on("strat-editor:event", (stratID, event) => {
    io.in(`strat-editor-${stratID}`).emit(
      "strat-editor:event",
      event,
      socket.id
    );
    console.debug(
      `User ${socket.user.id}:${socket.id} emitted strat-editor event for strat ${stratID}`
    );
  });
}
