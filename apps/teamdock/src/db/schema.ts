import { date, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  repoUrl: text("repo_url"),
  dueDate: date("due_date"),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 사용자는 Keycloak이 관리한다. 여기에는 Keycloak의 sub와 합류 시점의 이름·이메일만 둔다.
export const teamMembers = pgTable(
  "team_members",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userSub: text("user_sub").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userSub] })],
);
