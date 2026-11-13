"use client";

import { useEffect } from "react";

export const KEY_STASH = "secretdrop.pending-key";

// 팀 전용 시크릿을 비로그인으로 열면 Keycloak을 다녀와야 한다.
// 로그인 화면을 거치면 # 뒤의 키가 사라질 수 있어, 떠나기 전에 sessionStorage에 잠시 맡긴다.
// sessionStorage는 이 브라우저 탭 안에만 있고 서버로 전송되지 않는다.
export function LoginRedirect({ path }: { path: string }) {
  useEffect(() => {
    if (window.location.hash.length > 1) sessionStorage.setItem(KEY_STASH, window.location.hash.slice(1));
    window.location.replace(`/api/login?callbackUrl=${encodeURIComponent(path)}`);
  }, [path]);

  return <p className="text-center text-sm text-muted-foreground">로그인을 확인하는 중…</p>;
}
