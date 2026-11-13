import NextAuth, { type DefaultSession } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { isSessionRevoked } from "@/lib/revocation";

declare module "next-auth" {
  interface Session {
    /** Keycloak SSO 세션 ID. Back-Channel Logout에서 이 값으로 세션을 무효화한다. */
    sid?: string;
    /** 로그아웃 시 Keycloak에 id_token_hint로 보낸다. 서버에서만 쓴다. */
    idToken?: string;
    user: { id: string } & DefaultSession["user"];
  }
}

const secure = process.env.AUTH_URL?.startsWith("https://") ?? false;

// 쿠키는 포트를 구분하지 않는다. localhost:9000과 9001이 기본 이름(authjs.*)을
// 같이 쓰면 서로의 세션을 덮어쓰므로 앱마다 접두어를 붙인다.
const cookie = (name: string, maxAge?: number) => ({
  name: `teamdock.${name}`,
  options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure, maxAge },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Authorization Code Flow + PKCE(S256). 토큰 교환은 서버에서 Client Secret으로 한다.
    Keycloak({ checks: ["pkce", "state"] }),
  ],
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: cookie("session"),
    callbackUrl: cookie("callback-url"),
    csrfToken: cookie("csrf-token"),
    pkceCodeVerifier: cookie("pkce", 60 * 15),
    state: cookie("state", 60 * 15),
    nonce: cookie("nonce"),
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // 로그인 직후에만 account/profile이 들어온다.
      if (account && profile) {
        token.sub = profile.sub ?? token.sub;
        token.sid = profile.sid;
        token.idToken = account.id_token;
        return token;
      }
      // 다른 서비스에서 로그아웃해 Keycloak이 이 세션을 끊으라고 알려 왔다면 null을 돌려 로그아웃 처리한다.
      if (typeof token.sid === "string" && (await isSessionRevoked(token.sid))) return null;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.sid = token.sid as string | undefined;
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },
});
