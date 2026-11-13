# TeamDock + SecretDrop — Keycloak SSO 과제

암호와인증 수업 과제(10점). Keycloak으로 두 웹 서비스에 SSO를 적용하고 동작을 검증한다.
목표는 만점: 필수 요구사항 전부 + 가점 2개(발표영상, 암호학 적용 서비스).

## 문제 인식

팀플·동아리 프로젝트에서 `.env`, API 키, 공용 비밀번호를 카톡으로 보내고, 그 값이 채팅방에 평문으로 영원히 남는다.

## 서비스

- **TeamDock (서비스 A, 로컬 9000)**: 팀 워크스페이스. 팀 생성, 초대 링크 합류, 멤버·역할(Owner/Member), `GET /api/teams/me`(Access Token 보호). "이 팀에 시크릿 공유하기" 버튼이 SSO 시연 지점.
- **SecretDrop (서비스 B, 로컬 9001)**: 시크릿 공유. 만료 시간, 1회 열람 후 파기, 비밀번호 보호(선택), 공개 범위(링크 소지자 / 팀 전용), 내 시크릿 목록과 열람 기록.
- **Keycloak (로컬 8180)**: realm 1개, confidential client 2개, OIDC Authorization Code + PKCE(S256).

## 과제 요구사항 (빠뜨리면 감점)

- R1 서비스 A, B 구현 + 기능 설명
- R2 Keycloak으로 두 서비스 인증
- R3 A 로그인 후 B 접근 시 추가 로그인 없음
- R4 로그아웃 / 새 브라우저 세션에서 재인증 요구
- R5 모든 검증에 실행 화면 캡처
- R6 SSO 동작 원리 설명
- R7 PPT 10~20장 (구성도, 환경·설정, A·B 화면, A 로그인, B SSO, 로그아웃 테스트, 원리·소감)
- R8 마지막 장에 GitHub 주소
- 가점1 YouTube 발표영상 / 가점2 암호학 적용 서비스

## 구조

```
apps/teamdock/     # 서비스 A (Next.js)
apps/secretdrop/   # 서비스 B (Next.js)
infra/keycloak/    # Dockerfile + realm export JSON
infra/compose.dev.yml
```

pnpm workspace만 사용한다. Turborepo 등 모노레포 도구는 넣지 않는다.

## 스택

- Next.js App Router + TypeScript, Auth.js v5 Keycloak Provider
- PostgreSQL 1개 인스턴스에 DB 3개(keycloak / teamdock / secretdrop), Drizzle
- WebCrypto API(외부 암호 라이브러리 금지), jose(JWT 검증)
- Tailwind + shadcn/ui
- Keycloak 26

## 반드시 지킬 설계 규칙

- **E2E 암호화**: 암호화·복호화는 브라우저에서만. 서버와 DB에는 ciphertext, iv, (비밀번호 사용 시) salt만 저장한다. 평문과 키는 서버로 절대 보내지 않는다.
- **키 전달**: 공유 링크는 `/s/{id}#{key}`. 키는 URL fragment에만 둔다. 서버 로그·API 본문·쿼리스트링에 넣지 않는다.
- **알고리즘**: AES-256-GCM(iv 12바이트, 매번 랜덤), 비밀번호 보호 시 PBKDF2-SHA-256.
- **세션 쿠키 이름 분리**: `teamdock.session`, `secretdrop.session`. localhost는 포트를 구분하지 않아 기본 이름이면 서로 덮어쓴다.
- **Back-Channel Logout**: Keycloak `sid`를 세션에 담고, `/api/backchannel-logout`에서 `logout_token` 서명을 jose로 검증한 뒤 `revoked_sessions`에 기록, 요청마다 확인한다. 별도 세션 저장소는 두지 않는다.
- **팀 전용 시크릿**: SecretDrop이 TeamDock `/api/teams/me`를 Access Token으로 호출해 멤버 여부를 확인한다.
- Client Secret 등 비밀값은 `.env.local`에만 두고 커밋하지 않는다. `.env.example`은 커밋한다.

## 배포

- 서비스 A: https://teamdock-sso.vercel.app (Vercel 프로젝트 `teamdock-sso`, Root Directory `apps/teamdock`)
- 서비스 B: https://secretdrop-sso.vercel.app (Vercel 프로젝트 `secretdrop-sso`, Root Directory `apps/secretdrop`)
- Keycloak: https://keycloak-936592447455.us-east1.run.app (Cloud Run, 프로젝트 `teamdock-sso-b8a0ed`, us-east1, 최대 1 / 최소 0)
- DB: Neon 프로젝트 `teamdock-sso` (us-east-1), DB 3개
- `main`에 push하면 Vercel 두 프로젝트가 자동 배포된다. Vercel 스코프는 개인 Hobby 팀(`kim-do-youngs-projects-d53b7189`)이다.
- 운영 비밀값(Client Secret, Keycloak 관리자 비밀번호, DB 주소)은 커밋되지 않는 `infra/.env.prod`에 있다.
- 로컬은 `infra/compose.dev.yml`로 Keycloak + Postgres 실행. 채점자가 재현 가능해야 한다.
- `apps/*`에서 `vercel link`를 다시 실행하면 `.env.local`에 `VERCEL_OIDC_TOKEN`이 추가된다. 로컬 값은 유지된다.

## 작업 규칙

- 오버엔지니어링 금지. 과제 요구사항과 가점에 기여하지 않는 기능·추상화는 넣지 않는다.
- 커밋 메시지와 PR 본문에 AI 서명·Co-Authored-By를 넣지 않는다.
- 커밋 메시지는 한국어, `feat:` / `fix:` / `chore:` / `docs:` 접두어.
- 구현 중 겪은 문제는 PPT 트러블슈팅 슬라이드 소재이므로 `docs/troubleshooting.md`에 한 줄씩 남긴다.
- 화면 문구는 한국어.
