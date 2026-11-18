# Chan Lee · Portfolio & Tech Blog

Astro 기반 포트폴리오와 기술 블로그입니다. 기존 ver1 디자인과 화면 주소를 유지합니다.

## 실행과 검증

Node.js 24 LTS와 pnpm 11을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test:entrance
pnpm test:blog
pnpm test:hero
pnpm test:categories
pnpm validate:content
node --test services/visitor-counter/worker.test.mjs
pnpm build
pnpm verify:build
pnpm preview
```

개발 서버는 기본적으로 http://localhost:4321 에서 실행됩니다.
`check`는 타입, `verify:build`는 배포 페이지·로컬 링크·공개 콘텐츠 수를 검사합니다.
`test:blog`는 검색·카테고리·뒤로 가기, `test:hero`는 일시정지·탭 전환 시 프레임 예약을 검사합니다.

## 수정 안내

- [폴더 구조와 수정 위치](docs/structure.md)
- [2일차-2 인수인계 및 다음 작업 명세](docs/handoff-2026-11-17-day2-2.md)
- [2026-11-18 작업 인수인계](docs/handoff-2026-11-18.md)
- [웹에서 글과 카테고리 편집하기](docs/cms.md)
- 소개·메뉴·외부 링크: `src/data/site.ts`
- 홈 화면: `src/components/home/`, `src/styles/home.css`, `src/styles/home/`
- 홈 동작: `src/scripts/home/`
- 기술 글: `src/content/blog/`
- 프로젝트 소개: `src/content/projects/`

글은 Markdown에 `title`, `description`, `date`, `tags`, `draft`를 작성합니다. Pages CMS 연결 후에는 웹 편집기에서도 같은 파일을 편집할 수 있습니다.
블로그 작성 시간은 `time: "14:30"`처럼 한국 시간의 24시간 형식으로 추가합니다. 시간이 없는 기존 글은 목록에서 `시간 미기록`으로 표시합니다. 목록의 미리보기는 본문 앞부분을 두 줄까지 표시합니다.
`draft: true`는 목록과 상세 페이지에서 제외됩니다. 프로젝트에는 `github` 링크를 추가할 수 있습니다.
현재 예시 콘텐츠는 교체하거나 삭제할 수 있습니다.

HOME의 문자 비 오프닝은 페이지를 열 때마다 재생하며, 운영체제의 동작 줄이기 설정이나 이전 재생 기록으로 생략하지 않습니다.

## 폰트와 언어

한글은 프로젝트에 포함한 Pretendard Variable 1.3.9를 사용합니다. 이름과 메뉴는 Disket Mono를 사용합니다. 제목 `Per Aspera Ad Astra`와 `AI Researcher`, 프로필 링크는 대소문자가 구분되는 Consolas 계열을 사용합니다. 영문 전용 폰트에서도 한글은 Pretendard로 표시합니다. 폰트와 라이선스는 `public/fonts/`에 보존합니다.

한국어 독자를 대상으로 한국어 화면을 제공합니다. 언어 선택과 국가·브라우저 언어에 따른 자동 전환은 사용하지 않습니다.
ABOUT은 Notion, LinkedIn과 Life Blog는 개인 프로필로 연결됩니다. 빈 CV·Service 링크는 준비 중 안내를 표시합니다.

## 배포

방문자 수 박스와 실제 집계 서버 연결 방법은 [방문자 집계 연결](docs/visitor-counter.md)을 참고합니다.

GitHub Settings → Pages → Source를 GitHub Actions로 설정합니다.
`main`에 push하면 `.github/workflows/deploy.yml`이 검사·빌드 후 `dist/`를 배포합니다.
개인 도메인이 확정되면 `astro.config.mjs`의 주소와 `public/CNAME`을 설정합니다.
개발 작업은 develop에서 진행하고, 검증 후 main에 merge하여 배포합니다.

기존 `D:/works/mldlcl2022.github.io ver1` 폴더는 변경하지 않았습니다.
