import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  activeStrat: defineTable({
    teamID: v.number(),
    stratID: v.number(),
  }).index("byTeam", ["teamID"]),
});

export default schema;
