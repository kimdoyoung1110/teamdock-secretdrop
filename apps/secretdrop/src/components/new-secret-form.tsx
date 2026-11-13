"use client";

import { useState } from "react";
import Link from "next/link";
import { createSecret } from "@/lib/actions";
import { encryptSecret } from "@/lib/crypto";
import type { Team } from "@/lib/teamdock";
import { CopyButton } from "@/components/copy-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Created = { url: string; ciphertext: string; scopeText: string };

export function NewSecretForm({
  teams,
  teamsAvailable,
  defaultTeamId,
}: {
  teams: Team[];
  teamsAvailable: boolean;
  defaultTeamId: string | null;
}) {
  const initialTeam = teams.find((t) => t.id === defaultTeamId) ?? null;
  const [scope, setScope] = useState<"link" | "team">(initialTeam ? "team" : "link");
  const [teamId, setTeamId] = useState(initialTeam?.id ?? teams[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      // 암호화는 여기, 브라우저에서 끝난다. 아래 서버 액션에는 암호문만 넘어간다.
      const { payload, linkKey } = await encryptSecret(String(form.get("content")), String(form.get("password") ?? ""));
      const result = await createSecret({
        payload,
        label: String(form.get("label") ?? ""),
        scope,
        teamId: scope === "team" ? teamId : null,
        expiresIn: form.get("expiresIn") as "1h" | "1d" | "7d",
        burnAfterRead: form.get("burnAfterRead") === "on",
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCreated({
        // 키는 # 뒤(fragment)에 둔다. 브라우저는 fragment를 서버로 보내지 않는다.
        url: `${window.location.origin}/s/${result.id}#${linkKey}`,
        ciphertext: payload.ciphertext,
        scopeText:
          scope === "team"
            ? `${teams.find((t) => t.id === teamId)?.name} 팀 멤버만 열 수 있습니다.`
            : "링크를 가진 사람은 누구나 열 수 있습니다.",
      });
    } catch {
      setError("암호화 또는 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return (
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>공유 링크가 만들어졌습니다</CardTitle>
          <CardDescription>
            {created.scopeText} 이 링크는 지금만 볼 수 있습니다. 키가 링크에만 들어 있어 서버도 다시 만들어 줄 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-md bg-muted px-2 py-1.5 font-mono text-xs break-all">
              {created.url}
            </code>
            <CopyButton value={created.url} label="링크 복사" />
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">서버에 실제로 저장된 값 보기</summary>
            <p className="mt-2">아래 암호문과 iv만 저장됩니다. 링크의 # 뒤 키가 없으면 풀 수 없습니다.</p>
            <code className="mt-2 block rounded-md bg-muted p-2 font-mono break-all">{created.ciphertext}</code>
          </details>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setCreated(null)}>
              하나 더 만들기
            </Button>
            <Link href="/secrets" className={buttonVariants({ variant: "ghost" })}>
              내 시크릿 보기
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="label">제목</Label>
            <Input id="label" name="label" maxLength={60} placeholder="예: 백엔드 .env" />
            <p className="text-xs text-muted-foreground">제목은 암호화되지 않습니다. 비밀값을 적지 마세요.</p>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="content">시크릿 내용</Label>
            <Textarea
              id="content"
              name="content"
              required
              maxLength={50000}
              rows={7}
              className="font-mono"
              placeholder={"DATABASE_URL=postgres://...\nAPI_KEY=..."}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scope">누가 열 수 있나요</Label>
            <select
              id="scope"
              className={selectClass}
              value={scope}
              onChange={(e) => setScope(e.target.value as "link" | "team")}
            >
              <option value="link">링크를 가진 사람 누구나</option>
              <option value="team" disabled={teams.length === 0}>
                내 TeamDock 팀 멤버만
              </option>
            </select>
            {teams.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {teamsAvailable
                  ? "속한 팀이 없습니다. TeamDock에서 팀을 만들면 팀 전용으로 공유할 수 있습니다."
                  : "TeamDock에서 팀 정보를 가져오지 못했습니다."}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teamId">팀</Label>
            <select
              id="teamId"
              className={selectClass}
              value={teamId}
              disabled={scope !== "team"}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams.length === 0 && <option value="">팀 없음</option>}
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiresIn">만료</Label>
            <select id="expiresIn" name="expiresIn" className={selectClass} defaultValue="1d">
              <option value="1h">1시간 뒤</option>
              <option value="1d">1일 뒤</option>
              <option value="7d">7일 뒤</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호 (선택)</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="걸지 않음" />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="burnAfterRead" defaultChecked className="size-4 accent-primary" />한 번 열람하면
            파기
          </label>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "암호화하는 중…" : "암호화해서 링크 만들기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
