import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 서버는 암호문과 복호화에 필요한 공개 값(iv, salt)만 저장한다.
// 평문과 키는 이 테이블 어디에도 없다. 키는 공유 링크의 # 뒤에만 있다.
export const secrets = pgTable("secrets", {
  id: text("id").primaryKey(),
  ownerSub: text("owner_sub").notNull(),
  ownerName: text("owner_name").notNull(),
  /** 암호화되지 않는 제목. 목록에서 구분하는 용도다. */
  label: text("label").notNull(),
  /** AES-256-GCM 암호문(base64url). 열람 후 파기되거나 만료되면 null로 지운다. */
  ciphertext: text("ciphertext"),
  iv: text("iv").notNull(),
  /** 비밀번호 보호를 쓴 경우에만 있다. PBKDF2 salt와 바깥 겹의 iv. */
  pwSalt: text("pw_salt"),
  pwIv: text("pw_iv"),
  scope: text("scope", { enum: ["link", "team"] }).notNull(),
  teamId: text("team_id"),
  teamName: text("team_name"),
  burnAfterRead: boolean("burn_after_read").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const accessLogs = pgTable("access_logs", {
  id: text("id").primaryKey(),
  secretId: text("secret_id")
    .notNull()
    .references(() => secrets.id, { onDelete: "cascade" }),
  viewerSub: text("viewer_sub"),
  viewerName: text("viewer_name").notNull(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Back-Channel Logout으로 무효화된 Keycloak 세션(sid) 목록.
// 세션을 쿠키(JWT)에 담아 서버에 저장소가 없으므로, "끊긴 세션"만 따로 기록해 요청마다 대조한다.
export const revokedSessions = pgTable("revoked_sessions", {
  sid: text("sid").primaryKey(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }).notNull().defaultNow(),
});
