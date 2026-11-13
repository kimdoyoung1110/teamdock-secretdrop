import { decodeJwt, decodeProtectedHeader } from "jose";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const shown = ["iss", "aud", "sub", "sid", "preferred_username", "email", "iat", "exp"] as const;

export default async function ProfilePage() {
  const { session, user } = await requireUser("/profile");
  // 서명 검증은 로그인 시 Auth.js가 Keycloak 공개키로 이미 마쳤다. 여기서는 내용을 보여 주기만 한다.
  const claims = session.idToken ? decodeJwt(session.idToken) : null;
  const header = session.idToken ? decodeProtectedHeader(session.idToken) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">프로필</h1>
        <p className="text-sm text-muted-foreground">Keycloak이 알려 준 내 계정 정보입니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      {claims && header && (
        <Card>
          <CardHeader>
            <CardTitle>ID Token</CardTitle>
            <CardDescription>
              Keycloak이 개인키로 서명({header.alg})한 JWT입니다. TeamDock은 Keycloak의 공개키(kid{" "}
              <code className="font-mono">{header.kid?.slice(0, 8)}…</code>)로 서명을 검증한 뒤 이 정보를 신뢰합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-y-2 font-mono text-xs">
              {shown.map((key) => {
                const value = claims[key];
                if (value === undefined) return null;
                const text =
                  key === "iat" || key === "exp"
                    ? new Date((value as number) * 1000).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
                    : String(value);
                return (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="break-all">{text}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              <code className="font-mono">sid</code>는 Keycloak SSO 세션 ID입니다. SecretDrop에 로그인해도 같은 값이
              나옵니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
