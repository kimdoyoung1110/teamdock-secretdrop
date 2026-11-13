import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** 로그인한 사용자를 돌려준다. 없으면 Keycloak 로그인으로 보낸 뒤 원래 경로로 돌아온다. */
export async function requireUser(path: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/api/login?callbackUrl=${encodeURIComponent(path)}`);
  return {
    session,
    user: {
      id: session.user.id,
      name: session.user.name ?? session.user.email ?? "이름 없음",
      email: session.user.email ?? "",
    },
  };
}
