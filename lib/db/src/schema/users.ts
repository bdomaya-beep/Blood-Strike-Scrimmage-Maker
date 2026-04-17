import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bloodStrikeId: text("blood_strike_id").notNull(),
  role: text("role", { enum: ["player", "captain", "admin"] }).notNull().default("player"),
  isBanned: boolean("is_banned").notNull().default(false),
  banExpiresAt: timestamp("ban_expires_at", { withTimezone: true }),
  totalKills: integer("total_kills").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
