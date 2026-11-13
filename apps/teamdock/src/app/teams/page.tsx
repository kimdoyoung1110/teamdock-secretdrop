import Link from "next/link";
import { createTeam } from "@/lib/actions";
import { requireUser } from "@/lib/session";
import { listTeamsOf } from "@/lib/teams";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function TeamsPage() {
  const { user } = await requireUser("/teams");
  const teams = await listTeamsOf(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 팀</h1>
        <p className="text-sm text-muted-foreground">{user.name} 님이 속한 팀입니다.</p>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
          아직 속한 팀이 없습니다. 아래에서 팀을 만들거나, 받은 초대 링크로 합류하세요.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link href={`/teams/${team.id}`} className="block">
                <Card className="transition-colors hover:border-foreground/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      <Badge variant={team.role === "owner" ? "default" : "secondary"}>
                        {team.role === "owner" ? "Owner" : "Member"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {team.description || "설명이 없습니다."}
                    </CardDescription>
                  </CardHeader>
                  {team.dueDate && (
                    <CardContent className="text-xs text-muted-foreground">
                      마감 {formatDate(team.dueDate)}
                    </CardContent>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>새 팀 만들기</CardTitle>
          <CardDescription>만든 사람이 Owner가 됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTeam} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">팀 이름</Label>
              <Input id="name" name="name" required maxLength={50} placeholder="예: 암호와인증 3조" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" name="description" maxLength={300} placeholder="어떤 프로젝트인가요?" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repoUrl">레포 주소</Label>
              <Input id="repoUrl" name="repoUrl" type="url" placeholder="https://github.com/..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">마감일</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">팀 만들기</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
