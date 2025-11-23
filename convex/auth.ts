import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

interface User {
  id: number;
  teamID: number;
}

export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx
): Promise<User>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  allowNull: true
): Promise<User | null>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  allowNull: false
): Promise<User>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  allowNull = false
): Promise<User | null> {
  const user = await ctx.auth.getUserIdentity();
  if (allowNull && !user) {
    return null;
  }
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (
    !("id" in user) ||
    !("teamID" in user) ||
    typeof user.id !== "number" ||
    typeof user.teamID !== "number"
  ) {
    throw new Error("Malformed user object");
  }
  return {
    id: user.id,
    teamID: user.teamID,
  };
}
