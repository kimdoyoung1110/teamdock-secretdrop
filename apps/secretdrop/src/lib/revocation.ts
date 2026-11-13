import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { revokedSessions } from "@/db/schema";

// 앱 세션 쿠키의 최대 수명(30일)이 지난 기록은 더 볼 일이 없다.
const KEEP_MS = 30 * 24 * 3600_000;

export async function revokeSession(sid: string) {
  await db.insert(revokedSessions).values({ sid }).onConflictDoNothing();
  await db.delete(revokedSessions).where(lt(revokedSessions.revokedAt, new Date(Date.now() - KEEP_MS)));
}

export async function isSessionRevoked(sid: string) {
  const [row] = await db.select({ sid: revokedSessions.sid }).from(revokedSessions).where(eq(revokedSessions.sid, sid));
  return Boolean(row);
}
