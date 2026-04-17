import { Router, type IRouter } from "express";
import { eq, gt, sql } from "drizzle-orm";
import { db, scrimsTable, scrimRegistrationsTable, teamsTable, usersTable } from "@workspace/db";
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
    registeredTeams: regCount[0]?.count ?? 0,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/scrims", async (req, res): Promise<void> => {
  const scrims = await db.select().from(scrimsTable).orderBy(scrimsTable.scheduledAt);
  const mapped = await Promise.all(scrims.map(buildScrim));
  res.json(ListScrimsResponse.parse(mapped));
});

router.post("/scrims", async (req, res): Promise<void> => {
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
    maps: parsed.data.maps ?? [],
    totalRounds: parsed.data.totalRounds,
    flyTimeSeconds: parsed.data.flyTimeSeconds,
    weaponBans: parsed.data.weaponBans ?? [],
    itemBans: parsed.data.itemBans ?? [],
    rules: parsed.data.rules,
    createdBy: parsed.data.createdBy,
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

export default router;
