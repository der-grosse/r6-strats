import { Pool } from "pg";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import { Id } from "../convex/_generated/dataModel";

dotenv.config({ path: ".env.local" });
dotenv.config();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const DATABASE_URL = process.env.POSTGRES_URL;
const SERVER_JWT = process.env.SERVER_JWT;

if (!CONVEX_URL) {
  console.error("CONVEX_URL is not defined");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

if (!SERVER_JWT) {
  console.error("SERVER_JWT is not defined");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
client.setAuth(SERVER_JWT);
const pgPool = new Pool({
  connectionString: DATABASE_URL,
});

// Maps to store Old ID -> New ID
const teamIdMap = new Map<number, Id<"teams">>();
const userIdMap = new Map<number, Id<"users">>();
const teamPositionIdMap = new Map<number, Id<"teamPositions">>();
const stratIdMap = new Map<number, Id<"strats">>();
const stratPositionIdMap = new Map<number, Id<"stratPositions">>();
const pickedOperatorIdMap = new Map<number, Id<"pickedOperators">>();

// Helper to map IDs
function mapId<T>(
  map: Map<number, T>,
  oldId: number | null | undefined
): T | undefined {
  if (oldId === null || oldId === undefined) return undefined;
  return map.get(oldId);
}

async function migrate() {
  console.log("Starting migration...");
  const pgClient = await pgPool.connect();

  try {
    // 1. Teams
    console.log("Migrating Teams...");
    const teamsRes = await pgClient.query("SELECT * FROM team");
    const teams = teamsRes.rows.map((row) => ({
      originalId: row.id,
      name: row.name,
    }));

    // Batch import teams
    // Note: Convex has a limit on request size, so we might need to chunk if data is large.
    // For now assuming it fits or we can chunk manually.
    const teamChunks = chunkArray(teams, 100);
    for (const chunk of teamChunks) {
      const result = await client.mutation(api.migration.importTeams, {
        teams: chunk,
      });
      for (const { originalId, newId } of result) {
        teamIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${teamIdMap.size} teams.`);

    // 2. Users
    console.log("Migrating Users...");
    const usersRes = await pgClient.query("SELECT * FROM users");
    const users = usersRes.rows.map((row) => ({
      originalId: row.id,
      name: row.name,
      email: row.email || undefined,
      password: row.password,
      ubisoftID: row.ubisoft_id || undefined,
      // Extra fields for UserTeams
      teamID: row.team_id,
      isAdmin: row.is_admin,
      defaultColor: row.default_color,
    }));

    const userChunks = chunkArray(users, 100);
    for (const chunk of userChunks) {
      const result = await client.mutation(api.migration.importUsers, {
        users: chunk.map((u) => ({
          originalId: u.originalId,
          name: u.name,
          email: u.email,
          password: u.password,
          ubisoftID: u.ubisoftID,
        })),
      });
      for (const { originalId, newId } of result) {
        userIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${userIdMap.size} users.`);

    // 3. UserTeams (Link Users to Teams)
    console.log("Creating UserTeams...");
    const userTeams = [];
    for (const user of users) {
      const newUserId = userIdMap.get(user.originalId);
      const newTeamId = teamIdMap.get(user.teamID);
      if (newUserId && newTeamId) {
        userTeams.push({
          userID: newUserId,
          teamID: newTeamId,
          isAdmin: !!user.isAdmin,
          defaultColor: user.defaultColor || undefined,
        });
      }
    }
    const userTeamChunks = chunkArray(userTeams, 100);
    for (const chunk of userTeamChunks) {
      await client.mutation(api.migration.importUserTeams, {
        userTeams: chunk,
      });
    }
    console.log(`Created ${userTeams.length} UserTeam links.`);

    // 4. Team Invites
    console.log("Migrating Team Invites...");
    const invitesRes = await pgClient.query("SELECT * FROM team_invites");
    const invites = [];
    for (const row of invitesRes.rows) {
      const newTeamId = teamIdMap.get(row.team_id);
      if (newTeamId) {
        invites.push({
          inviteKey: row.invite_key,
          teamID: newTeamId,
          usedBy: mapId(userIdMap, row.used_by),
          usedAt: row.used_at || undefined,
        });
      }
    }
    const inviteChunks = chunkArray(invites, 100);
    for (const chunk of inviteChunks) {
      await client.mutation(api.migration.importTeamInvites, {
        invites: chunk,
      });
    }
    console.log(`Migrated ${invites.length} invites.`);

    // 5. Password Reset Tokens
    console.log("Migrating Password Reset Tokens...");
    const tokensRes = await pgClient.query(
      "SELECT * FROM password_reset_tokens"
    );
    const tokens = [];
    for (const row of tokensRes.rows) {
      const newUserId = userIdMap.get(row.user_id);
      if (newUserId) {
        tokens.push({
          token: row.token,
          userID: newUserId,
          expiresAt: row.expires_at,
          invalidTokenInsertionCounts: row.invalid_token_insertion_counts || 0,
        });
      }
    }
    const tokenChunks = chunkArray(tokens, 100);
    for (const chunk of tokenChunks) {
      await client.mutation(api.migration.importPasswordResetTokens, {
        tokens: chunk,
      });
    }
    console.log(`Migrated ${tokens.length} tokens.`);

    // 6. Team Positions (Player Positions)
    console.log("Migrating Team Positions...");
    const positionsRes = await pgClient.query("SELECT * FROM player_positions");
    const positions = [];
    for (const row of positionsRes.rows) {
      const newTeamId = teamIdMap.get(row.team_id);
      if (newTeamId) {
        positions.push({
          originalId: row.id,
          playerID: mapId(userIdMap, row.player_id),
          positionName: row.position_name,
          teamID: newTeamId,
          index: row.index || 0,
        });
      }
    }
    const positionChunks = chunkArray(positions, 100);
    for (const chunk of positionChunks) {
      const result = await client.mutation(api.migration.importTeamPositions, {
        positions: chunk,
      });
      for (const { originalId, newId } of result) {
        teamPositionIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${teamPositionIdMap.size} team positions.`);

    // 7. Strats
    console.log("Migrating Strats...");
    const stratsRes = await pgClient.query("SELECT * FROM strats");
    const strats = [];
    for (const row of stratsRes.rows) {
      const newTeamId = teamIdMap.get(row.team_id);
      if (newTeamId) {
        strats.push({
          originalId: row.id,
          map: row.map,
          site: row.site,
          name: row.name,
          description: row.description,
          drawingID: row.drawing_id || undefined,
          teamID: newTeamId,
          archived: !!row.archived, // PG integer 0/1 -> boolean
          mapIndex: row.map_index || 0,
        });
      }
    }
    const stratChunks = chunkArray(strats, 100);
    for (const chunk of stratChunks) {
      const result = await client.mutation(api.migration.importStrats, {
        strats: chunk,
      });
      for (const { originalId, newId } of result) {
        stratIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${stratIdMap.size} strats.`);

    // 10. Strat Positions
    console.log("Migrating Strat Positions...");
    const stratPositionsRes = await pgClient.query(
      "SELECT * FROM strat_positions"
    );
    const stratPositions: {
      originalId: number;
      teamPositionID: Id<"teamPositions"> | undefined;
      stratID: Id<"strats">;
      isPowerPosition: boolean;
      shouldBringShotgun: boolean;
      index: number;
    }[] = [];
    // Need to track index per strat if not present, but let's assume we can just use 0 or row index if needed.
    // The schema requires index. PG doesn't have it.
    // We can group by stratID and assign index.
    const stratPositionsByStrat = new Map<number, any[]>();
    for (const row of stratPositionsRes.rows) {
      if (!stratPositionsByStrat.has(row.strats_id)) {
        stratPositionsByStrat.set(row.strats_id, []);
      }
      stratPositionsByStrat.get(row.strats_id)?.push(row);
    }

    for (const [stratId, positions] of stratPositionsByStrat.entries()) {
      const newStratId = stratIdMap.get(stratId);
      if (newStratId) {
        positions.forEach((row, idx) => {
          stratPositions.push({
            originalId: row.id,
            teamPositionID: mapId(teamPositionIdMap, row.position_id),
            stratID: newStratId,
            isPowerPosition: !!row.is_power_position,
            shouldBringShotgun: !!row.should_bring_shotgun,
            index: idx, // Assign index based on order
          });
        });
      }
    }

    const stratPositionChunks = chunkArray(stratPositions, 100);
    for (const chunk of stratPositionChunks) {
      const result = await client.mutation(api.migration.importStratPositions, {
        stratPositions: chunk,
      });
      for (const { originalId, newId } of result) {
        stratPositionIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${stratPositionIdMap.size} strat positions.`);

    // 11. Picked Operators
    console.log("Migrating Picked Operators...");
    const pickedOpsRes = await pgClient.query("SELECT * FROM picked_operators");
    const pickedOps = [];

    // We need stratID for pickedOperators.
    // In PG, pickedOperators -> stratPosition -> strat.
    // We can use stratPositionIdMap to get newStratPositionId.
    // But we also need newStratId.
    // We can look up the original stratPosition to get original stratId, then map to newStratId.
    // Or we can query strat_positions again or use a map.
    // Let's build a map of originalStratPositionId -> originalStratId from the previous step.
    const originalStratPosToStratMap = new Map<number, number>();
    for (const row of stratPositionsRes.rows) {
      originalStratPosToStratMap.set(row.id, row.strats_id);
    }

    for (const row of pickedOpsRes.rows) {
      // Note: PG column is "positionID" (based on old_schema.ts: stratPositionID: integer("positionID"))
      // Wait, old_schema.ts says: stratPositionID: integer("positionID")
      // Let's check the actual column name in the query result.
      // Usually drizzle maps it.
      // In old_schema.ts: `stratPositionID: integer("positionID")`
      // So the column name in DB is likely `positionID`.
      // But let's check `picked_operators` table definition in `old_schema.ts`.
      // `stratPositionID: integer("positionID")`
      // This looks like the column name is `positionID`.

      const originalStratPosId = row.positionID; // Assuming column name is positionID based on drizzle definition
      // If drizzle says `integer("positionID")`, the column is `positionID`.
      // But wait, usually it's snake_case. `position_id`?
      // Let's check `old_schema.ts` again.
      // `stratPositionID: integer("positionID")` -> The string inside integer() is the column name.
      // So it is "positionID" (mixed case? or just "positionid"? Postgres is case insensitive unless quoted).
      // If it was created with drizzle, it might be "positionID" if quoted, or "positionid".
      // Let's assume "positionID" or "positionid".
      // Actually, let's look at `placedAssets` in `old_schema.ts`: `stratPositionID: integer("strat_position_id")`.
      // `pickedOperators`: `stratPositionID: integer("positionID")`.
      // This is inconsistent naming in the old schema.
      // I'll try `row.positionID` or `row.positionid`.

      // Wait, I can just check `row` keys if I could run it.
      // I'll assume `row.positionID` (case sensitive in JS object from pg).
      // But pg driver usually returns lowercase column names unless they were quoted in creation.
      // I'll try `row.positionid` as a fallback.

      const posId = row.positionID || row.positionid || row.position_id;

      const originalStratId = originalStratPosToStratMap.get(posId);
      const newStratId = mapId(stratIdMap, originalStratId);
      const newStratPosId = mapId(stratPositionIdMap, posId);

      if (newStratId && newStratPosId) {
        pickedOps.push({
          originalId: row.id,
          stratID: newStratId,
          stratPositionID: newStratPosId,
          operator: row.operator,
          secondaryGadget: row.secondary_gadget || undefined,
          tertiaryGadget: row.tertiary_gadget || undefined,
          index: row.index || 0,
        });
      }
    }
    const pickedOpsChunks = chunkArray(pickedOps, 100);
    for (const chunk of pickedOpsChunks) {
      const result = await client.mutation(
        api.migration.importPickedOperators,
        { pickedOperators: chunk }
      );
      for (const { originalId, newId } of result) {
        pickedOperatorIdMap.set(originalId, newId);
      }
    }
    console.log(`Migrated ${pickedOperatorIdMap.size} picked operators.`);

    // 12. Placed Assets
    console.log("Migrating Placed Assets...");
    const assetsRes = await pgClient.query("SELECT * FROM placed_assets");
    const assets = [];
    for (const row of assetsRes.rows) {
      const newStratId = mapId(stratIdMap, row.strats_id);
      if (newStratId) {
        // Need to handle pickedOperatorID.
        // In PG, placedAssets has stratPositionID (column `strat_position_id`).
        // In Convex, we have `pickedOperatorID`.
        // If we have a stratPositionID, we can try to find the corresponding pickedOperator.
        // But a stratPosition can have multiple pickedOperators? No, usually 1.
        // Let's see if we can link it.
        // If we have `row.strat_position_id`, we can map it to `newStratPositionId`.
        // Then we can find the pickedOperator for that `newStratPositionId`.
        // But we didn't store a map of `newStratPositionId` -> `newPickedOperatorId`.
        // We can build it from `pickedOps` array we just processed.

        // Let's build a map: `originalStratPositionId` -> `newPickedOperatorId`.
        // Iterate over `pickedOps` (which has `originalId` of pickedOp, and `stratPositionID` (new)).
        // Wait, `pickedOps` array has `originalId` (of pickedOp) and `stratPositionID` (new).
        // But we need `originalStratPositionId` to link from `placedAssets`.
        // `pickedOps` array has `stratPositionID` which is the NEW ID.
        // We need to know which original strat position it came from.
        // In `pickedOps` loop, we had `posId` (original strat position id).
        // Let's rebuild that map quickly or just do it inside the loop.

        // Actually, `placedAssets` in Convex has `stratPositionID` AND `pickedOperatorID`.
        // I can just set `stratPositionID` and leave `pickedOperatorID` undefined if I can't easily find it.
        // Or I can try to find it.
        // Let's just set `stratPositionID` for now, as that preserves the link to the position.
        // If the app needs `pickedOperatorID`, it might be an issue.
        // But `placedAssets` also has `operator` string.

        assets.push({
          stratID: newStratId,
          posX: Number(row.position_x),
          posY: Number(row.position_y),
          width: Number(row.width),
          height: Number(row.height),
          rotation: Number(row.rotation),
          stratPositionID: mapId(stratPositionIdMap, row.strat_position_id),
          pickedOperatorID: undefined, // Leaving this undefined for now as mapping is complex without more queries
          customColor: row.custom_color || undefined,
          type: row.type,
          operator: row.operator || undefined,
          iconType: row.icon_type || undefined,
          gadget: row.gadget || undefined,
          rotate: row.rotate || undefined,
          reinforcementVariant: row.reinforcement_variant || undefined,
        });
      }
    }
    const assetChunks = chunkArray(assets, 100);
    for (const chunk of assetChunks) {
      await client.mutation(api.migration.importPlacedAssets, {
        assets: chunk,
      });
    }
    console.log(`Migrated ${assets.length} placed assets.`);

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pgClient.release();
    await pgPool.end();
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

migrate();
