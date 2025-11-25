import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { Id } from "./_generated/dataModel";
import { generate } from "random-words";

export const get = query({
  async handler(ctx) {
    const { activeTeamID, _id } = await requireUser(ctx);
    if (!activeTeamID) return null;
    const teamDoc = await ctx.db.get(activeTeamID);
    if (!teamDoc) return null;

    const memberships = await ctx.db
      .query("userTeams")
      .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
      .collect();
    const isSelfAdmin = memberships.some(
      (membership) => membership.userID === _id && membership.isAdmin
    );

    const teamPositions = await ctx.db
      .query("teamPositions")
      .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const userDoc = await ctx.db.get(membership.userID);
        if (!userDoc) return null!;
        return {
          isAdmin: membership.isAdmin,
          id: userDoc._id,
          name: userDoc.name,
          ubisoftID: userDoc.ubisoftID ?? null,
          teamPositionID:
            teamPositions.find((pos) => pos.playerID === userDoc._id)?._id ||
            null,
          defaultColor: membership.defaultColor ?? null,
          memberSince: membership._creationTime,
        };
      })
    );

    return {
      _id: teamDoc._id,
      _creationTime: teamDoc._creationTime,
      name: teamDoc.name,
      isSelfAdmin,
      members,
      teamPositions: teamPositions
        .map((pos) => ({
          _id: pos._id,
          playerID: pos.playerID ?? null,
          positionName: pos.positionName ?? null,
          index: pos.index,
        }))
        .sort((a, b) => a.index - b.index),
    };
  },
});

export const updateTeam = mutation({
  args: {
    _id: v.id("teams"),
    name: v.string(),
  },
  async handler(ctx, args) {
    await requireUser(ctx, { teamID: args._id, admin: true });

    await ctx.db.patch(args._id, { name: args.name });
    return true;
  },
});

export const getInviteKeys = query({
  async handler(ctx) {
    const { activeTeamID } = await requireUser(ctx);
    if (!activeTeamID) return null;
    const inviteKeys = await ctx.db
      .query("teamInvites")
      .withIndex("byTeam", (q) => q.eq("teamID", activeTeamID))
      .collect();
    return inviteKeys.map((invite) => ({
      _id: invite._id,
      inviteKey: invite.inviteKey,
      teamID: invite.teamID,
      usedBy: invite.usedBy ?? null,
      usedAt: invite.usedAt ?? null,
    }));
  },
});

export const updateTeamMember = mutation({
  args: {
    teamID: v.id("teams"),
    userID: v.optional(v.id("users")),
    isAdmin: v.optional(v.boolean()),
    defaultColor: v.optional(v.string()),
    ubisoftID: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const selfID = (await ctx.auth.getUserIdentity())?.subject as Id<"users">;
    const userID = args.userID ?? selfID;
    await requireUser(ctx, {
      teamID: args.teamID,
      admin: userID !== selfID || args.isAdmin === true,
    });

    if (args.isAdmin !== undefined || args.defaultColor !== undefined) {
      const membership = await ctx.db
        .query("userTeams")
        .withIndex("byUserAndTeam", (q) =>
          q.eq("userID", userID).eq("teamID", args.teamID)
        )
        .first();

      if (!membership) {
        throw new Error("User is not a member of the team");
      }

      await ctx.db.patch(membership._id, {
        isAdmin: args.isAdmin ?? membership.isAdmin,
        defaultColor: args.defaultColor ?? membership.defaultColor,
      });
    }

    if (args.ubisoftID !== undefined) {
      const userDoc = await ctx.db.get(userID);
      if (!userDoc) {
        throw new Error("User not found");
      }
      await ctx.db.patch(userID, { ubisoftID: args.ubisoftID });
    }

    return true;
  },
});

export const createInviteKey = mutation({
  args: {
    teamID: v.id("teams"),
  },
  async handler(ctx, args) {
    await requireUser(ctx, {
      teamID: args.teamID,
      admin: true,
    });

    const inviteKey = generate({ exactly: 5, join: "-" });

    const id = await ctx.db.insert("teamInvites", {
      teamID: args.teamID,
      inviteKey,
      usedBy: undefined,
      usedAt: undefined,
    });
    return {
      _id: id,
      teamID: args.teamID,
      inviteKey,
      usedBy: undefined,
      usedAt: undefined,
    };
  },
});

export const deleteInviteKey = mutation({
  args: {
    inviteKey: v.id("teamInvites"),
  },
  async handler(ctx, args) {
    const invite = await ctx.db.get(args.inviteKey);
    if (!invite) {
      throw new Error("Invite key not found");
    }
    await requireUser(ctx, {
      teamID: invite.teamID,
      admin: true,
    });
    await ctx.db.delete(args.inviteKey);
  },
});

export const removeTeamMember = mutation({
  args: {
    teamID: v.id("teams"),
    userID: v.id("users"),
  },
  async handler(ctx, args) {
    const selfID = (await ctx.auth.getUserIdentity())?.subject as Id<"users">;
    await requireUser(ctx, {
      teamID: args.teamID,
      admin: args.userID !== selfID,
    });

    const membership = await ctx.db
      .query("userTeams")
      .withIndex("byUserAndTeam", (q) =>
        q.eq("userID", args.userID).eq("teamID", args.teamID)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of the team");
    }

    // check that user is not the last member or the last member
    const teamMembers = await ctx.db
      .query("userTeams")
      .withIndex("byTeam", (q) => q.eq("teamID", args.teamID))
      .collect();

    if (teamMembers.length <= 1) {
      throw new Error("Cannot remove the last member of the team");
    }

    if (membership.isAdmin) {
      const adminCount = teamMembers.filter((member) => member.isAdmin).length;
      if (adminCount <= 1) {
        throw new Error("Cannot remove the last admin of the team");
      }
    }

    await ctx.db.delete(membership._id);
  },
});

export const updateTeamPosition = mutation({
  args: {
    teamID: v.id("teams"),
    positionID: v.id("teamPositions"),
    positionName: v.optional(v.string()),
    playerID: v.optional(v.nullable(v.id("users"))),
    index: v.optional(v.number()),
  },
  async handler(ctx, args) {
    await requireUser(ctx, {
      teamID: args.teamID,
      admin: true,
    });

    const position = await ctx.db.get(args.positionID);
    if (!position) {
      throw new Error("Position not found");
    }
    if (position.teamID !== args.teamID) {
      throw new Error("Position does not belong to the team");
    }

    await ctx.db.patch(args.positionID, {
      positionName: args.positionName ?? position.positionName,
      playerID:
        args.playerID === null
          ? undefined
          : (args.playerID ?? position.playerID),
      index: args.index ?? position.index,
    });

    if (args.index !== undefined) {
      const teamPositions = await ctx.db
        .query("teamPositions")
        .withIndex("byTeam", (q) => q.eq("teamID", args.teamID))
        .collect();

      // Switch indexes
      const oldIndex = position.index;
      const newIndex = args.index;
      for (const pos of teamPositions) {
        if (pos._id === args.positionID) {
          continue;
        }
        if (oldIndex < newIndex) {
          // Moving down
          if (pos.index > oldIndex && pos.index <= newIndex) {
            await ctx.db.patch(pos._id, { index: pos.index - 1 });
          }
        } else if (oldIndex > newIndex) {
          // Moving up
          if (pos.index < oldIndex && pos.index >= newIndex) {
            await ctx.db.patch(pos._id, { index: pos.index + 1 });
          }
        }
      }
    }
  },
});
