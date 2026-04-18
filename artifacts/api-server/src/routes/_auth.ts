import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

type UserRow = typeof usersTable.$inferSelect;

export async function getCurrentSessionUser(req: Request): Promise<UserRow | null> {
  const rawUserId = req.cookies?.userId;
  if (!rawUserId) return null;

  const userId = Number.parseInt(rawUserId, 10);
  if (!Number.isFinite(userId)) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}

export async function requireAuth(req: Request, res: Response): Promise<UserRow | null> {
  const user = await getCurrentSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return user;
}

export async function requireAdmin(req: Request, res: Response): Promise<UserRow | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return user;
}
