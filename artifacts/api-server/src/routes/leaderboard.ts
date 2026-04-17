import { Router, type IRouter } from "express";
import { desc, sql, eq } from "drizzle-orm";
import { db, teamsTable, usersTable, teamMembersTable } from "@workspace/db";
import {
  GetTeamLeaderboardResponse,
  GetPlayerLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard/teams", async (req, res): Promise<void> => {
  const teams = await db
    .select()
    .from(teamsTable)
    .orderBy(desc(teamsTable.totalPoints))
    .limit(50);

  const scrimsPlayed = 0;

  const mapped = teams.map((t, i) => ({
    rank: i + 1,
    teamId: t.id,
    teamName: t.name,
    totalPoints: t.totalPoints,
    totalKills: t.totalKills,
    totalWins: t.totalWins,
    scrimsPlayed,
  }));

  res.json(GetTeamLeaderboardResponse.parse(mapped));
});

router.get("/leaderboard/players", async (req, res): Promise<void> => {
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.totalPoints))
    .limit(50);

  const mapped = await Promise.all(
    users.map(async (u, i) => {
      const membership = await db
        .select({ teamName: teamsTable.name })
        .from(teamMembersTable)
        .leftJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
        .where(eq(teamMembersTable.userId, u.id))
        .limit(1);

      return {
        rank: i + 1,
        userId: u.id,
        username: u.username,
        bloodStrikeId: u.bloodStrikeId,
        totalPoints: u.totalPoints,
        totalKills: u.totalKills,
        totalWins: u.totalWins,
        teamName: membership[0]?.teamName ?? null,
      };
    })
  );

  res.json(GetPlayerLeaderboardResponse.parse(mapped));
});

export default router;
