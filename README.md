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

### TeamDock (서비스 A)

```bash
pnpm install
cp apps/teamdock/.env.example apps/teamdock/.env.local   # AUTH_SECRET만 채운다: openssl rand -base64 32
pnpm --filter teamdock db:push                            # 테이블 생성
pnpm dev:teamdock                                         # http://localhost:9000
```

### SecretDrop (서비스 B)

```bash
cp apps/secretdrop/.env.example apps/secretdrop/.env.local   # AUTH_SECRET만 채운다
pnpm --filter secretdrop db:push
pnpm dev:secretdrop                                           # http://localhost:9001
```

두 앱을 모두 띄운 뒤 TeamDock에 로그인하고, 팀 화면의 "SecretDrop에서 시크릿 만들기"를 누르면 로그인 화면 없이 SecretDrop으로 넘어간다.

테스트 사용자는 alice, bob, carol 세 명이다(비밀번호는 `infra/keycloak/realm-export.json`). carol은 어느 팀에도 속하지 않아 팀 전용 시크릿의 권한 거부를 확인할 때 쓴다.

## 암호화 구조

```
[작성자 브라우저]                              [SecretDrop 서버 / DB]
링크 키 = 무작위 256비트
암호문 = AES-256-GCM(링크 키, iv, 평문)   ──▶  암호문, iv, (salt)만 저장
(선택) 비밀번호 → PBKDF2-SHA-256 60만 회
       → 그 키로 한 겹 더 AES-256-GCM
공유 링크 = /s/{id}#{링크 키}                   # 뒤는 서버로 전송되지 않는다

[열람자 브라우저]
"시크릿 열기" → 암호문 수신 → # 뒤 키로 복호화   서버는 암호문을 즉시 삭제(1회 열람)
```

- 암호화·복호화는 `apps/secretdrop/src/lib/crypto.ts`에서 WebCrypto API로만 한다.
- 서버가 받는 값은 `apps/secretdrop/src/lib/actions.ts`의 `createSecret` 입력이 전부다. 평문과 키는 없다.
