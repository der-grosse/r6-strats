import {
  integer,
  numeric,
  primaryKey,
  pgTable,
  text,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const teamInvites = pgTable("team_invites", {
  inviteKey: text("invite_key").primaryKey().notNull(),
  teamID: integer("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  usedBy: integer("used_by").references(() => users.id),
  usedAt: text("used_at"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
  teamID: integer("team_id")
    .notNull()
    .references(() => team.id),
  isAdmin: boolean("is_admin").notNull().default(false),
  defaultColor: text("default_color"),
});

export const playerPositions = pgTable("player_positions", {
  id: serial("id").primaryKey(),
  playerID: integer("player_id").references(() => users.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  positionName: text("position_name").notNull(),
  teamID: integer("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  index: integer("index").notNull().default(0),
});

export const strats = pgTable("strats", {
  id: serial("id").primaryKey(),
  map: text("map").notNull(),
  site: text("site").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  drawingID: text("drawing_id"),
  teamID: integer("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  archived: integer("archived").notNull().default(0),
});

export const rotationIndexes = pgTable(
  "rotation_indexes",
  {
    rotationIndex: integer("rotation_index").notNull(),
    stratsID: integer("strats_id")
      .notNull()
      .references(() => strats.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.rotationIndex, table.stratsID] })]
);

export const activeStrat = pgTable(
  "active_strat",
  {
    teamID: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    stratID: integer("strat_id")
      .notNull()
      .references(() => strats.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.teamID, table.stratID] })]
);

export const bannedOps = pgTable(
  "banned_ops",
  {
    teamID: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    operator: text("operator").notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamID, table.operator] })]
);

export const placedAssets = pgTable("placed_assets", {
  id: serial("id").primaryKey(),
  stratsID: integer("strats_id")
    .notNull()
    .references(() => strats.id, { onDelete: "cascade" }),
  assetID: text("asset_id").notNull(),
  positionX: numeric("position_x", { mode: "number" }).notNull(),
  positionY: numeric("position_y", { mode: "number" }).notNull(),
  width: numeric("width", { mode: "number" }).notNull(),
  height: numeric("height", { mode: "number" }).notNull(),
  rotation: numeric("rotation", { mode: "number" }).notNull().default(0),
  stratPositionID: integer("strat_position_id").references(
    () => stratPositions.id,
    {
      onDelete: "set null",
      onUpdate: "cascade",
    }
  ),
  customColor: text("custom_color"),
  type: text("type").notNull(),

  // Operator type
  operator: text("operator"),
  side: text("side", { enum: ["att", "def"] }),
  iconType: text("icon_type", {
    enum: ["default", "hidden", "bw"],
  }),

  // Gadget type
  gadget: text("gadget"),

  // Rotate type
  rotate: text("rotate"),

  // reinforcement type
  reinforcementVariant: text("reinforcement_variant", {
    enum: ["reinforcement", "barricade"],
  }),
});

export const stratPositions = pgTable("strat_positions", {
  id: serial("id").primaryKey(),
  positionID: integer("position_id").references(() => playerPositions.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  stratsID: integer("strats_id")
    .notNull()
    .references(() => strats.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  isPowerPosition: boolean("is_power_position").notNull().default(false),
  shouldBringShotgun: boolean("should_bring_shotgun").notNull().default(false),
});

export const pickedOperators = pgTable("picked_operators", {
  id: serial("id").primaryKey(),
  stratPositionID: integer("positionID")
    .notNull()
    .references(() => stratPositions.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  operator: text("operator").notNull(),
  secondaryGadget: text("secondary_gadget"),
  tertiaryGadget: text("tertiary_gadget"),
  index: integer("index").notNull().default(0),
});
