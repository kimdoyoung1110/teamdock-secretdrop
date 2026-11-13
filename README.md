# TeamDock + SecretDrop

Keycloak SSO로 묶인 두 서비스. 팀플 비밀값을 카톡 대신 링크로 공유하고, 열면 사라지며, 서버도 내용을 볼 수 없다.

- **TeamDock** (`apps/teamdock`, 9000): 팀 워크스페이스
- **SecretDrop** (`apps/secretdrop`, 9001): 종단간 암호화(AES-256-GCM) 시크릿 공유
- **Keycloak** (8180): 두 서비스의 공통 로그인(SSO)

## 로컬 실행

필요한 것: Docker, Node 22, pnpm 9

```bash
pnpm infra:up          # Postgres(5433) + Keycloak(8180) 실행, realm 자동 import
pnpm infra:admin-http  # (선택) 관리자 콘솔이 "HTTPS required"로 막힐 때 한 번 실행
```

- Keycloak 관리자 콘솔: http://localhost:8180 (개발용 계정은 `infra/compose.dev.yml` 참고)
- realm `teamdock`에 클라이언트 `teamdock`, `secretdrop`과 테스트 사용자 2명이 `infra/keycloak/realm-export.json`에서 자동 생성된다.
- realm 설정을 고쳤으면 `pnpm infra:reset && pnpm infra:up`으로 다시 import한다.

앱 실행 방법은 구현 후 추가 예정.
