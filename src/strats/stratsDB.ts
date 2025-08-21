import { and, eq, inArray, is, min, sql } from "drizzle-orm";
import db from "../db/db";
import {
  pickedOperators,
  placedAssets,
  stratPositions,
  rotationIndexes,
  strats,
} from "../db/schema";

class StratsDBClass {
  async list(user: JWTPayload): Promise<Strat[]> {
    const stratRows = await db
      .select({
        id: strats.id,
        map: strats.map,
        site: strats.site,
        name: strats.name,
        description: strats.description,
        drawingID: strats.drawingID,
        rotationIndex: min(rotationIndexes.rotationIndex).as("rotation_index"),
      })
      .from(strats)
      .leftJoin(rotationIndexes, eq(strats.id, rotationIndexes.stratsID))
      .where(and(eq(strats.teamID, user.teamID), eq(strats.archived, 0)))
      .groupBy(strats.id)
      .orderBy(strats.map, sql`rotation_index asc nulls last`, strats.site);

    const stratsIDs = stratRows.map((strat) => strat.id);

    const rotationIndexRows = await db
      .select()
      .from(rotationIndexes)
      .where(inArray(rotationIndexes.stratsID, stratsIDs));
    const placedAssetsRows = await db
      .select()
      .from(placedAssets)
      .where(inArray(placedAssets.stratsID, stratsIDs))
      .orderBy(placedAssets.id);
    const stratPositionsRows = await db
      .select()
      .from(stratPositions)
      .where(inArray(stratPositions.stratsID, stratsIDs));
    const pickedOperatorsRows = await db
      .select()
      .from(pickedOperators)
      .where(
        inArray(
          pickedOperators.stratPositionID,
          stratPositionsRows.map((row) => row.id)
        )
      );

    return this.parseStratRows({
      strat: stratRows,
      rotationIndexes: rotationIndexRows,
      placedAssets: placedAssetsRows,
      pickedOperators: pickedOperatorsRows,
      stratPositions: stratPositionsRows,
    });
  }

  async get(user: JWTPayload, id: Strat["id"]): Promise<Strat | null> {
    const stratRows = await db
      .select()
      .from(strats)
      .where(and(eq(strats.id, id), eq(strats.teamID, user.teamID)));

    if (stratRows.length === 0) return null;

    const rotationIndexRows = await db
      .select()
      .from(rotationIndexes)
      .where(eq(rotationIndexes.stratsID, id));
    const placedAssetsRows = await db
      .select()
      .from(placedAssets)
      .where(eq(placedAssets.stratsID, id));
    const stratPositionsRows = await db
      .select()
      .from(stratPositions)
      .where(eq(stratPositions.stratsID, id));
    const pickedOperatorsRows = await db
      .select()
      .from(pickedOperators)
      .where(
        inArray(
          pickedOperators.stratPositionID,
          stratPositionsRows.map((row) => row.id)
        )
      )
      .orderBy(pickedOperators.id);

    return (
      this.parseStratRows({
        strat: stratRows,
        rotationIndexes: rotationIndexRows,
        placedAssets: placedAssetsRows,
        pickedOperators: pickedOperatorsRows,
        stratPositions: stratPositionsRows,
      })[0] ?? null
    );
  }

  async update(
    user: JWTPayload,
    updatedStrat: Partial<Strat> & Pick<Strat, "id">
  ): Promise<undefined> {
    const strat = this.get(user, updatedStrat.id);
    if (!strat) return Promise.reject(new Error("Strat not found"));
    const newStrat = { ...strat, ...updatedStrat };
    await db.update(strats).set(newStrat).where(eq(strats.id, updatedStrat.id));

    if (updatedStrat.rotationIndex) {
      await db
        .delete(rotationIndexes)
        .where(eq(rotationIndexes.stratsID, updatedStrat.id));
      for (const rotationIndex of updatedStrat.rotationIndex) {
        await db
          .insert(rotationIndexes)
          .values({ rotationIndex, stratsID: updatedStrat.id });
      }
    }

    if (updatedStrat.positions) {
      await db
        .delete(stratPositions)
        .where(eq(stratPositions.stratsID, updatedStrat.id));
      for (const position of updatedStrat.positions) {
        await db.insert(stratPositions).values({
          positionID: position.positionID,
          stratsID: updatedStrat.id,
          id: position.id,
          isPowerPosition: position.isPowerPosition,
        });
        if (position.operators.length) {
          await db.insert(pickedOperators).values(
            position.operators.map((op, i) => ({
              stratPositionID: position.id,
              operator: op.operator,
              secondaryGadget: op.secondaryGadget,
              index: i,
            }))
          );
        }
      }
    }

    if (updatedStrat.assets) {
      await db.delete(placedAssets).where(eq(placedAssets.id, updatedStrat.id));
      for (const asset of updatedStrat.assets) {
        await db.insert(placedAssets).values({
          assetID: asset.id,
          positionX: asset.position.x,
          positionY: asset.position.y,
          customColor: asset.customColor,
          stratsID: updatedStrat.id,
          type: asset.type,
          gadget: asset.type === "gadget" ? asset.gadget : undefined,
          operator: asset.type === "operator" ? asset.operator : undefined,
          side: asset.type === "operator" ? asset.side : undefined,
          iconType: asset.type === "operator" ? asset.iconType : undefined,
          rotate: asset.type === "rotate" ? asset.variant : undefined,
          reinforcementVariant:
            asset.type === "reinforcement" ? asset.variant : undefined,
          stratPositionID: asset.stratPositionID,
          width: asset.size.width,
          height: asset.size.height,
          rotation: asset.rotation,
        });
      }
    }

    return Promise.resolve(undefined);
  }

  async updateAsset(
    user: JWTPayload,
    stratID: Strat["id"],
    asset: PlacedAsset
  ) {
    const strat = await db.select().from(strats).where(eq(strats.id, stratID));
    if (strat[0]?.teamID !== user.teamID) throw new Error("Strat not found");
    await db
      .update(placedAssets)
      .set({
        assetID: asset.id,
        positionX: asset.position.x,
        positionY: asset.position.y,
        customColor: asset.customColor,
        type: asset.type,
        gadget: asset.type === "gadget" ? asset.gadget : undefined,
        operator: asset.type === "operator" ? asset.operator : undefined,
        side: asset.type === "operator" ? asset.side : undefined,
        iconType: asset.type === "operator" ? asset.iconType : undefined,
        rotate: asset.type === "rotate" ? asset.variant : undefined,
        reinforcementVariant:
          asset.type === "reinforcement" ? asset.variant : undefined,
        stratPositionID: asset.stratPositionID,
        width: asset.size.width,
        height: asset.size.height,
        rotation: asset.rotation,
      })
      .where(
        and(
          eq(placedAssets.stratsID, stratID),
          eq(placedAssets.assetID, asset.id)
        )
      );
  }

  async addAsset(user: JWTPayload, stratID: Strat["id"], asset: PlacedAsset) {
    const strat = await db.select().from(strats).where(eq(strats.id, stratID));
    if (strat[0]?.teamID !== user.teamID) throw new Error("Strat not found");
    await db.insert(placedAssets).values({
      assetID: asset.id,
      positionX: asset.position.x,
      positionY: asset.position.y,
      customColor: asset.customColor,
      stratsID: stratID,
      type: asset.type,
      gadget: asset.type === "gadget" ? asset.gadget : undefined,
      operator: asset.type === "operator" ? asset.operator : undefined,
      side: asset.type === "operator" ? asset.side : undefined,
      iconType: asset.type === "operator" ? asset.iconType : undefined,
      rotate: asset.type === "rotate" ? asset.variant : undefined,
      reinforcementVariant:
        asset.type === "reinforcement" ? asset.variant : undefined,
      stratPositionID: asset.stratPositionID,
      width: asset.size.width,
      height: asset.size.height,
      rotation: asset.rotation,
    });
  }

  async deleteAssets(
    user: JWTPayload,
    stratID: Strat["id"],
    assetIDs: PlacedAsset["id"][]
  ) {
    const strat = await db.select().from(strats).where(eq(strats.id, stratID));
    if (strat[0]?.teamID !== user.teamID) throw new Error("Strat not found");
    await db
      .delete(placedAssets)
      .where(
        and(
          eq(placedAssets.stratsID, stratID),
          inArray(placedAssets.assetID, assetIDs)
        )
      );
  }

  async archive(user: JWTPayload, id: Strat["id"]): Promise<void> {
    await db
      .update(strats)
      .set({ archived: 1 })
      .where(and(eq(strats.id, id), eq(strats.teamID, user.teamID)));
  }

  private parseStratRows(data: {
    strat: {
      id: number;
      map: string;
      site: string;
      name: string;
      description: string;
      drawingID: string | null;
    }[];
    rotationIndexes: {
      rotationIndex: number;
      stratsID: number;
    }[];
    placedAssets: {
      id: number;
      stratsID: number;
      assetID: string;
      positionX: number;
      positionY: number;
      stratPositionID: number | null;
      customColor: string | null;
      type: string;
      operator: string | null;
      side: "att" | "def" | null;
      iconType: "default" | "hidden" | "bw" | null;
      gadget: string | null;
      rotate: string | null;
      reinforcementVariant: "reinforcement" | "barricade" | null;
      width: number;
      height: number;
      rotation: number;
    }[];
    stratPositions: {
      id: number;
      positionID?: number | null;
      stratsID: number;
      isPowerPosition: boolean;
      shouldBringShotgun: boolean;
    }[];
    pickedOperators: {
      id: number;
      operator: string;
      stratPositionID: number;
      secondaryGadget: string | null;
      index: number;
    }[];
  }): Strat[] {
    const parsedStrats: Strat[] = [];
    for (const row of data.strat) {
      const rotationIndexes = data.rotationIndexes
        .filter((r) => r.stratsID === row.id)
        .map((r) => r.rotationIndex);
      const placedAssets = data.placedAssets
        .filter((r) => r.stratsID === row.id)
        .map((r) => ({
          id: r.assetID,
          position: { x: r.positionX, y: r.positionY },
          size: { width: r.width, height: r.height },
          rotation: r.rotation,
          stratPositionID: r.stratPositionID,
          customColor: r.customColor,
          type: r.type,
          ...(() => {
            switch (r.type) {
              case "gadget":
                return {
                  gadget: r.gadget,
                };
              case "operator":
                return {
                  operator: r.operator,
                  side: r.side,
                  iconType: r.iconType,
                };
              case "rotate":
                return {
                  variant: r.rotate,
                };
              case "reinforcement":
                return {
                  variant:
                    r.reinforcementVariant === "barricade"
                      ? "barricade"
                      : "reinforcement",
                };
              default:
                return {};
            }
          })(),
        })) as PlacedAsset[];
      const positions = data.stratPositions
        .filter((r) => r.stratsID === row.id)
        .map((r) => ({
          id: r.id,
          positionID: r.positionID ?? undefined,
          isPowerPosition: r.isPowerPosition,
          shouldBringShotgun: r.shouldBringShotgun,
          operators: data.pickedOperators
            .filter((o) => o.stratPositionID === r.id)
            .sort((a, b) => a.index - b.index)
            .map((o) => ({
              operator: o.operator,
              secondaryGadget: o.secondaryGadget,
            })),
        }));

      parsedStrats.push({
        id: row.id,
        map: row.map,
        site: row.site,
        name: row.name,
        description: row.description,
        drawingID: row.drawingID,
        rotationIndex: rotationIndexes,
        assets: placedAssets,
        positions,
      });
    }

    return parsedStrats;
  }
}

const StratsDB = new StratsDBClass();

export default StratsDB;
