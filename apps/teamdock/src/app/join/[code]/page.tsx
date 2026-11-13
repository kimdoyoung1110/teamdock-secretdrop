import { notFound, redirect } from "next/navigation";
import { joinTeam } from "@/lib/actions";
import { requireUser } from "@/lib/session";
import { getTeamByInviteCode, getTeamForMember } from "@/lib/teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const { user } = await requireUser(`/join/${code}`);
  const found = await getTeamByInviteCode(code);
  if (!found) notFound();

  if (await getTeamForMember(found.team.id, user.id)) redirect(`/teams/${found.team.id}`);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardDescription>팀 초대</CardDescription>
        <CardTitle className="text-xl">{found.team.name}</CardTitle>
        <CardDescription>
          {found.team.description || "설명이 없습니다."} · 현재 멤버 {found.memberCount}명
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={joinTeam.bind(null, code)}>
          <Button type="submit" className="w-full">
            {user.name}(으)로 합류하기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
