import { createRemoteJWKSet, jwtVerify } from "jose";
import { revokeSession } from "@/lib/revocation";

const issuer = process.env.AUTH_KEYCLOAK_ISSUER!;
const jwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));
const LOGOUT_EVENT = "http://schemas.openid.net/event/backchannel-logout";

// OIDC Back-Channel Logout.
// 사용자가 다른 서비스에서 로그아웃하면 Keycloak이 브라우저를 거치지 않고 서버끼리 이 주소를 직접 호출한다.
// 누구나 호출할 수 있는 공개 주소이므로, 본문의 logout_token이 Keycloak 개인키로 서명됐는지 검증한 뒤에만 믿는다.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const logoutToken = form?.get("logout_token");
  if (typeof logoutToken !== "string") return new Response("missing logout_token", { status: 400 });

  try {
    const { payload } = await jwtVerify(logoutToken, jwks, {
      issuer,
      audience: process.env.AUTH_KEYCLOAK_ID!,
    });
    const events = payload.events as Record<string, unknown> | undefined;
    // 명세: events에 back-channel logout 이벤트가 있어야 하고, nonce는 없어야 한다(ID Token 재사용 방지).
    if (!events || !(LOGOUT_EVENT in events) || "nonce" in payload) throw new Error("not a logout token");
    if (typeof payload.sid !== "string") throw new Error("no sid");

    await revokeSession(payload.sid);
  } catch {
    return new Response("invalid logout_token", { status: 400 });
  }
  return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
}
