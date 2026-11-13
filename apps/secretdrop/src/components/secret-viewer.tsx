"use client";

import { useState } from "react";
import { revealSecret } from "@/lib/actions";
import { decryptSecret, type EncryptedPayload } from "@/lib/crypto";
import { CopyButton } from "@/components/copy-button";
import { KEY_STASH } from "@/components/login-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const reasons = {
  gone: "이미 열람되어 파기되었거나 삭제된 시크릿입니다.",
  expired: "만료된 시크릿입니다.",
  login: "로그인이 필요합니다. 페이지를 새로 고쳐 주세요.",
  forbidden: "이 시크릿을 열 수 있는 팀의 멤버가 아닙니다.",
} as const;

function readLinkKey() {
  const fromHash = window.location.hash.slice(1);
  const key = fromHash || sessionStorage.getItem(KEY_STASH) || "";
  sessionStorage.removeItem(KEY_STASH);
  return key;
}

export function SecretViewer({
  id,
  burnAfterRead,
  hasPassword,
}: {
  id: string;
  burnAfterRead: boolean;
  hasPassword: boolean;
}) {
  // 받아 온 암호문은 메모리에 들고 있는다. 파기된 뒤에도 비밀번호를 다시 시도할 수 있어야 하기 때문이다.
  const [fetched, setFetched] = useState<{ payload: EncryptedPayload; linkKey: string } | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    setError(null);
    try {
      let current = fetched;
      if (!current) {
        const linkKey = readLinkKey();
        if (!linkKey) {
          setError("링크에 키가 없습니다. # 뒤까지 포함한 전체 링크로 열어 주세요.");
          return;
        }
        const result = await revealSecret(id);
        if (!result.ok) {
          setError(reasons[result.reason]);
          return;
        }
        current = { payload: result.payload, linkKey };
        setFetched(current);
      }
      try {
        // 복호화는 브라우저에서 한다. 키와 평문은 서버로 가지 않는다.
        setPlaintext(await decryptSecret(current.payload, current.linkKey, password));
      } catch {
        setError(
          hasPassword
            ? "복호화에 실패했습니다. 비밀번호를 확인해 주세요."
            : "복호화에 실패했습니다. 링크의 # 뒤 키가 잘렸거나 바뀌었습니다.",
        );
      }
    } finally {
      setPending(false);
    }
  }

  if (plaintext !== null) {
    return (
      <div className="flex flex-col gap-3">
        <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 font-mono text-sm break-all whitespace-pre-wrap">
          {plaintext}
        </pre>
        <div className="flex items-center gap-3">
          <CopyButton value={plaintext} label="내용 복사" />
          <p className="text-xs text-muted-foreground">
            {burnAfterRead
              ? "서버의 암호문은 방금 파기되었습니다. 이 화면을 닫으면 다시 볼 수 없습니다."
              : "만료 시간까지 같은 링크로 다시 열 수 있습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void open();
      }}
    >
      {hasPassword && (
        <div className="grid gap-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "여는 중…" : fetched ? "다시 시도" : "시크릿 열기"}
      </Button>
      {burnAfterRead && !fetched && (
        <p className="text-xs text-muted-foreground">열면 서버에서 바로 파기됩니다. 받을 준비가 됐을 때 누르세요.</p>
      )}
    </form>
  );
}
