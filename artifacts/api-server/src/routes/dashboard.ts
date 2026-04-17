import { Router, type IRouter } from "express";
import { eq, gt, sql, desc } from "drizzle-orm";
import { db, usersTable, teamsTable, scrimsTable, violationsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetUpcomingScrimsResponse,
  GetRecentViolationsResponse,
} from "@workspace/api-zod";
import { scrimRegistrationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [
    [totalTeamsRow],
    [totalUsersRow],
    [activeScrimsRow],
    [totalScrimsRow],
    [totalViolRow],
    [activeViolRow],
    topTeam,
    topPlayer,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(teamsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(scrimsTable).where(eq(scrimsTable.status, "ongoing")),
    db.select({ count: sql<number>`count(*)::int` }).from(scrimsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(violationsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(violationsTable).where(eq(violationsTable.status, "active")),
    db.select().from(teamsTable).orderBy(desc(teamsTable.totalPoints)).limit(1),
    db.select().from(usersTable).orderBy(desc(usersTable.totalPoints)).limit(1),
  ]);

  const stats = {
    totalTeams: totalTeamsRow?.count ?? 0,
    totalUsers: totalUsersRow?.count ?? 0,
    activeScrims: activeScrimsRow?.count ?? 0,
    totalScrims: totalScrimsRow?.count ?? 0,
    totalViolations: totalViolRow?.count ?? 0,
    activeViolations: activeViolRow?.count ?? 0,
    topTeam: topTeam[0]?.name ?? null,
    topPlayer: topPlayer[0]?.username ?? null,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/upcoming-scrims", async (req, res): Promise<void> => {
  const now = new Date();
  const scrims = await db
    .select()
    .from(scrimsTable)
    .where(gt(scrimsTable.scheduledAt, now))
    .orderBy(scrimsTable.scheduledAt)
    .limit(5);

  const mapped = await Promise.all(
    scrims.map(async (s) => {
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
    })
  );

  res.json(GetUpcomingScrimsResponse.parse(mapped));
});

router.get("/dashboard/recent-violations", async (req, res): Promise<void> => {
  const violations = await db
    .select()
    .from(violationsTable)
    .orderBy(desc(violationsTable.createdAt))
    .limit(10);

  const mapped = await Promise.all(
    violations.map(async (v) => {
      const team = await db.select().from(teamsTable).where(eq(teamsTable.id, v.teamId)).limit(1);
      const user = v.userId ? await db.select().from(usersTable).where(eq(usersTable.id, v.userId)).limit(1) : [];
      return {
        id: v.id,
        teamId: v.teamId,
        teamName: team[0]?.name ?? null,
        userId: v.userId ?? null,
        username: user[0]?.username ?? null,
        scrimId: v.scrimId ?? null,
        type: v.type,
        description: v.description,
        pointDeduction: v.pointDeduction,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
      };
    })
  );

  res.json(GetRecentViolationsResponse.parse(mapped));
});

export default router;
