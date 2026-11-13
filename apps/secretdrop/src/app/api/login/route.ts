import type { NextRequest } from "next/server";
import { signIn } from "@/auth";

// 보호된 페이지에 비로그인으로 들어오면 여기로 보낸다.
// 로그인 버튼 클릭 없이 바로 Keycloak으로 넘기므로, TeamDock에서 이미 로그인했다면
// Keycloak 세션 쿠키 덕분에 로그인 화면 없이 통과한다(SSO).
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") ?? "/new";
  const safe = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/new";
  await signIn("keycloak", { redirectTo: safe });
}
