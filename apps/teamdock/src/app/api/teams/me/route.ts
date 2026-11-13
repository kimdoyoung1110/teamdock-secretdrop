import { createRemoteJWKSet, jwtVerify } from "jose";
import { listTeamsOf } from "@/lib/teams";

const issuer = process.env.AUTH_KEYCLOAK_ISSUER!;
// Keycloak의 공개키(JWKS)를 받아 Access Token의 RS256 서명을 검증한다.
const jwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));

// SecretDrop이 "이 사용자가 어느 팀 소속인가"를 확인할 때 부르는 API.
// 세션 쿠키가 아니라 Keycloak이 발급한 Access Token(Bearer)으로 보호한다.
export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return Response.json({ error: "missing_token" }, { status: 401 });

  let sub: string | undefined;
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: "teamdock" });
    sub = payload.sub;
  } catch {
    return Response.json({ error: "invalid_token" }, { status: 401 });
  }
  if (!sub) return Response.json({ error: "invalid_token" }, { status: 401 });

  const teams = await listTeamsOf(sub);
  return Response.json({
    teams: teams.map((t) => ({ id: t.id, name: t.name, role: t.role })),
  });
}
