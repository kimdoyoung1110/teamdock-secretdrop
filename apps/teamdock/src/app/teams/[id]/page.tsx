import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, KeyRound } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getTeamForMember } from "@/lib/teams";
import { formatDate } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const { user } = await requireUser(`/teams/${id}`);
  const data = await getTeamForMember(id, user.id);
  if (!data) notFound();

  const { team, members, myRole } = data;
  const inviteUrl = `${process.env.AUTH_URL}/join/${team.inviteCode}`;
  const secretDropUrl = `${process.env.SECRETDROP_URL}/new?team=${team.id}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/teams" className="text-sm text-muted-foreground hover:text-foreground">
          ← 내 팀
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          {team.name}
          <Badge variant={myRole === "owner" ? "default" : "secondary"}>
            {myRole === "owner" ? "Owner" : "Member"}
          </Badge>
        </h1>
        {team.description && <p className="mt-1 text-muted-foreground">{team.description}</p>}
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />이 팀에 시크릿 공유하기
          </CardTitle>
          <CardDescription>
            .env, API 키, 공용 계정 비밀번호를 카톡 대신 SecretDrop으로 보내세요. 같은 계정으로 이어져 다시 로그인하지
            않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href={secretDropUrl} className={buttonVariants()}>
            SecretDrop에서 시크릿 만들기
            <ExternalLink />
          </a>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">레포</dt>
              <dd className="truncate">
                {team.repoUrl ? (
                  <a href={team.repoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {team.repoUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "없음"
                )}
              </dd>
              <dt className="text-muted-foreground">마감일</dt>
              <dd>{team.dueDate ? formatDate(team.dueDate) : "없음"}</dd>
              <dt className="text-muted-foreground">만든 날</dt>
              <dd>{formatDate(team.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>팀원 초대</CardTitle>
            <CardDescription>이 링크를 받은 사람은 로그인 후 팀에 합류합니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
              {inviteUrl}
            </code>
            <CopyButton value={inviteUrl} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>멤버 {members.length}명</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.userSub} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {member.userSub === user.id && <span className="text-muted-foreground"> (나)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                  {member.role === "owner" ? "Owner" : "Member"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
