# 트러블슈팅 기록

PPT 트러블슈팅 슬라이드 소재. 겪은 문제를 한 항목씩 남긴다.

- **8080 포트 충돌**: 로컬에서 다른 컨테이너가 8080을 쓰고 있어 Keycloak을 8180으로 옮겼다. issuer는 요청 주소에서 만들어지므로 앱의 issuer 설정도 `http://localhost:8180/realms/teamdock`로 맞춰야 한다.
- **`ssl_required` 로그인 오류**: realm의 `sslRequired`가 `external`이면 사설 IP가 아닌 요청에 HTTPS를 강제한다. Docker Desktop을 거친 요청이 Keycloak에는 외부 IP로 보여서 localhost인데도 막혔다. 개발용 realm은 `none`으로 두고, 운영은 HTTPS라 `external`을 쓴다. 관리자 콘솔(master realm)은 `pnpm infra:admin-http`로 한 번 풀어 준다.
- **realm 재import 안 됨**: `--import-realm`은 realm이 이미 있으면 건너뛴다. `realm-export.json`을 고친 뒤에는 `pnpm infra:reset`으로 볼륨을 지우고 다시 띄워야 반영된다.
- **localhost 쿠키 충돌**: 쿠키는 포트를 구분하지 않아 `localhost:9000`과 `9001`이 Auth.js 기본 쿠키 이름(`authjs.*`)을 같이 쓰면 서로의 세션과 PKCE 값을 덮어쓴다. 세션뿐 아니라 state, pkce, callback-url 쿠키까지 앱별 접두어(`teamdock.*`, `secretdrop.*`)를 붙였다.
- **앱만 로그아웃하면 바로 다시 로그인됨**: 앱 세션 쿠키만 지우면 Keycloak 세션이 살아 있어 다음 접근에서 화면 없이 재로그인된다. 로그아웃 시 Keycloak `end_session` 엔드포인트로 `id_token_hint`와 함께 보내야 SSO 세션까지 끝난다.
- **Next.js 16 템플릿의 `cacheComponents`**: 기본으로 켜져 있어 세션 쿠키를 읽는 페이지가 Suspense 밖에서 오류를 낸다. 모든 화면이 로그인 상태에 따라 달라지는 서비스라 껐다.
- **링크 미리보기가 시크릿을 태움**: 페이지를 여는 것만으로 파기하면 카카오톡 같은 메신저의 링크 미리보기 봇이 먼저 열어 버린다. 페이지 로드는 메타데이터만 보여 주고, "시크릿 열기" 버튼을 눌러야 암호문을 내주고 파기하게 했다.
- **로그인을 거치면 `#키`가 사라짐**: 팀 전용 시크릿을 비로그인으로 열면 Keycloak 로그인 폼을 거치는데, 폼 제출은 새 탐색이라 URL fragment가 유지되지 않는다. 떠나기 전에 키를 `sessionStorage`에 맡겼다가 돌아와서 꺼낸다. `sessionStorage`는 서버로 전송되지 않아 E2E 원칙을 깨지 않는다.
- **1회 열람인데 비밀번호를 틀리면**: 암호문을 받는 순간 서버에서 파기되므로, 비밀번호를 틀렸을 때 다시 받을 수 없다. 받은 암호문을 브라우저 메모리에 들고 있어 비밀번호만 다시 시도할 수 있게 했다.
- **Access Token 5분 만료**: SecretDrop이 TeamDock API를 부를 때 쓰는 Access Token은 5분이면 만료된다. Auth.js의 `jwt` 콜백에서 Refresh Token으로 갱신한다.
