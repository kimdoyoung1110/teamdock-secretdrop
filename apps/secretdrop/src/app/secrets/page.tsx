import Link from "next/link";
import { deleteSecret } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { listSecretsOf, type SecretStatus } from "@/lib/secrets";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabel: Record<SecretStatus, string> = {
  active: "대기 중",
  consumed: "열람 후 파기됨",
  expired: "만료됨",
};

export default async function SecretsPage() {
  const { user } = await requireUser("/secrets");
  const secrets = await listSecretsOf(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">내 시크릿</h1>
          <p className="text-sm text-muted-foreground">
            내가 만든 시크릿과 열람 기록입니다. 링크는 키가 들어 있어 여기서 다시 볼 수 없습니다.
          </p>
        </div>
        <Link href="/new" className={buttonVariants()}>
          새 시크릿
        </Link>
      </div>

      {secrets.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
          아직 만든 시크릿이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {secrets.map((secret) => (
            <li key={secret.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {secret.label}
                    <Badge variant={secret.status === "active" ? "default" : "secondary"}>
                      {statusLabel[secret.status]}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {secret.scope === "team" ? `${secret.teamName} 팀 전용` : "링크 소지자"} ·{" "}
                    {secret.burnAfterRead ? "1회 열람 후 파기" : "만료까지 여러 번 열람"}
                    {secret.pwSalt ? " · 비밀번호 보호" : ""} · {formatDateTime(secret.createdAt)} 생성 ·{" "}
                    {formatDateTime(secret.expiresAt)} 만료
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div>
                    <p className="font-medium">열람 기록</p>
                    {secret.logs.length === 0 ? (
                      <p className="text-muted-foreground">아직 아무도 열지 않았습니다.</p>
                    ) : (
                      <ul className="text-muted-foreground">
                        {secret.logs.map((log) => (
                          <li key={log.id}>
                            {formatDateTime(log.viewedAt)} · {log.viewerName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">서버에 저장된 값 보기</summary>
                    <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-y-1 font-mono">
                      <dt>ciphertext</dt>
                      <dd className="break-all">{secret.ciphertext ?? "(지워짐)"}</dd>
                      <dt>iv</dt>
                      <dd className="break-all">{secret.iv}</dd>
                      {secret.pwSalt && (
                        <>
                          <dt>pbkdf2 salt</dt>
                          <dd className="break-all">{secret.pwSalt}</dd>
                        </>
                      )}
                      <dt>key</dt>
                      <dd>(서버에 없음 — 링크의 # 뒤에만 있음)</dd>
                    </dl>
                  </details>
                  <form action={deleteSecret.bind(null, secret.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      삭제
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
