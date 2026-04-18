import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { teamsTable } from "./teams";

export const scrimsTable = pgTable("scrims", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  maxTeams: integer("max_teams").notNull().default(16),
  bracketType: text("bracket_type", { enum: ["low", "high"] }).notNull().default("low"),
  status: text("status", { enum: ["open", "ongoing", "finished"] }).notNull().default("open"),
  maps: text("maps").array().notNull().default([]),
  totalRounds: integer("total_rounds").notNull().default(3),
  flyTimeSeconds: integer("fly_time_seconds").notNull().default(120),
  weaponBans: text("weapon_bans").array().notNull().default([]),
  itemBans: text("item_bans").array().notNull().default([]),
  rules: text("rules"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const scrimRegistrationsTable = pgTable("scrim_registrations", {
  id: serial("id").primaryKey(),
  scrimId: integer("scrim_id").notNull().references(() => scrimsTable.id),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScrimSchema = createInsertSchema(scrimsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScrim = z.infer<typeof insertScrimSchema>;
export type Scrim = typeof scrimsTable.$inferSelect;
export type ScrimRegistration = typeof scrimRegistrationsTable.$inferSelect;
