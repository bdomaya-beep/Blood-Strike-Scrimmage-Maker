import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersResponse,
  CreateUserBody,
  LoginUserBody,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  GetCurrentUserResponse,
  LoginUserResponse,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();
let adminLock = false;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "blood-strike-salt").digest("hex");
}

router.get("/users", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const mapped = users.map((u) => ({
    id: u.id,
    username: u.username,
    bloodStrikeId: u.bloodStrikeId,
    role: u.role,
    isBanned: u.isBanned,
    banExpiresAt: u.banExpiresAt ? u.banExpiresAt.toISOString() : null,
    totalKills: u.totalKills,
    totalWins: u.totalWins,
    totalPoints: u.totalPoints,
    createdAt: u.createdAt.toISOString(),
  }));
  res.json(ListUsersResponse.parse(mapped));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password, bloodStrikeId, role } = parsed.data;

  if (role === "admin") {
    const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    if (existingAdmin.length > 0 || adminLock) {
      res.status(400).json({ error: "Only one admin account is allowed" });
      return;
    }
    adminLock = true;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username,
    passwordHash: hashPassword(password),
    bloodStrikeId,
    role,
  }).returning();

  const mapped = {
    id: user.id,
    username: user.username,
    bloodStrikeId: user.bloodStrikeId,
    role: user.role,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
    totalKills: user.totalKills,
    totalWins: user.totalWins,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt.toISOString(),
  };

  req.log.info({ userId: user.id }, "User created");
  res.status(201).json(GetUserResponse.parse(mapped));
});

router.post("/users/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.cookie("userId", String(user.id), {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });

  const mapped = {
    id: user.id,
    username: user.username,
    bloodStrikeId: user.bloodStrikeId,
    role: user.role,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
    totalKills: user.totalKills,
    totalWins: user.totalWins,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt.toISOString(),
  };

  res.json(LoginUserResponse.parse(mapped));
});

router.get("/users/me", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const id = parseInt(userId, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const mapped = {
    id: user.id,
    username: user.username,
    bloodStrikeId: user.bloodStrikeId,
    role: user.role,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
    totalKills: user.totalKills,
    totalWins: user.totalWins,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt.toISOString(),
  };

  res.json(GetCurrentUserResponse.parse(mapped));
});

router.post("/users/logout", async (req, res): Promise<void> => {
  res.clearCookie("userId");
  res.json({ success: true });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const mapped = {
    id: user.id,
    username: user.username,
    bloodStrikeId: user.bloodStrikeId,
    role: user.role,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
    totalKills: user.totalKills,
    totalWins: user.totalWins,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt.toISOString(),
  };

  res.json(GetUserResponse.parse(mapped));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.username != null) updateData.username = parsed.data.username;
  if (parsed.data.bloodStrikeId != null) updateData.bloodStrikeId = parsed.data.bloodStrikeId;
  if (parsed.data.role != null) updateData.role = parsed.data.role;
  if (parsed.data.isBanned != null) updateData.isBanned = parsed.data.isBanned;
  if (parsed.data.banExpiresAt != null) updateData.banExpiresAt = new Date(parsed.data.banExpiresAt);

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const mapped = {
    id: user.id,
    username: user.username,
    bloodStrikeId: user.bloodStrikeId,
    role: user.role,
    isBanned: user.isBanned,
    banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
    totalKills: user.totalKills,
    totalWins: user.totalWins,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt.toISOString(),
  };

  res.json(UpdateUserResponse.parse(mapped));
});

export default router;
