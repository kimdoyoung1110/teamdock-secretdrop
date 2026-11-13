import { requireUser } from "@/lib/session";
import { fetchMyTeams } from "@/lib/teamdock";
import { NewSecretForm } from "@/components/new-secret-form";

export default async function NewSecretPage({ searchParams }: PageProps<"/new">) {
  const { team } = await searchParams;
  const teamId = typeof team === "string" ? team : null;
  const { session, user } = await requireUser(teamId ? `/new?team=${encodeURIComponent(teamId)}` : "/new");
  // TeamDock API를 사용자의 Access Token으로 호출해 소속 팀을 가져온다.
  const teams = await fetchMyTeams(session.accessToken);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">새 시크릿</h1>
        <p className="text-sm text-muted-foreground">
          {user.name} 님, 내용은 이 브라우저에서 암호화된 뒤 전송됩니다. 서버에는 암호문만 저장됩니다.
        </p>
      </div>
      <NewSecretForm teams={teams ?? []} teamsAvailable={teams !== null} defaultTeamId={teamId} />
    </div>
  );
}
