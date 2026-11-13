"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { getTeamByInviteCode } from "./teams";
import { requireUser } from "./session";

export async function createTeam(formData: FormData) {
  const { user } = await requireUser("/teams");
  const name = String(formData.get("name") ?? "").trim().slice(0, 50);
  if (!name) return;

  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  const repoRaw = String(formData.get("repoUrl") ?? "").trim();
  const repoUrl = /^https?:\/\//.test(repoRaw) ? repoRaw.slice(0, 200) : null;
  const dueRaw = String(formData.get("dueDate") ?? "");
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null;

  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(teams).values({
      id,
      name,
      description,
      repoUrl,
      dueDate,
      inviteCode: randomBytes(9).toString("base64url"),
    });
    await tx.insert(teamMembers).values({
      teamId: id,
      userSub: user.id,
      name: user.name,
      email: user.email,
      role: "owner",
    });
  });
  redirect(`/teams/${id}`);
}

export async function joinTeam(code: string) {
  const { user } = await requireUser(`/join/${code}`);
  const found = await getTeamByInviteCode(code);
  if (!found) redirect("/teams");

  await db
    .insert(teamMembers)
    .values({
      teamId: found.team.id,
      userSub: user.id,
      name: user.name,
      email: user.email,
      role: "member",
    })
    .onConflictDoNothing();
  revalidatePath("/teams");
  redirect(`/teams/${found.team.id}`);
}

// 앱 세션만 지우면 Keycloak 세션이 남아 다음 접근에서 바로 다시 로그인된다.
// 그래서 Keycloak의 end_session 엔드포인트까지 보내 SSO 세션도 끝낸다.
export async function logout() {
  const session = await auth();
  await signOut({ redirect: false });

  const url = new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`);
  if (session?.idToken) {
    url.searchParams.set("id_token_hint", session.idToken);
    url.searchParams.set("post_logout_redirect_uri", `${process.env.AUTH_URL}/`);
  }
  redirect(url.toString());
}
