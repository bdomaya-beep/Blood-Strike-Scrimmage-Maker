import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, matchesTable, scoresTable, teamsTable, violationsTable } from "@workspace/db";
import {
  GetScrimMatchesParams,
  GetScrimMatchesResponse,
  CreateMatchParams,
  CreateMatchBody,
  GetMatchParams,
  GetMatchResponse,
  UpdateMatchParams,
  UpdateMatchBody,
  UpdateMatchResponse,
  GetMatchScoresParams,
  GetMatchScoresResponse,
  SubmitScoreParams,
  SubmitScoreBody,
  GetScrimScoreboardParams,
  GetScrimScoreboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calcPlacementPoints(placement: number): number {
  if (placement === 1) return 15;
  if (placement === 2) return 12;
  if (placement === 3) return 10;
  if (placement <= 5) return 7;
  if (placement <= 10) return 4;
  return 2;
}

router.get("/scrims/:id/matches", async (req, res): Promise<void> => {
  const params = GetScrimMatchesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.scrimId, params.data.id))
    .orderBy(matchesTable.matchNumber);

  const mapped = matches.map((m) => ({
    id: m.id,
    scrimId: m.scrimId,
    matchNumber: m.matchNumber,
    mapName: m.mapName,
    roundNumber: m.roundNumber,
    status: m.status,
    startTime: m.startTime ? m.startTime.toISOString() : null,
    endTime: m.endTime ? m.endTime.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  }));

  res.json(GetScrimMatchesResponse.parse(mapped));
});

router.post("/scrims/:id/matches", async (req, res): Promise<void> => {
  const params = CreateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [match] = await db.insert(matchesTable).values({
    scrimId: params.data.id,
    matchNumber: parsed.data.matchNumber,
    mapName: parsed.data.mapName,
    roundNumber: parsed.data.roundNumber,
  }).returning();

  const mapped = {
    id: match.id,
    scrimId: match.scrimId,
    matchNumber: match.matchNumber,
    mapName: match.mapName,
    roundNumber: match.roundNumber,
    status: match.status,
    startTime: match.startTime ? match.startTime.toISOString() : null,
    endTime: match.endTime ? match.endTime.toISOString() : null,
    createdAt: match.createdAt.toISOString(),
  };

  res.status(201).json(mapped);
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const mapped = {
    id: match.id,
    scrimId: match.scrimId,
    matchNumber: match.matchNumber,
    mapName: match.mapName,
    roundNumber: match.roundNumber,
    status: match.status,
    startTime: match.startTime ? match.startTime.toISOString() : null,
    endTime: match.endTime ? match.endTime.toISOString() : null,
    createdAt: match.createdAt.toISOString(),
  };

  res.json(GetMatchResponse.parse(mapped));
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.startTime != null) updateData.startTime = new Date(parsed.data.startTime);
  if (parsed.data.endTime != null) updateData.endTime = new Date(parsed.data.endTime);

  const [match] = await db.update(matchesTable).set(updateData).where(eq(matchesTable.id, params.data.id)).returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const mapped = {
    id: match.id,
    scrimId: match.scrimId,
    matchNumber: match.matchNumber,
    mapName: match.mapName,
    roundNumber: match.roundNumber,
    status: match.status,
    startTime: match.startTime ? match.startTime.toISOString() : null,
    endTime: match.endTime ? match.endTime.toISOString() : null,
    createdAt: match.createdAt.toISOString(),
  };

  res.json(UpdateMatchResponse.parse(mapped));
});

router.get("/matches/:id/scores", async (req, res): Promise<void> => {
  const params = GetMatchScoresParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const scores = await db
    .select({
      id: scoresTable.id,
      matchId: scoresTable.matchId,
      teamId: scoresTable.teamId,
      teamName: teamsTable.name,
      kills: scoresTable.kills,
      placement: scoresTable.placement,
      placementPoints: scoresTable.placementPoints,
      killPoints: scoresTable.killPoints,
      violationDeductions: scoresTable.violationDeductions,
      totalPoints: scoresTable.totalPoints,
      createdAt: scoresTable.createdAt,
    })
    .from(scoresTable)
    .leftJoin(teamsTable, eq(scoresTable.teamId, teamsTable.id))
    .where(eq(scoresTable.matchId, params.data.id))
    .orderBy(scoresTable.totalPoints);

  const mapped = scores.map((s) => ({
    id: s.id,
    matchId: s.matchId,
    teamId: s.teamId,
    teamName: s.teamName ?? null,
    kills: s.kills,
    placement: s.placement,
    placementPoints: s.placementPoints,
    killPoints: s.killPoints,
    violationDeductions: s.violationDeductions,
    totalPoints: s.totalPoints,
    createdAt: s.createdAt.toISOString(),
  }));

  res.json(GetMatchScoresResponse.parse(mapped.reverse()));
});

router.post("/matches/:id/scores", async (req, res): Promise<void> => {
  const params = SubmitScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const killPoints = parsed.data.kills * 2;
  const placementPoints = calcPlacementPoints(parsed.data.placement);
  const totalPoints = killPoints + placementPoints;

  const [score] = await db.insert(scoresTable).values({
    matchId: params.data.id,
    teamId: parsed.data.teamId,
    kills: parsed.data.kills,
    placement: parsed.data.placement,
    placementPoints,
    killPoints,
    violationDeductions: 0,
    totalPoints,
  }).returning();

  await db
    .update(teamsTable)
    .set({
      totalKills: sql`${teamsTable.totalKills} + ${parsed.data.kills}`,
      totalPoints: sql`${teamsTable.totalPoints} + ${totalPoints}`,
      totalWins: parsed.data.placement === 1 ? sql`${teamsTable.totalWins} + 1` : teamsTable.totalWins,
    })
    .where(eq(teamsTable.id, parsed.data.teamId));

  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, score.teamId)).limit(1);

  const mapped = {
    id: score.id,
    matchId: score.matchId,
    teamId: score.teamId,
    teamName: team[0]?.name ?? null,
    kills: score.kills,
    placement: score.placement,
    placementPoints: score.placementPoints,
    killPoints: score.killPoints,
    violationDeductions: score.violationDeductions,
    totalPoints: score.totalPoints,
    createdAt: score.createdAt.toISOString(),
  };

  res.status(201).json(mapped);
});

router.get("/scrims/:id/scoreboard", async (req, res): Promise<void> => {
  const params = GetScrimScoreboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const matches = await db.select().from(matchesTable).where(eq(matchesTable.scrimId, params.data.id));
  const matchIds = matches.map((m) => m.id);

  if (matchIds.length === 0) {
    res.json(GetScrimScoreboardResponse.parse([]));
    return;
  }

  const scoreRows = await db
    .select({
      teamId: scoresTable.teamId,
      teamName: teamsTable.name,
      totalKills: sql<number>`sum(${scoresTable.kills})::int`,
      totalPoints: sql<number>`sum(${scoresTable.totalPoints})::int`,
      matchesPlayed: sql<number>`count(*)::int`,
    })
    .from(scoresTable)
    .leftJoin(teamsTable, eq(scoresTable.teamId, teamsTable.id))
    .groupBy(scoresTable.teamId, teamsTable.name)
    .orderBy(sql`sum(${scoresTable.totalPoints}) desc`);

  const violCounts = await db
    .select({
      teamId: violationsTable.teamId,
      violations: sql<number>`count(*)::int`,
    })
    .from(violationsTable)
    .where(eq(violationsTable.status, "active"))
    .groupBy(violationsTable.teamId);

  const violMap = new Map(violCounts.map((v) => [v.teamId, v.violations]));

  const mapped = scoreRows.map((s, i) => ({
    rank: i + 1,
    teamId: s.teamId,
    teamName: s.teamName ?? "Unknown",
    totalKills: s.totalKills ?? 0,
    totalPoints: s.totalPoints ?? 0,
    matchesPlayed: s.matchesPlayed ?? 0,
    violations: violMap.get(s.teamId) ?? 0,
  }));

  res.json(GetScrimScoreboardResponse.parse(mapped));
});

export default router;
