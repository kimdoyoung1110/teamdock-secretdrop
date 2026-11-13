# SSO 동작 검증 시나리오

PPT 캡처용 체크리스트. 로컬에서 모두 통과를 확인했다(2026-11-13).
준비: `pnpm infra:up`, 두 앱 실행. 사용자 alice(팀 Owner), bob(팀 Member), carol(팀 없음).

| # | 과제 항목 | 절차 | 기대 결과 | 캡처 포인트 |
|---|---|---|---|---|
| 1 | A 로그인 | `localhost:9000/teams` 접속 → Keycloak 로그인 | TeamDock 팀 목록 | Keycloak 로그인 화면, 네트워크 탭의 302 흐름(`/auth` → `/callback`), `code_challenge_method=S256` |
| 2 | B SSO | 팀 상세에서 "SecretDrop에서 시크릿 만들기" 클릭 | 로그인 화면 없이 SecretDrop `/new` 진입, 팀이 선택되어 있음 | 네트워크 탭에서 Keycloak이 로그인 폼 없이 바로 302로 `code`를 돌려주는 것, 쿠키 탭의 `KEYCLOAK_SESSION` |
| 3 | 같은 SSO 세션 | 두 서비스의 `/profile` 비교 | `sid`가 같고 `aud`만 다름(teamdock / secretdrop) | 두 프로필 화면 나란히 |
| 4 | 쿠키 분리 | 개발자 도구 → 쿠키 | `teamdock.session`, `secretdrop.session`이 따로 있음 | 쿠키 탭 |
| 5 | 로그아웃 | SecretDrop에서 로그아웃 → TeamDock 새로고침 | TeamDock도 로그아웃됨, `/teams` 접근 시 Keycloak 로그인 화면 | 로그아웃 전후 TeamDock 화면, 두 DB의 `revoked_sessions` |
| 6 | 반대 방향 | TeamDock에서 로그아웃 → SecretDrop 새로고침 | SecretDrop도 로그아웃됨 | 위와 같음 |
| 7 | 새 브라우저 세션 | 시크릿(Incognito) 창에서 `localhost:9001/new` | Keycloak 로그인 화면 | 시크릿 창 화면 |
| 8 | 암호화 | 시크릿 생성 후 DB 조회 | `ciphertext`, `iv`만 있고 평문·키 없음 | 아래 psql 결과, "서버에 저장된 값 보기" |
| 9 | 1회 열람 | 링크 열기 → 다시 열기 | 두 번째는 "이미 열람된 시크릿입니다" | 두 화면, DB의 `ciphertext`가 NULL |
| 10 | 팀 전용 | carol로 팀 전용 링크 열기 | "열람 권한이 없습니다" | 거부 화면 |

## 확인용 명령

```bash
# 8, 9: 서버에 저장된 값
docker exec teamdock-secretdrop-postgres-1 psql -U dev -d secretdrop -x \
  -c "select id, label, ciphertext, iv, pw_salt, consumed_at from secrets"

# 5, 6: Back-Channel Logout으로 무효화된 세션
docker exec teamdock-secretdrop-postgres-1 psql -U dev -d teamdock -c "select * from revoked_sessions"
docker exec teamdock-secretdrop-postgres-1 psql -U dev -d secretdrop -c "select * from revoked_sessions"
```
