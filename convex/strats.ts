import { v } from "convex/values";
import { ActionCtx, MutationCtx, query, QueryCtx } from "./_generated/server";
import { requireUser } from "./auth";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {
    id: v.id("strats"),
  },
  async handler(ctx, { id }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) return null;

    return await getStrat(ctx, id);
  },
});

export async function getStrat(ctx: QueryCtx | MutationCtx, id: Id<"strats">) {
  const stratDoc = await ctx.db.get(id);
  if (!stratDoc) return null;

  const stratPositions = await ctx.db
    .query("stratPositions")
    .withIndex("byStrat", (q) => q.eq("stratID", id))
    .collect();

  const pickedOperators = await ctx.db
    .query("pickedOperators")
    .withIndex("byStrat", (q) => q.eq("stratID", id))
    .collect();

  const placedAssets = await ctx.db
    .query("placedAssets")
    .withIndex("byStrat", (q) => q.eq("stratID", id))
    .collect();

  return {
    _id: stratDoc._id,
    map: stratDoc.map,
    site: stratDoc.site,
    name: stratDoc.name,
    description: stratDoc.description,
    drawingID: stratDoc.drawingID,
    archived: stratDoc.archived,
    mapIndex: stratDoc.mapIndex,
    assets: placedAssets,
    stratPositions: stratPositions
      .map((pos) => ({
        _id: pos._id,
        teamPositionID: pos.teamPositionID,
        isPowerPosition: pos.isPowerPosition,
        shouldBringShotgun: pos.shouldBringShotgun,
        index: pos.index,
        pickedOperators: pickedOperators
          .filter((op) => op.stratPositionID === pos._id)
          .map((op) => ({
            _id: op._id,
            stratPositionID: op.stratPositionID,
            operator: op.operator,
            secondaryGadget: op.secondaryGadget,
            tertiaryGadget: op.tertiaryGadget,
            index: op.index,
          }))
          .sort((a, b) => a.index - b.index),
      }))
      .sort((a, b) => a.index - b.index),
  };
}
