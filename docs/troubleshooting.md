# 트러블슈팅 기록

PPT 트러블슈팅 슬라이드 소재. 겪은 문제를 한 항목씩 남긴다.

- **8080 포트 충돌**: 로컬에서 다른 컨테이너가 8080을 쓰고 있어 Keycloak을 8180으로 옮겼다. issuer는 요청 주소에서 만들어지므로 앱의 issuer 설정도 `http://localhost:8180/realms/teamdock`로 맞춰야 한다.
- **`ssl_required` 로그인 오류**: realm의 `sslRequired`가 `external`이면 사설 IP가 아닌 요청에 HTTPS를 강제한다. Docker Desktop을 거친 요청이 Keycloak에는 외부 IP로 보여서 localhost인데도 막혔다. 개발용 realm은 `none`으로 두고, 운영은 HTTPS라 `external`을 쓴다. 관리자 콘솔(master realm)은 `pnpm infra:admin-http`로 한 번 풀어 준다.
- **realm 재import 안 됨**: `--import-realm`은 realm이 이미 있으면 건너뛴다. `realm-export.json`을 고친 뒤에는 `pnpm infra:reset`으로 볼륨을 지우고 다시 띄워야 반영된다.
- **localhost 쿠키 충돌**: 쿠키는 포트를 구분하지 않아 `localhost:9000`과 `9001`이 Auth.js 기본 쿠키 이름(`authjs.*`)을 같이 쓰면 서로의 세션과 PKCE 값을 덮어쓴다. 세션뿐 아니라 state, pkce, callback-url 쿠키까지 앱별 접두어(`teamdock.*`, `secretdrop.*`)를 붙였다.
- **앱만 로그아웃하면 바로 다시 로그인됨**: 앱 세션 쿠키만 지우면 Keycloak 세션이 살아 있어 다음 접근에서 화면 없이 재로그인된다. 로그아웃 시 Keycloak `end_session` 엔드포인트로 `id_token_hint`와 함께 보내야 SSO 세션까지 끝난다.
- **Next.js 16 템플릿의 `cacheComponents`**: 기본으로 켜져 있어 세션 쿠키를 읽는 페이지가 Suspense 밖에서 오류를 낸다. 모든 화면이 로그인 상태에 따라 달라지는 서비스라 껐다.
