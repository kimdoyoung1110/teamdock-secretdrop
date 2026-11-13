export type Team = { id: string; name: string; role: "owner" | "member" };

/**
 * TeamDock에 "이 사용자가 속한 팀"을 물어본다.
 * 사용자의 Access Token을 Bearer로 보내고, TeamDock은 Keycloak 공개키로 서명을 검증한다.
 * 토큰이 없거나 거절되면 null을 돌려준다.
 */
export async function fetchMyTeams(accessToken: string | undefined): Promise<Team[] | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${process.env.TEAMDOCK_URL}/api/teams/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()).teams as Team[];
  } catch {
    return null;
  }
}
