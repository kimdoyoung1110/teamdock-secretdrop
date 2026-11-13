import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers, teams } from "@/db/schema";

export async function listTeamsOf(userSub: string) {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      dueDate: teams.dueDate,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userSub, userSub))
    .orderBy(desc(teams.createdAt));
}

export async function getTeamForMember(teamId: string, userSub: string) {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userSub, userSub)));
  if (!membership) return null;

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);
  return { team, members, myRole: membership.role };
}

export async function getTeamByInviteCode(code: string) {
  const [team] = await db.select().from(teams).where(eq(teams.inviteCode, code));
  if (!team) return null;
  const [{ value }] = await db
    .select({ value: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id));
  return { team, memberCount: value };
}
