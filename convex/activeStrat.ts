import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const get = query({
  args: {},
  async handler(ctx) {
    const { teamID } = await requireUser(ctx);

    const activeStratDoc = await ctx.db
      .query("activeStrat")
      .withIndex("byTeam", (q) => q.eq("teamID", teamID))
      .first();
    if (!activeStratDoc || activeStratDoc.teamID !== teamID) return null;

    return activeStratDoc.stratID ?? null;
  },
});

export const set = mutation({
  args: { stratID: v.union(v.number(), v.null()) },
  async handler(ctx, { stratID }) {
    const { teamID } = await requireUser(ctx);

    const existing = await ctx.db
      .query("activeStrat")
      .withIndex("byTeam", (q) => q.eq("teamID", teamID))
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
      await ctx.db.insert("activeStrat", { teamID, stratID });
    }

    return stratID;
  },
});
