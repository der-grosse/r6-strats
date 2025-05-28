import { eq } from "drizzle-orm";
import db from "../db/db";
import { activeStrat } from "../db/schema";
import StratsDB from "./stratsDB";
import { getSocketServer } from "../socket/server.init";

class ActiveStratClass {
  async setActiveStrat(user: JWTPayload, stratID: Strat["id"]) {
    const active = (
      await db
        .select()
        .from(activeStrat)
        .where(eq(activeStrat.teamID, user.teamID))
    )[0];
    if (!active) {
      await db.insert(activeStrat).values({ teamID: user.teamID, stratID });
    } else if (active.stratID !== stratID) {
      await db
        .update(activeStrat)
        .set({ stratID })
        .where(eq(activeStrat.teamID, user.teamID));
    }
    const strat = await StratsDB.get(user, stratID);
    const socket = await getSocketServer();
    socket?.in("active-strat").emit("active-strat:changed", strat!);
  }

  async getActiveStrat(user: JWTPayload): Promise<Strat | null> {
    const active = (
      await db
        .select()
        .from(activeStrat)
        .where(eq(activeStrat.teamID, user.teamID))
    )[0];
    if (!active?.stratID) return null;
    return await StratsDB.get(user, active.stratID);
  }
}

const ActiveStratDB = new ActiveStratClass();

export default ActiveStratDB;
