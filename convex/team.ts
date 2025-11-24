import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./auth";

export const getTeamMembers = query({
  args: {
    teamID: v.id("teams"),
  },
  async handler(ctx, args) {
    const auth = await requireUser(ctx);
    const userDoc = await ctx.db.get(auth._id);
    if (!userDoc) return null;
    const memberships = await ctx.db
      .query("userTeams")
      .withIndex("byTeam", (q) => q.eq("teamID", args.teamID))
      .collect();
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const userDoc = await ctx.db.get(membership.userID);
        if (!userDoc) return null!;
        return {
          _id: userDoc._id,
          name: userDoc.name,
          email: userDoc.email ?? null,
          isAdmin: membership.isAdmin,
        };
      })
    );
    return members.filter(Boolean);
  },
});
