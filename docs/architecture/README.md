# 아키텍처 다이어그램

- `architecture.png`: README에 들어가는 그림
- `architecture.html`: 같은 그림의 HTML 판. 로고와 글꼴이 파일 안에 들어 있어 그대로 열린다.
- `architecture.src.html`: 원본. 노드 좌표, 그룹, 화살표를 여기서 고친다.
- `build.mjs`: 원본에 `icons/`, `fonts/`를 넣어 `architecture.html`을 만든다(`pnpm docs:diagrams`).

PNG는 `architecture.html`을 브라우저에서 열어 `.page` 영역을 캡처한 것이다.

## 출처

- 레이아웃과 스타일: [stack-diagram](https://github.com/caru-ini/stack-diagram)의 템플릿(MIT, `LICENSE-stack-diagram.txt`). 좌표 규칙은 그 저장소의 `references/geometry.md`를 따랐다.
- 글꼴: Geist, JetBrains Mono (SIL OFL 1.1, `fonts/`의 라이선스 파일)
- 로고: stack-diagram의 `fetch_icons.py`로 받은 공식 로고. 출처는 [svgl](https://svgl.app)(Next.js, Auth.js, Drizzle, Keycloak, PostgreSQL, Neon, Vercel, GitHub, Google Cloud), Google Cloud product icons(Artifact Registry, Cloud Run), [Lucide](https://lucide.dev)(열쇠 아이콘)다. 각 로고는 해당 소유자의 상표이며 색을 바꾸지 않았다.
