import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const get = query({
  args: {},
  async handler(ctx) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) return null;

    const activeStratDoc = await ctx.db
      .query("activeStrats")
      .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
      .first();
    if (!activeStratDoc || activeStratDoc.teamID !== activeTeamID) return null;

    return activeStratDoc.stratID ?? null;
  },
});

export const set = mutation({
  args: { stratID: v.union(v.id("strats"), v.null()) },
  async handler(ctx, { stratID }) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) throw new Error("No active team set");

    const existing = await ctx.db
      .query("activeStrats")
      .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
      .first();

    // Delete currently active strat if null/undefined passed
    if (stratID == null) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    // Update if exists, otherwise create
    if (existing) {
      await ctx.db.patch(existing._id, { stratID });
    } else {
      await ctx.db.insert("activeStrats", { teamID: activeTeamID, stratID });
    }

    return stratID;
  },
});
