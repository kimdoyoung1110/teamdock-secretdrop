import { and, desc, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs, secrets } from "@/db/schema";

export type SecretStatus = "active" | "consumed" | "expired";

export function statusOf(secret: { ciphertext: string | null; consumedAt: Date | null; expiresAt: Date }): SecretStatus {
  if (secret.consumedAt) return "consumed";
  if (!secret.ciphertext || secret.expiresAt < new Date()) return "expired";
  return "active";
}

/** 만료된 시크릿의 암호문을 지운다. 별도 배치 없이 조회 시점에 정리한다. */
export async function purgeExpired() {
  await db
    .update(secrets)
    .set({ ciphertext: null })
    .where(and(isNotNull(secrets.ciphertext), lt(secrets.expiresAt, new Date())));
}

export async function getSecretMeta(id: string) {
  const [secret] = await db.select().from(secrets).where(eq(secrets.id, id));
  if (!secret) return null;
  return {
    id: secret.id,
    label: secret.label,
    ownerName: secret.ownerName,
    scope: secret.scope,
    teamId: secret.teamId,
    teamName: secret.teamName,
    burnAfterRead: secret.burnAfterRead,
    hasPassword: Boolean(secret.pwSalt),
    expiresAt: secret.expiresAt,
    status: statusOf(secret),
  };
}

export async function listSecretsOf(ownerSub: string) {
  await purgeExpired();
  const rows = await db
    .select()
    .from(secrets)
    .where(eq(secrets.ownerSub, ownerSub))
    .orderBy(desc(secrets.createdAt));
  const logs = rows.length
    ? await db
        .select()
        .from(accessLogs)
        .where(
          inArray(
            accessLogs.secretId,
            rows.map((row) => row.id),
          ),
        )
        .orderBy(accessLogs.viewedAt)
    : [];
  return rows.map((row) => ({
    ...row,
    status: statusOf(row),
    logs: logs.filter((log) => log.secretId === row.id),
  }));
}
