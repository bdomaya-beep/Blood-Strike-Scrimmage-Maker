import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scrimsTable } from "./scrims";
import { teamsTable } from "./teams";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  scrimId: integer("scrim_id").notNull().references(() => scrimsTable.id),
  matchNumber: integer("match_number").notNull(),
  mapName: text("map_name").notNull(),
  roundNumber: integer("round_number").notNull().default(1),
  status: text("status", { enum: ["pending", "active", "finished"] }).notNull().default("pending"),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  kills: integer("kills").notNull().default(0),
  placement: integer("placement").notNull().default(1),
  placementPoints: integer("placement_points").notNull().default(0),
  killPoints: integer("kill_points").notNull().default(0),
  violationDeductions: integer("violation_deductions").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
export type Score = typeof scoresTable.$inferSelect;
