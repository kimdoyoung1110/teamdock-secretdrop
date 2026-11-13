"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { accessLogs, secrets } from "@/db/schema";
import type { EncryptedPayload } from "./crypto";
import { requireUser } from "./session";
import { fetchMyTeams } from "./teamdock";

const EXPIRY_HOURS = { "1h": 1, "1d": 24, "7d": 24 * 7 } as const;
const MAX_CIPHERTEXT_LENGTH = 100_000;
const base64Url = /^[A-Za-z0-9_-]+$/;

export type CreateSecretInput = {
  payload: EncryptedPayload;
  label: string;
  scope: "link" | "team";
  teamId: string | null;
  expiresIn: keyof typeof EXPIRY_HOURS;
  burnAfterRead: boolean;
};

export type CreateSecretResult = { ok: true; id: string } | { ok: false; message: string };

// 여기로 들어오는 것은 이미 브라우저에서 암호화된 값이다. 서버는 평문도 키도 받지 않는다.
export async function createSecret(input: CreateSecretInput): Promise<CreateSecretResult> {
  const { session, user } = await requireUser("/new");
  const { payload } = input;

  const fields = [payload.ciphertext, payload.iv, payload.pwSalt, payload.pwIv].filter((v) => v !== null);
  if (!fields.every((v) => typeof v === "string" && base64Url.test(v)) || !EXPIRY_HOURS[input.expiresIn]) {
    return { ok: false, message: "요청 형식이 올바르지 않습니다." };
  }
  if (payload.ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    return { ok: false, message: "시크릿이 너무 깁니다. 약 70KB까지 저장할 수 있습니다." };
  }

  let teamId: string | null = null;
  let teamName: string | null = null;
  if (input.scope === "team") {
    const teams = await fetchMyTeams(session.accessToken);
    const team = teams?.find((t) => t.id === input.teamId);
    if (!team) return { ok: false, message: "해당 팀의 멤버가 아니거나 팀 정보를 확인할 수 없습니다." };
    teamId = team.id;
    teamName = team.name;
  }

  const id = randomBytes(12).toString("base64url");
  await db.insert(secrets).values({
    id,
    ownerSub: user.id,
    ownerName: user.name,
    label: input.label.trim().slice(0, 60) || "제목 없음",
    ciphertext: payload.ciphertext,
    iv: payload.iv,
    pwSalt: payload.pwSalt,
    pwIv: payload.pwIv,
    scope: input.scope === "team" ? "team" : "link",
    teamId,
    teamName,
    burnAfterRead: Boolean(input.burnAfterRead),
    expiresAt: new Date(Date.now() + EXPIRY_HOURS[input.expiresIn] * 3600_000),
  });
  revalidatePath("/secrets");
  return { ok: true, id };
}

export type RevealResult =
  | { ok: true; payload: EncryptedPayload; burned: boolean }
  | { ok: false; reason: "gone" | "expired" | "login" | "forbidden" };

// 암호문을 내어 준다. 복호화는 브라우저가 링크의 # 뒤 키로 한다.
// 페이지를 여는 것만으로는 호출되지 않는다. 메신저의 링크 미리보기가 시크릿을 태워 버리지 않게 하려는 것이다.
export async function revealSecret(id: string): Promise<RevealResult> {
  const session = await auth();

  const [meta] = await db
    .select({ scope: secrets.scope, teamId: secrets.teamId })
    .from(secrets)
    .where(eq(secrets.id, id));
  if (!meta) return { ok: false, reason: "gone" };

  if (meta.scope === "team") {
    if (!session?.user?.id) return { ok: false, reason: "login" };
    const teams = await fetchMyTeams(session.accessToken);
    if (!teams) return { ok: false, reason: "login" };
    if (!teams.some((t) => t.id === meta.teamId)) return { ok: false, reason: "forbidden" };
  }

  // 동시에 두 명이 열어도 한 명만 받도록 행을 잠그고 읽은 뒤 지운다.
  return db.transaction(async (tx): Promise<RevealResult> => {
    const [secret] = await tx.select().from(secrets).where(eq(secrets.id, id)).for("update");
    if (!secret?.ciphertext) return { ok: false, reason: "gone" };
    if (secret.expiresAt < new Date()) {
      await tx.update(secrets).set({ ciphertext: null }).where(eq(secrets.id, id));
      return { ok: false, reason: "expired" };
    }

    await tx.insert(accessLogs).values({
      id: randomUUID(),
      secretId: id,
      viewerSub: session?.user?.id ?? null,
      viewerName: session?.user?.name ?? "익명 (링크 소지자)",
    });
    if (secret.burnAfterRead) {
      await tx.update(secrets).set({ ciphertext: null, consumedAt: new Date() }).where(eq(secrets.id, id));
    }

    return {
      ok: true,
      burned: secret.burnAfterRead,
      payload: { ciphertext: secret.ciphertext, iv: secret.iv, pwSalt: secret.pwSalt, pwIv: secret.pwIv },
    };
  });
}

export async function deleteSecret(id: string) {
  const { user } = await requireUser("/secrets");
  await db.delete(secrets).where(and(eq(secrets.id, id), eq(secrets.ownerSub, user.id)));
  revalidatePath("/secrets");
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
