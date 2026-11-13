import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 개발 중 HMR로 연결이 계속 늘어나지 않게 전역에 하나만 둔다.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForDb.pg ?? postgres(process.env.DATABASE_URL!, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
