"use server";

import db from "@/src/db/db";
import {
  pickedOperators,
  playerPositions,
  stratPositions,
  strats,
} from "@/src/db/schema";
import { getPayload } from "@/src/auth/getPayload";
import { and, eq, is, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import StratsDB from "./stratsDB";
import ActiveStratDB from "./activeStrat";
import { PLAYER_COUNT } from "../static/general";

export async function createStrat(data: {
  map: string;
  site: string;
  name: string;
  description: string;
  drawingID: string | null;
}) {
  try {
    const session = await getPayload();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const { map, site, name, description, drawingID } = data;

    const [{ lastMapIndex }] = await db
      .select({ lastMapIndex: max(strats.mapIndex) })
      .from(strats)
      .where(
        and(
          eq(strats.teamID, session.teamID),
          eq(strats.archived, 0),
          eq(strats.map, map)
        )
      );

    const [newStrat] = await db
      .insert(strats)
      .values({
        map,
        site,
        name,
        description,
        drawingID,
        teamID: session.teamID,
        mapIndex: lastMapIndex ? lastMapIndex + 1 : 0,
      })
      .returning();

    const positions = await db
      .select()
      .from(playerPositions)
      .where(eq(playerPositions.teamID, session.teamID))
      .orderBy(playerPositions.index);

    await db.insert(stratPositions).values(
      Array.from({ length: PLAYER_COUNT }, (_, i) => ({
        operator: null,
        positionID: positions[i]?.id,
        stratsID: newStrat.id,
        index: 0,
      }))
    );

    revalidatePath("/", "layout");

    return { success: true, data: newStrat };
  } catch (error) {
    console.error("Error creating strat:", error);
    return { success: false, error: "Failed to create strat" };
  }
}

export async function archiveStrat(stratId: number) {
  try {
    const session = await getPayload();
    if (!session) {
      throw new Error("Unauthorized");
    }

    StratsDB.archive(session, stratId);

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error deleting strat:", error);
    return { success: false, error: "Failed to delete strat" };
  }
}

export async function getAllStrats() {
  const user = await getPayload();
  if (!user) throw new Error("User not found");
  return StratsDB.list(user);
}

export async function getStrat(id: number) {
  const user = await getPayload();
  const strat = await StratsDB.get(user!, id);

  return strat;
}

export async function getActive() {
  const user = await getPayload();
  const activeStrat = await ActiveStratDB.getActiveStrat(user!);
  return activeStrat;
}

export async function setActive(newStrat: Strat["id"] | null) {
  const user = await getPayload();
  await ActiveStratDB.setActiveStrat(user!, newStrat);
}

export async function updateStrat(
  updatedStrat: Partial<Strat> & Pick<Strat, "id">
) {
  const user = await getPayload();
  await StratsDB.update(user!, updatedStrat);

  revalidatePath(`/editor/${updatedStrat.id}`);
  revalidatePath("/strats");
  revalidatePath(`/strat/${updatedStrat.id}`);
  revalidatePath("/", "layout");
}

export async function updateStratAssets(
  stratID: Strat["id"],
  asset: PlacedAsset[]
) {
  const user = await getPayload();
  for (const a of asset) {
    StratsDB.updateAsset(user!, stratID, a);
  }

  revalidatePath(`/editor/${stratID}`);
  revalidatePath("/strats");
  revalidatePath(`/strat/${stratID}`);
  revalidatePath("/", "layout");
}

export async function deleteStratAssets(
  stratID: Strat["id"],
  assetIDs: PlacedAsset["id"][]
) {
  const user = await getPayload();
  StratsDB.deleteAssets(user!, stratID, assetIDs);

  revalidatePath(`/editor/${stratID}`);
  revalidatePath("/strats");
  revalidatePath(`/strat/${stratID}`);
  revalidatePath("/", "layout");
}

export async function addStratAsset(stratID: Strat["id"], asset: PlacedAsset) {
  const user = await getPayload();
  StratsDB.addAsset(user!, stratID, asset);

  revalidatePath(`/editor/${stratID}`);
  revalidatePath("/strats");
  revalidatePath(`/strat/${stratID}`);
  revalidatePath("/", "layout");
}

export async function updatePickedOperator(
  stratID: Strat["id"],
  stratPosition: Partial<StratPositions> & Pick<StratPositions, "id">
) {
  const user = await getPayload();
  if (!user) throw new Error("User not found");
  const strat = (
    await db.select().from(strats).where(eq(strats.id, stratID))
  )[0];
  if (!strat) throw new Error("Strat not found");
  if (strat.teamID !== user.teamID)
    throw new Error("Strat must be in the same team");

  if (
    stratPosition.isPowerPosition !== undefined ||
    stratPosition.positionID !== undefined ||
    stratPosition.shouldBringShotgun !== undefined
  ) {
    await db
      .update(stratPositions)
      .set({
        isPowerPosition: stratPosition.isPowerPosition,
        positionID: stratPosition.positionID,
        shouldBringShotgun: stratPosition.shouldBringShotgun,
      })
      .where(eq(stratPositions.id, stratPosition.id));
  }

  if (stratPosition.operators) {
    await db
      .delete(pickedOperators)
      .where(eq(pickedOperators.stratPositionID, stratPosition.id));
    if (stratPosition.operators.length > 0) {
      await db.insert(pickedOperators).values(
        stratPosition.operators.map((operator, index) => ({
          operator: operator.operator,
          index,
          stratPositionID: stratPosition.id,
          secondaryGadget: operator.secondaryGadget,
          tertiaryGadget: operator.tertiaryGadget,
        }))
      );
    }
  }

  revalidatePath(`/editor/${stratID}`);
  revalidatePath("/strats");
  revalidatePath(`/strat/${stratID}`);
  revalidatePath("/", "layout");
}

export async function updateMapIndexes(
  map: string,
  stratID: number,
  oldIndex: number,
  newIndex: number
) {
  const user = await getPayload();
  await StratsDB.updateMapIndexes(user!, map, stratID, oldIndex, newIndex);

  revalidatePath("/strats");
  revalidatePath("/", "layout");
}
