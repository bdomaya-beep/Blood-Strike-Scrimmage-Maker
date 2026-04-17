import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";
import { scrimsTable } from "./scrims";

export const violationsTable = pgTable("violations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  scrimId: integer("scrim_id").references(() => scrimsTable.id),
  type: text("type", { enum: ["no_show", "rule_breaking", "banned_weapon", "other"] }).notNull(),
  description: text("description").notNull(),
  pointDeduction: integer("point_deduction").notNull().default(0),
  status: text("status", { enum: ["active", "resolved"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertViolationSchema = createInsertSchema(violationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violationsTable.$inferSelect;
