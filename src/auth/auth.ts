"use server";
import { eq } from "drizzle-orm";
import db from "../db/db";
import { passwordResetTokens, teamInvites, users } from "../db/schema";
import * as bcrypt from "bcrypt-ts";
import { cookies } from "next/headers";
import { generateJWT } from "./jwt";
import { getPayload } from "./getPayload";
import { DEFAULT_COLORS } from "../static/colors";
import { generate } from "random-words";
import { sendResetEmail } from "../mail/mail";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function resetJWT(payload?: JWTPayload) {
  if (!payload) {
    const userid = (await getPayload())?.id;
    if (!userid) throw new Error("User not found");
    const [user] = await db.select().from(users).where(eq(users.id, userid));
    if (!user) throw new Error("User not found");
    payload = {
      id: user.id,
      isAdmin: user.isAdmin,
      name: user.name,
      teamID: user.teamID,
    };
  }
  if (!payload) throw new Error("User not found");

  const cookie = await cookies();
  cookie.set("jwt", await generateJWT(payload), {
    httpOnly: true,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  });
}

export async function login(name: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.name, name));

  if (!user) return null;

  // hash password and compare with db password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  await resetJWT(user);

  return user;
}

export async function register(
  name: string,
  password: string,
  invite_key: string
) {
  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.inviteKey, invite_key));
  if (!invite || invite.usedAt) throw new Error("Invalid invite key");

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.name, name));
  if (existingUser) throw new Error("Username already taken");

  const hash = await hashPassword(password);
  const [{ id }] = await db
    .insert(users)
    .values({
      name,
      password: hash,
      createdAt: new Date().toISOString(),
      teamID: invite.teamID,
      isAdmin: false,
      defaultColor: DEFAULT_COLORS.at(-1),
    })
    .returning({ id: users.id });
  await db
    .update(teamInvites)
    .set({
      usedBy: id,
      usedAt: new Date().toISOString(),
    })
    .where(eq(teamInvites.inviteKey, invite_key));
  return id as number;
}

export async function logout() {
  (await cookies()).delete("jwt");
  return true;
}

export async function checkPassword(password: string) {
  const userid = (await getPayload())?.id;
  if (!userid) throw new Error("User not found");
  const [user] = await db.select().from(users).where(eq(users.id, userid));
  if (!user) throw new Error("User not found");
  const valid = await bcrypt.compare(password, user.password);
  return valid;
}

export async function requestResetPassword(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return true;

  const token = generate({ exactly: 5, join: "-" });
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  await db.insert(passwordResetTokens).values({
    token,
    userID: user.id,
    expiresAt,
  });

  // Send email with reset link
  await sendResetEmail(email, token);

  return true;
}

const MAX_TOKEN_TRIES = 10;
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
) {
  // check if email exists
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return true;

  // check if token is valid
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetToken) {
    // if no valid token, check if someone might try to brute force the token and delete token after MAX_TOKEN_TRIES
    const [validToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userID, user.id))
      .limit(1);
    if (validToken) {
      const invalidTokenInsertionCounts =
        validToken.invalidTokenInsertionCounts + 1;
      if (invalidTokenInsertionCounts >= MAX_TOKEN_TRIES) {
        console.warn(
          "Deleting password reset token due to max tries exceeded for userID:",
          user.id
        );
        await db
          .delete(passwordResetTokens)
          .where(eq(passwordResetTokens.token, validToken.token));
      }
    }
    throw new Error("Invalid or expired reset token");
  }
  if (resetToken.expiresAt < new Date().toISOString())
    throw new Error("Invalid or expired reset token");

  const hashedPassword = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, resetToken.userID));

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.token, resetToken.token));

  return true;
}
