import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, teamsTable, teamMembersTable, usersTable } from "@workspace/db";
import {
  ListTeamsResponse,
  CreateTeamBody,
  GetTeamParams,
  GetTeamResponse,
  UpdateTeamParams,
  UpdateTeamBody,
  UpdateTeamResponse,
  DeleteTeamParams,
  GetTeamMembersParams,
  GetTeamMembersResponse,
  InviteTeamMemberParams,
  InviteTeamMemberBody,
  AcceptTeamInviteParams,
  AcceptTeamInviteResponse,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildTeam(t: typeof teamsTable.$inferSelect) {
  const captain = await db.select().from(usersTable).where(eq(usersTable.id, t.captainId)).limit(1);
  const memberCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, t.id));
  return {
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl ?? null,
    description: t.description ?? null,
    captainId: t.captainId,
    captainUsername: captain[0]?.username ?? null,
    totalPoints: t.totalPoints,
    totalKills: t.totalKills,
    totalWins: t.totalWins,
    memberCount: memberCountResult[0]?.count ?? 0,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/teams", async (req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.totalPoints);
  const mapped = await Promise.all(teams.map(buildTeam));
  res.json(ListTeamsResponse.parse(mapped.reverse()));
});

router.post("/teams", async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.insert(teamsTable).values({
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl,
    description: parsed.data.description,
    captainId: parsed.data.captainId,
  }).returning();

  await db.insert(teamMembersTable).values({
    teamId: team.id,
    userId: parsed.data.captainId,
    status: "accepted",
  });

  const built = await buildTeam(team);
  res.status(201).json(GetTeamResponse.parse(built));
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const built = await buildTeam(team);
  res.json(GetTeamResponse.parse(built));
});

router.patch("/teams/:id", async (req, res): Promise<void> => {
  const params = UpdateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.logoUrl != null) updateData.logoUrl = parsed.data.logoUrl;
  if (parsed.data.description != null) updateData.description = parsed.data.description;

  const [team] = await db.update(teamsTable).set(updateData).where(eq(teamsTable.id, params.data.id)).returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const built = await buildTeam(team);
  res.json(UpdateTeamResponse.parse(built));
});

router.patch("/teams/:id/captain", async (req, res): Promise<void> => {
  const teamId = parseInt(req.params.id);
  if (isNaN(teamId)) { res.status(400).json({ error: "Invalid team id" }); return; }

  const { captainId } = req.body;
  if (typeof captainId !== "number") { res.status(400).json({ error: "captainId required" }); return; }

  const [team] = await db.update(teamsTable).set({ captainId }).where(eq(teamsTable.id, teamId)).returning();
  if (!team) { res.status(404).json({ error: "Team not found" }); return; }

  const built = await buildTeam(team);
  res.json(built);
});

router.delete("/teams/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(teamsTable).where(eq(teamsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/teams/:id/members", async (req, res): Promise<void> => {
  const params = GetTeamMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db
    .select({
      id: teamMembersTable.id,
      teamId: teamMembersTable.teamId,
      userId: teamMembersTable.userId,
      username: usersTable.username,
      bloodStrikeId: usersTable.bloodStrikeId,
      status: teamMembersTable.status,
      joinedAt: teamMembersTable.joinedAt,
    })
    .from(teamMembersTable)
    .leftJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .where(eq(teamMembersTable.teamId, params.data.id));

  const mapped = members.map((m) => ({
    id: m.id,
    teamId: m.teamId,
    userId: m.userId,
    username: m.username ?? null,
    bloodStrikeId: m.bloodStrikeId ?? null,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
  }));

  res.json(GetTeamMembersResponse.parse(mapped));
});

router.post("/teams/:id/members", async (req, res): Promise<void> => {
  const params = InviteTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.insert(teamMembersTable).values({
    teamId: params.data.id,
    userId: parsed.data.userId,
    status: "pending",
  }).returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.id, member.userId)).limit(1);

  const mapped = {
    id: member.id,
    teamId: member.teamId,
    userId: member.userId,
    username: user[0]?.username ?? null,
    bloodStrikeId: user[0]?.bloodStrikeId ?? null,
    status: member.status,
    joinedAt: member.joinedAt.toISOString(),
  };

  res.status(201).json(mapped);
});

router.post("/teams/:id/members/:userId/accept", async (req, res): Promise<void> => {
  const params = AcceptTeamInviteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db
    .update(teamMembersTable)
    .set({ status: "accepted" })
    .where(eq(teamMembersTable.userId, params.data.userId))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, member.userId)).limit(1);

  const mapped = {
    id: member.id,
    teamId: member.teamId,
    userId: member.userId,
    username: user[0]?.username ?? null,
    bloodStrikeId: user[0]?.bloodStrikeId ?? null,
    status: member.status,
    joinedAt: member.joinedAt.toISOString(),
  };

  res.json(AcceptTeamInviteResponse.parse(mapped));
});

router.delete("/teams/:id/members/:userId", async (req, res): Promise<void> => {
  const params = RemoveTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(teamMembersTable)
    .where(eq(teamMembersTable.userId, params.data.userId));

  res.sendStatus(204);
});

export default router;
