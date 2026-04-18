import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, violationsTable, teamsTable, usersTable } from "@workspace/db";
import {
  ListViolationsResponse,
  CreateViolationBody,
  UpdateViolationParams,
  UpdateViolationBody,
  UpdateViolationResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "./_auth";

const router: IRouter = Router();

async function buildViolation(v: typeof violationsTable.$inferSelect) {
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
}

router.get("/violations", async (req, res): Promise<void> => {
  const violations = await db.select().from(violationsTable).orderBy(violationsTable.createdAt);
  const mapped = await Promise.all(violations.map(buildViolation));
  res.json(ListViolationsResponse.parse(mapped.reverse()));
});

router.post("/violations", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const parsed = CreateViolationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [violation] = await db.insert(violationsTable).values({
    teamId: parsed.data.teamId,
    userId: parsed.data.userId,
    scrimId: parsed.data.scrimId,
    type: parsed.data.type,
    description: parsed.data.description,
    pointDeduction: parsed.data.pointDeduction,
  }).returning();

  if (parsed.data.pointDeduction > 0) {
    const { sql } = await import("drizzle-orm");
    await db
      .update(teamsTable)
      .set({ totalPoints: sql`${teamsTable.totalPoints} - ${parsed.data.pointDeduction}` })
      .where(eq(teamsTable.id, parsed.data.teamId));
  }

  const built = await buildViolation(violation);
  res.status(201).json(built);
});

router.patch("/violations/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = UpdateViolationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateViolationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.pointDeduction != null) updateData.pointDeduction = parsed.data.pointDeduction;

  const [violation] = await db.update(violationsTable).set(updateData).where(eq(violationsTable.id, params.data.id)).returning();
  if (!violation) {
    res.status(404).json({ error: "Violation not found" });
    return;
  }

  const built = await buildViolation(violation);
  res.json(UpdateViolationResponse.parse(built));
});

export default router;
