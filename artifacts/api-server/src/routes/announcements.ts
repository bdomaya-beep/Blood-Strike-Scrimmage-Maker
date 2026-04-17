import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, announcementsTable, usersTable } from "@workspace/db";
import {
  ListAnnouncementsResponse,
  CreateAnnouncementBody,
  UpdateAnnouncementParams,
  UpdateAnnouncementBody,
  UpdateAnnouncementResponse,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildAnnouncement(a: typeof announcementsTable.$inferSelect) {
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, a.createdBy)).limit(1);
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category,
    isPinned: a.isPinned,
    createdByUsername: creator[0]?.username ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

router.get("/announcements", async (req, res): Promise<void> => {
  const announcements = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));

  const mapped = await Promise.all(announcements.map(buildAnnouncement));
  res.json(ListAnnouncementsResponse.parse(mapped));
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [announcement] = await db.insert(announcementsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    category: parsed.data.category,
    isPinned: parsed.data.isPinned ?? false,
    createdBy: parsed.data.createdBy,
  }).returning();

  const built = await buildAnnouncement(announcement);
  res.status(201).json(built);
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  const params = UpdateAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.content != null) updateData.content = parsed.data.content;
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if (parsed.data.isPinned != null) updateData.isPinned = parsed.data.isPinned;

  const [announcement] = await db
    .update(announcementsTable)
    .set(updateData)
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const built = await buildAnnouncement(announcement);
  res.json(UpdateAnnouncementResponse.parse(built));
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
