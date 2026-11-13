import { auth } from "@/auth";
import { formatDateTime } from "@/lib/format";
import { getSecretMeta } from "@/lib/secrets";
import { fetchMyTeams } from "@/lib/teamdock";
import { LoginRedirect } from "@/components/login-redirect";
import { SecretViewer } from "@/components/secret-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

// 이 페이지를 여는 것만으로는 시크릿이 소모되지 않는다. "시크릿 열기"를 눌러야 암호문을 받는다.
export default async function SecretPage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const meta = await getSecretMeta(id);

  if (!meta) return <Notice title="시크릿을 찾을 수 없습니다" body="삭제되었거나 잘못된 링크입니다." />;
  if (meta.status === "consumed")
    return <Notice title="이미 열람된 시크릿입니다" body="한 번 열람되어 서버에서 파기되었습니다. 보낸 사람에게 다시 요청하세요." />;
  if (meta.status === "expired")
    return <Notice title="만료된 시크릿입니다" body="만료 시간이 지나 서버에서 지워졌습니다." />;

  if (meta.scope === "team") {
    const session = await auth();
    if (!session?.user?.id) return <LoginRedirect path={`/s/${id}`} />;
    const teams = await fetchMyTeams(session.accessToken);
    if (!teams) return <LoginRedirect path={`/s/${id}`} />;
    if (!teams.some((team) => team.id === meta.teamId))
      return (
        <Notice
          title="열람 권한이 없습니다"
          body={`이 시크릿은 ${meta.teamName} 팀 멤버만 열 수 있습니다. ${session.user.name} 님은 이 팀의 멤버가 아닙니다.`}
        />
      );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardDescription>{meta.ownerName} 님이 보낸 시크릿</CardDescription>
        <CardTitle className="text-xl">{meta.label}</CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary">{meta.scope === "team" ? `${meta.teamName} 팀 전용` : "링크 소지자"}</Badge>
          {meta.burnAfterRead && <Badge variant="secondary">1회 열람 후 파기</Badge>}
          {meta.hasPassword && <Badge variant="secondary">비밀번호 보호</Badge>}
          <Badge variant="outline">{formatDateTime(meta.expiresAt)} 만료</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <SecretViewer id={meta.id} burnAfterRead={meta.burnAfterRead} hasPassword={meta.hasPassword} />
      </CardContent>
    </Card>
  );
}
