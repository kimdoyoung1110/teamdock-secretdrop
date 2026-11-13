import type { NextRequest } from "next/server";
import { signIn } from "@/auth";

// 보호된 페이지에 비로그인으로 들어오면 여기로 보낸다.
// 로그인 버튼 클릭 없이 바로 Keycloak으로 넘기므로, Keycloak 세션이 있으면 화면 없이 통과한다(SSO).
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") ?? "/teams";
  const safe = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/teams";
  await signIn("keycloak", { redirectTo: safe });
}
