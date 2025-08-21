"use server";
import { and, eq, inArray } from "drizzle-orm";
import db from "../db/db";
import { bannedOps } from "../db/schema";
import { getPayload } from "../auth/getPayload";

export async function getBannedOps(): Promise<string[]> {
  const user = await getPayload();
  if (!user) throw new Error("User not found");
  const bans = await db
    .select()
    .from(bannedOps)
    .where(eq(bannedOps.teamID, user.teamID));
  return bans.map((ban) => ban.operator);
}

export async function setBannedOps(ops: string[]): Promise<void> {
  const user = await getPayload();
  if (!user) throw new Error("User not found");
  if (ops.length === 0) {
    await db.delete(bannedOps).where(eq(bannedOps.teamID, user.teamID));
  } else {
    const existingBans = (
      await db.select().from(bannedOps).where(eq(bannedOps.teamID, user.teamID))
    ).map((ban) => ban.operator);

    const toAdd = ops.filter((op) => !existingBans.includes(op));
    const toRemove = existingBans.filter((op) => !ops.includes(op));

    if (toAdd.length > 0) {
      await db
        .insert(bannedOps)
        .values(toAdd.map((op) => ({ teamID: user.teamID, operator: op })));
    }

    if (toRemove.length > 0) {
      await db
        .delete(bannedOps)
        .where(
          and(
            eq(bannedOps.teamID, user.teamID),
            inArray(bannedOps.operator, toRemove)
          )
        );
    }
  }
}
