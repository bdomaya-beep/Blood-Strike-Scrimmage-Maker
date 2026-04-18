import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, scrimsTable, scrimRegistrationsTable, scrimLineupsTable, teamsTable, usersTable, teamMembersTable } from "@workspace/db";
import {
  ListScrimsResponse,
  CreateScrimBody,
  GetScrimParams,
  GetScrimResponse,
  UpdateScrimParams,
  UpdateScrimBody,
  UpdateScrimResponse,
  DeleteScrimParams,
  RegisterTeamToScrimParams,
  RegisterTeamToScrimBody,
  GetScrimRegistrationsParams,
  GetScrimRegistrationsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "./_auth";
const router: IRouter = Router();

async function buildScrim(s: typeof scrimsTable.$inferSelect) {
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, s.createdBy)).limit(1);
  const regCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scrimRegistrationsTable)
    .where(eq(scrimRegistrationsTable.scrimId, s.id));
  return {
    id: s.id,
    name: s.name,
    scheduledAt: s.scheduledAt.toISOString(),
    maxTeams: s.maxTeams,
    bracketType: s.bracketType,
    status: s.status,
    maps: s.maps ?? [],
    totalRounds: s.totalRounds,
    flyTimeSeconds: s.flyTimeSeconds,
    weaponBans: s.weaponBans ?? [],
    itemBans: s.itemBans ?? [],
    rules: s.rules ?? null,
    createdByUsername: creator[0]?.username ?? null,
    approvedByUsername: s.approvedBy
      ? (await db.select().from(usersTable).where(eq(usersTable.id, s.approvedBy)).limit(1))[0]?.username ?? null
      : null,
    approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
    registeredTeams: regCount[0]?.count ?? 0,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/scrims", async (req, res): Promise<void> => {
  const all = req.query.all === "true";
  const scrims = all
    ? await db.select().from(scrimsTable).orderBy(scrimsTable.scheduledAt)
    : await db.select().from(scrimsTable).where(eq(scrimsTable.status, "open")).orderBy(scrimsTable.scheduledAt);
  const mapped = await Promise.all(scrims.map(buildScrim));
  res.json(ListScrimsResponse.parse(mapped));
});

router.post("/scrims", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const parsed = CreateScrimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [scrim] = await db.insert(scrimsTable).values({
    name: parsed.data.name,
    scheduledAt: new Date(parsed.data.scheduledAt),
    maxTeams: parsed.data.maxTeams,
    bracketType: parsed.data.bracketType,
    status: "pending",
    maps: parsed.data.maps ?? [],
    totalRounds: parsed.data.totalRounds,
    flyTimeSeconds: parsed.data.flyTimeSeconds,
    weaponBans: parsed.data.weaponBans ?? [],
    itemBans: parsed.data.itemBans ?? [],
    rules: parsed.data.rules,
    createdBy: parsed.data.createdBy,
    approvedBy: null,
    approvedAt: null,
  }).returning();

  const built = await buildScrim(scrim);
  res.status(201).json(GetScrimResponse.parse(built));
});

router.get("/scrims/:id", async (req, res): Promise<void> => {
  const params = GetScrimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scrim] = await db.select().from(scrimsTable).where(eq(scrimsTable.id, params.data.id));
  if (!scrim) {
    res.status(404).json({ error: "Scrim not found" });
    return;
  }

  const built = await buildScrim(scrim);
  res.json(GetScrimResponse.parse(built));
});

router.patch("/scrims/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = UpdateScrimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScrimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.scheduledAt != null) updateData.scheduledAt = new Date(parsed.data.scheduledAt);
  if (parsed.data.maxTeams != null) updateData.maxTeams = parsed.data.maxTeams;
  if (parsed.data.bracketType != null) updateData.bracketType = parsed.data.bracketType;
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.maps != null) updateData.maps = parsed.data.maps;
  if (parsed.data.totalRounds != null) updateData.totalRounds = parsed.data.totalRounds;
  if (parsed.data.flyTimeSeconds != null) updateData.flyTimeSeconds = parsed.data.flyTimeSeconds;
  if (parsed.data.weaponBans != null) updateData.weaponBans = parsed.data.weaponBans;
  if (parsed.data.itemBans != null) updateData.itemBans = parsed.data.itemBans;
  if (parsed.data.rules != null) updateData.rules = parsed.data.rules;

  const [scrim] = await db.update(scrimsTable).set(updateData).where(eq(scrimsTable.id, params.data.id)).returning();
  if (!scrim) {
    res.status(404).json({ error: "Scrim not found" });
    return;
  }

  const built = await buildScrim(scrim);
  res.json(UpdateScrimResponse.parse(built));
});

router.delete("/scrims/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = DeleteScrimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(scrimsTable).where(eq(scrimsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/scrims/:id/register", async (req, res): Promise<void> => {
  const params = RegisterTeamToScrimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RegisterTeamToScrimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(scrimRegistrationsTable)
    .where(and(eq(scrimRegistrationsTable.scrimId, params.data.id), eq(scrimRegistrationsTable.teamId, parsed.data.teamId)));
  if (existing.length > 0) {
    res.status(400).json({ error: "Team already registered for this scrim" });
    return;
  }

  const [reg] = await db.insert(scrimRegistrationsTable).values({
    scrimId: params.data.id,
    teamId: parsed.data.teamId,
  }).returning();

  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, reg.teamId)).limit(1);

  const mapped = {
    id: reg.id,
    scrimId: reg.scrimId,
    teamId: reg.teamId,
    teamName: team[0]?.name ?? null,
    registeredAt: reg.registeredAt.toISOString(),
  };

  res.status(201).json(mapped);
});

router.get("/scrims/:id/registrations", async (req, res): Promise<void> => {
  const params = GetScrimRegistrationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const regs = await db
    .select({
      id: scrimRegistrationsTable.id,
      scrimId: scrimRegistrationsTable.scrimId,
      teamId: scrimRegistrationsTable.teamId,
      teamName: teamsTable.name,
      registeredAt: scrimRegistrationsTable.registeredAt,
    })
    .from(scrimRegistrationsTable)
    .leftJoin(teamsTable, eq(scrimRegistrationsTable.teamId, teamsTable.id))
    .where(eq(scrimRegistrationsTable.scrimId, params.data.id));

  const mapped = regs.map((r) => ({
    id: r.id,
    scrimId: r.scrimId,
    teamId: r.teamId,
    teamName: r.teamName ?? null,
    registeredAt: r.registeredAt.toISOString(),
  }));

  res.json(GetScrimRegistrationsResponse.parse(mapped));
});

router.get("/scrims/:id/lineups", async (req, res): Promise<void> => {
  const scrimId = parseInt(req.params.id);
  if (isNaN(scrimId)) { res.status(400).json({ error: "Invalid scrim id" }); return; }

  const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : null;

  let query = db
    .select({
      id: scrimLineupsTable.id,
      scrimId: scrimLineupsTable.scrimId,
      teamId: scrimLineupsTable.teamId,
      teamName: teamsTable.name,
      userId: scrimLineupsTable.userId,
      username: usersTable.username,
      ign: scrimLineupsTable.ign,
      uid: scrimLineupsTable.uid,
      designation: scrimLineupsTable.designation,
      createdAt: scrimLineupsTable.createdAt,
    })
    .from(scrimLineupsTable)
    .leftJoin(teamsTable, eq(scrimLineupsTable.teamId, teamsTable.id))
    .leftJoin(usersTable, eq(scrimLineupsTable.userId, usersTable.id))
    .$dynamic();

  if (teamId) {
    query = query.where(and(eq(scrimLineupsTable.scrimId, scrimId), eq(scrimLineupsTable.teamId, teamId)));
  } else {
    query = query.where(eq(scrimLineupsTable.scrimId, scrimId));
  }

  const rows = await query;
  const mapped = rows.map(r => ({
    id: r.id,
    scrimId: r.scrimId,
    teamId: r.teamId,
    teamName: r.teamName ?? null,
    userId: r.userId ?? null,
    username: r.username ?? null,
    ign: r.ign,
    uid: r.uid,
    designation: r.designation,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(mapped);
});

router.post("/scrims/:id/lineups", async (req, res): Promise<void> => {
  const scrimId = parseInt(req.params.id);
  if (isNaN(scrimId)) { res.status(400).json({ error: "Invalid scrim id" }); return; }

  const { teamId, players } = req.body;
  if (typeof teamId !== "number" || !Array.isArray(players)) {
    res.status(400).json({ error: "teamId (number) and players (array) are required" });
    return;
  }

  const validPlayers = players.filter((p: any) => typeof p.ign === "string" && p.ign.trim() && typeof p.uid === "string" && p.uid.trim());

  await db.delete(scrimLineupsTable).where(
    and(eq(scrimLineupsTable.scrimId, scrimId), eq(scrimLineupsTable.teamId, teamId))
  );

  const insertValues = validPlayers.map((p: any) => ({
    scrimId,
    teamId,
    userId: typeof p.userId === "number" ? p.userId : null,
    ign: p.ign.trim(),
    uid: p.uid.trim(),
    designation: p.designation === "sub" ? "sub" as const : "main" as const,
  }));

  if (insertValues.length > 0) {
    await db.insert(scrimLineupsTable).values(insertValues);
  }

  res.status(201).json({ success: true, count: insertValues.length });
});

router.delete("/scrims/:id/lineups/:teamId", async (req, res): Promise<void> => {
  const scrimId = parseInt(req.params.id);
  const teamId = parseInt(req.params.teamId);
  if (isNaN(scrimId) || isNaN(teamId)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(scrimLineupsTable).where(
    and(eq(scrimLineupsTable.scrimId, scrimId), eq(scrimLineupsTable.teamId, teamId))
  );

  res.sendStatus(204);
});

export default router;
