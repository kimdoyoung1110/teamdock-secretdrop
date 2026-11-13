# 운영용 Keycloak 이미지 (Cloud Run).
# 빌드 단계에서 DB 종류 등 고정 설정을 미리 구워 두면(--optimized) 컨테이너가 깨어나는 시간이 줄어든다.
FROM quay.io/keycloak/keycloak:26.4 AS builder
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_CACHE=local
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
# realm 설정은 로컬과 같은 파일을 쓴다. 주소와 비밀값은 실행 시 환경변수로 채워진다.
COPY realm-export.json /opt/keycloak/data/import/teamdock-realm.json

# Cloud Run이 HTTPS를 끝내고 컨테이너에는 HTTP로 전달한다.
ENV KC_HTTP_ENABLED=true \
    KC_HTTP_PORT=8080 \
    KC_PROXY_HEADERS=xforwarded
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--optimized", "--import-realm"]
