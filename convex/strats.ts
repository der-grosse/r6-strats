import { v } from "convex/values";
import {
  ActionCtx,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { requireUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { Strat } from "../lib/types/strat.types";
import { PlacedAsset } from "../lib/types/asset.types";

export const get = query({
  args: {
    id: v.id("strats"),
  },
  async handler(ctx, { id }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) return null;

    return await getStrat(ctx, id as Id<"strats">);
  },
});

export const list = query({
  args: {
    map: v.optional(v.nullable(v.string())),
    site: v.optional(v.nullable(v.string())),
    showArchived: v.optional(v.nullable(v.boolean())),
  },
  async handler(ctx, { map, site, showArchived }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) return [];
    let strats: Doc<"strats">[] = [];
    if (site && map) {
      strats = await ctx.db
        .query("strats")
        .withIndex("byTeamMapAndSite", (q) =>
          q.eq("teamID", activeTeamID).eq("map", map).eq("site", site)
        )
        .collect();
    } else if (map) {
      strats = await ctx.db
        .query("strats")
        .withIndex("byTeamAndMap", (q) =>
          q.eq("teamID", activeTeamID).eq("map", map)
        )
        .collect();
    } else {
      strats = await ctx.db
        .query("strats")
        .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
        .collect();
    }

    if (!showArchived) {
      strats = strats.filter((strat) => !strat.archived);
    }

    const fullStrats: Strat[] = [];
    for (const strat of strats) {
      const stratPositions = await ctx.db
        .query("stratPositions")
        .withIndex("byStrat", (q) => q.eq("stratID", strat._id))
        .collect();

      const pickedOperators = await ctx.db
        .query("pickedOperators")
        .withIndex("byStrat", (q) => q.eq("stratID", strat._id))
        .collect();

      fullStrats.push({
        _id: strat._id,
        map: strat.map,
        site: strat.site,
        name: strat.name,
        description: strat.description,
        drawingID: strat.drawingID,
        archived: strat.archived,
        mapIndex: strat.mapIndex,
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
      });
    }

    return fullStrats.sort(
      (a, b) => a.map.localeCompare(b.map) || a.mapIndex - b.mapIndex
    );
  },
});

export async function getStrat(
  ctx: QueryCtx | MutationCtx,
  id: Id<"strats">
): Promise<Strat | null> {
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

  return {
    _id: stratDoc._id,
    map: stratDoc.map,
    site: stratDoc.site,
    name: stratDoc.name,
    description: stratDoc.description,
    drawingID: stratDoc.drawingID,
    archived: stratDoc.archived,
    mapIndex: stratDoc.mapIndex,
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

export const archive = mutation({
  args: {
    stratID: v.id("strats"),
  },
  async handler(ctx, { stratID }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) {
      return { success: false, error: "No active team selected" };
    }
    const stratDoc = await ctx.db.get(stratID);
    if (!stratDoc || stratDoc.teamID !== activeTeamID) {
      return { success: false, error: "Strat not found" };
    }
    await ctx.db.patch(stratID, { archived: true, mapIndex: -1 });
    return { success: true };
  },
});

export const update = mutation({
  args: {
    _id: v.id("strats"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    map: v.optional(v.string()),
    site: v.optional(v.string()),
    drawingID: v.optional(v.nullable(v.string())),
  },
  async handler(ctx, args) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) {
      return { success: false, error: "No active team selected" };
    }

    const stratDoc = await ctx.db.get(args._id);
    if (!stratDoc || stratDoc.teamID !== activeTeamID) {
      return { success: false, error: "Strat not found" };
    }

    await ctx.db.patch(args._id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.description !== undefined
        ? { description: args.description }
        : {}),
      ...(args.map !== undefined ? { map: args.map } : {}),
      ...(args.site !== undefined ? { site: args.site } : {}),
      ...(args.drawingID !== undefined
        ? { drawingID: args.drawingID ?? undefined } // when drawingID is null, we want to remove it
        : {}),
    });
    return { success: true };
  },
});

export const updateIndex = mutation({
  args: {
    stratID: v.id("strats"),
    newIndex: v.number(),
  },
  async handler(ctx, { stratID, newIndex }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) {
      return { success: false, error: "No active team selected" };
    }

    const stratDoc = await ctx.db.get(stratID);
    if (!stratDoc || stratDoc.teamID !== activeTeamID) {
      return { success: false, error: "Strat not found" };
    }

    // resort all strats on the same map
    const stratsOnMap = (
      await ctx.db
        .query("strats")
        .withIndex("byTeamAndMap", (q) =>
          q.eq("teamID", activeTeamID).eq("map", stratDoc.map)
        )
        .collect()
    ).filter((s) => !s.archived);

    const oldIndex = stratDoc.mapIndex;

    // Update indexes
    for (const strat of stratsOnMap) {
      let updatedIndex = strat.mapIndex;
      if (strat._id === stratID) {
        updatedIndex = newIndex;
      } else if (oldIndex < newIndex) {
        // moved down
        if (strat.mapIndex > oldIndex && strat.mapIndex <= newIndex) {
          updatedIndex = strat.mapIndex - 1;
        }
      } else if (oldIndex > newIndex) {
        // moved up
        if (strat.mapIndex < oldIndex && strat.mapIndex >= newIndex) {
          updatedIndex = strat.mapIndex + 1;
        }
      }
      if (updatedIndex !== strat.mapIndex) {
        await ctx.db.patch(strat._id, { mapIndex: updatedIndex });
      }
    }
    return { success: true };
  },
});

export const getAssets = query({
  args: {
    stratID: v.id("strats"),
  },
  async handler(ctx, { stratID }) {
    const placedAssets = await ctx.db
      .query("placedAssets")
      .withIndex("byStrat", (q) => q.eq("stratID", stratID))
      .collect();
    return placedAssets.map(
      (asset) =>
        ({
          _id: asset._id,
          stratPositionID: asset.stratPositionID,
          customColor: asset.customColor,

          type: asset.type,
          variant: asset.variant,
          operator: asset.operator,
          iconType: asset.iconType,
          gadget: asset.gadget,

          position: { x: asset.posX, y: asset.posY },
          size: { width: asset.width, height: asset.height },
          rotation: asset.rotation,
        }) as PlacedAsset
    );
  },
});

export const updateStratPosition = mutation({
  args: {
    _id: v.id("stratPositions"),
    isPowerPosition: v.optional(v.boolean()),
    shouldBringShotgun: v.optional(v.boolean()),
    teamPositionID: v.optional(v.nullable(v.id("teamPositions"))),
  },
  async handler(ctx, args) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) {
      return { success: false, error: "No active team selected" };
    }
    const stratPositionDoc = await ctx.db.get(args._id);
    if (!stratPositionDoc) {
      return { success: false, error: "Strat position not found" };
    }
    const stratDoc = await ctx.db.get(stratPositionDoc.stratID);
    if (!stratDoc || stratDoc.teamID !== activeTeamID) {
      return { success: false, error: "Strat not found" };
    }
    await ctx.db.patch(args._id, {
      ...(args.isPowerPosition !== undefined
        ? { isPowerPosition: args.isPowerPosition }
        : {}),
      ...(args.shouldBringShotgun !== undefined
        ? { shouldBringShotgun: args.shouldBringShotgun }
        : {}),
      ...(args.teamPositionID !== undefined
        ? { teamPositionID: args.teamPositionID ?? undefined } // when null, remove it
        : {}),
    });
    return { success: true };
  },
});

export const updatePickedOperator = mutation({
  args: {
    pickedOperatorID: v.id("pickedOperators"),
    secondaryGadget: v.optional(v.string()),
    tertiaryGadget: v.optional(v.string()),
    operator: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) {
      return { success: false, error: "No active team selected" };
    }
    const pickedOperatorDoc = await ctx.db.get(args.pickedOperatorID);
    if (!pickedOperatorDoc) {
      return { success: false, error: "Picked operator not found" };
    }
    const stratDoc = await ctx.db.get(pickedOperatorDoc.stratID);
    if (!stratDoc || stratDoc.teamID !== activeTeamID) {
      return { success: false, error: "Strat not found" };
    }
    await ctx.db.patch(args.pickedOperatorID, {
      ...(args.secondaryGadget !== undefined
        ? { secondaryGadget: args.secondaryGadget }
        : {}),
      ...(args.tertiaryGadget !== undefined
        ? { tertiaryGadget: args.tertiaryGadget }
        : {}),
      ...(args.operator !== undefined ? { operator: args.operator } : {}),
    });
    return { success: true };
  },
});
