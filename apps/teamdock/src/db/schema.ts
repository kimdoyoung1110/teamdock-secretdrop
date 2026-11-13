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

// Back-Channel Logout으로 무효화된 Keycloak 세션(sid) 목록.
// 세션을 쿠키(JWT)에 담아 서버에 저장소가 없으므로, "끊긴 세션"만 따로 기록해 요청마다 대조한다.
export const revokedSessions = pgTable("revoked_sessions", {
  sid: text("sid").primaryKey(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }).notNull().defaultNow(),
});
