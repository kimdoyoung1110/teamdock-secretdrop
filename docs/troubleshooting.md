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
- **한쪽에서 로그아웃해도 다른 쪽 세션이 남음**: 강의 마지막 슬라이드와 같은 상황. SecretDrop에서 로그아웃해 Keycloak 세션이 끝났는데도 TeamDock은 자기 쿠키가 살아 있어 계속 로그인 상태였다. Back-Channel Logout으로 해결했다. Keycloak이 각 앱의 `/api/backchannel-logout`에 서명된 `logout_token`을 직접 보내고, 앱은 서명 검증 후 그 `sid`를 `revoked_sessions`에 기록해 이후 요청에서 로그아웃 처리한다.
- **JWT 세션은 서버에서 지울 수 없음**: 앱 세션이 쿠키 안의 JWT라서 Back-Channel 요청(브라우저를 거치지 않음)으로는 쿠키를 지울 방법이 없다. 세션 저장소를 따로 두는 대신 "끊긴 sid 목록"만 DB에 두고 요청마다 대조한다.
- **컨테이너에서 호스트의 앱 호출**: Keycloak은 컨테이너 안에 있어 `localhost:9000`으로는 앱에 닿지 않는다. Back-Channel URL은 `host.docker.internal`로 등록했다.
- **오래된 세션으로 로그아웃하면 확인 화면**: 이미 끝난 Keycloak 세션의 `id_token_hint`로 로그아웃을 요청하면 Keycloak이 바로 돌려보내지 않고 "로그아웃하시겠습니까?" 확인 화면을 띄운다. Back-Channel Logout 적용 후에는 끊긴 세션이 앱에서도 로그아웃 처리되어 이 경로로 들어오지 않는다.
- **Keycloak을 Vercel에 못 올림**: Vercel은 요청마다 잠깐 실행되는 함수만 돌린다. Keycloak은 계속 떠 있어야 하는 Java 서버라 컨테이너를 돌릴 수 있는 Cloud Run에 따로 올렸다.
- **로컬과 운영의 realm 설정 이원화**: redirect URI와 Client Secret이 환경마다 달라 파일을 두 개 관리해야 할 뻔했다. Keycloak의 realm import가 `${변수:기본값}` 치환을 지원해서 파일 하나로 통일했다. 로컬은 기본값, 운영은 Cloud Run 환경변수가 들어간다.
- **Apple Silicon에서 빌드한 이미지**: Cloud Run은 amd64만 실행한다. Mac에서 그냥 빌드하면 arm64 이미지가 만들어져 실행되지 않으므로 `--platform linux/amd64`로 빌드했다.
- **프록시 뒤의 Keycloak**: Cloud Run이 HTTPS를 끝내고 컨테이너에는 HTTP로 넘긴다. `KC_PROXY_HEADERS=xforwarded`와 `KC_HOSTNAME`을 주지 않으면 Keycloak이 issuer를 `http://`로 만들어 토큰 검증이 깨진다.
- **Neon 연결 방식**: 서버리스인 Vercel 앱은 연결이 자주 생겼다 사라져 pooled 주소를, 연결을 오래 쥐는 Keycloak은 direct 주소를 쓴다.
