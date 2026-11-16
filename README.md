# Chan Lee · Portfolio & Tech Blog

Astro 기반 포트폴리오와 기술 블로그입니다. 기존 ver1 디자인과 화면 주소를 유지합니다.

## 실행과 검증

Node.js 24 LTS와 pnpm 11을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
pnpm verify:build
pnpm preview
```

개발 서버는 기본적으로 http://localhost:4321 에서 실행됩니다.
`check`는 타입, `verify:build`는 배포 페이지·로컬 링크·공개 콘텐츠 수를 검사합니다.

## 수정 안내

- [폴더 구조와 수정 위치](docs/structure.md)
- 소개·메뉴·외부 링크: `src/data/site.ts`
- 홈 화면: `src/components/home/`, `src/styles/home.css`, `src/styles/home/`
- 홈 동작: `src/scripts/home/`
- 기술 글: `src/content/blog/`
- 프로젝트 소개: `src/content/projects/`

글은 Markdown에 `title`, `description`, `date`, `tags`, `draft`를 작성합니다.
`draft: true`는 목록과 상세 페이지에서 제외됩니다. 프로젝트에는 `github` 링크를 추가할 수 있습니다.
현재 예시 콘텐츠는 교체하거나 삭제할 수 있습니다.

## 폰트와 언어

이름과 메뉴는 Disket Mono를 사용합니다. 제목 `Per Aspera Ad Astra`와 `AI Researcher`, 프로필 링크는 대소문자가 구분되는 Consolas 계열을 사용합니다. 폰트 라이선스는 `public/fonts/`에 보존합니다.

KO/EN은 공통 문구와 홈 소개에 적용되며 Markdown 본문은 작성한 언어로 표시합니다.
첫 언어 감지에는 `api.country.is`를 사용하며 방문자 IP가 전달됩니다.
`src/data/site.ts`의 `countryEndpoint`를 빈 문자열로 바꾸면 브라우저 언어만 사용합니다.
ABOUT은 Notion, LinkedIn과 Life Blog는 개인 프로필로 연결됩니다. 빈 CV·Service 링크는 준비 중 안내를 표시합니다.

## 배포

GitHub Settings → Pages → Source를 GitHub Actions로 설정합니다.
`main`에 push하면 `.github/workflows/deploy.yml`이 검사·빌드 후 `dist/`를 배포합니다.
개인 도메인이 확정되면 `astro.config.mjs`의 주소와 `public/CNAME`을 설정합니다.
개발 작업은 develop에서 진행하고, 검증 후 main에 merge하여 배포합니다.

기존 `D:/works/mldlcl2022.github.io ver1` 폴더는 변경하지 않았습니다.
