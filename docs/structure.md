# 폴더 구조와 수정 위치

```text
src/
├─ components/
│  ├─ layout/         Header, Footer: 모든 페이지의 공통 UI
│  ├─ home/           Hero, ComingSoon: 홈의 화면 단위 섹션
│  ├─ content/        EntryCard: 글·프로젝트에서 함께 쓰는 카드
│  └─ ui/             PointerIcon: 작은 공통 UI
├─ content/
│  ├─ blog/           Markdown 기술 글
│  └─ projects/       Markdown 프로젝트 소개
├─ data/site.ts       메뉴·프로필 링크·소개·번역
├─ layouts/           BaseLayout, PostLayout: 페이지 공통 틀
├─ lib/content.ts     공개 글 필터·날짜·정렬
├─ pages/             URL에 대응하는 페이지; 기존 주소 유지
├─ scripts/
│  ├─ site.js         공통 언어 선택·프로필 링크·알림
│  └─ home/           홈 전용 입자 애니메이션·오프닝·화면 스크롤
├─ styles/
│  ├─ global.css      색상·폰트·기본 요소·공통 CSS 진입점
│  ├─ header.css      두 줄 헤더와 메뉴
│  ├─ footer.css      공통 하단 정보
│  ├─ content.css     일반 페이지·목록 카드
│  ├─ prose.css       Markdown 본문
│  ├─ light.css       TECH BLOG의 밝은 본문·푸터 테마
│  ├─ home.css        홈 레이아웃·Coming Soon·스크롤 스냅 진입점
│  └─ home/
│     ├─ hero.css     홈 이름·소개·Canvas UI
│     └─ entrance.css 첫 진입 문자 비 연출
└─ content.config.ts  Markdown 필드 검증

public/               그대로 공개할 파일: 폰트, EULA, 아이콘, 이미지
scripts/              빌드 결과 검사 도구
docs/                 구조·운영 설명
.github/workflows/    GitHub Pages 자동 배포
```

## 자주 수정하는 위치

| 작업                             | 파일·폴더                                                          |
| -------------------------------- | ------------------------------------------------------------------ |
| 메뉴·외부 링크·소개 수정         | `src/data/site.ts`                                                 |
| 첫 화면의 내용·배치              | `src/components/home/Hero.astro`, `src/styles/home/hero.css`       |
| Coming Soon을 실제 섹션으로 교체 | `src/components/home/ComingSoon.astro`                             |
| 홈에 세 번째 화면 추가           | `src/pages/index.astro`에 `data-screen` 섹션 추가                  |
| 스크롤 감도·화면 전환            | `src/scripts/home/scroll.ts`                                       |
| 글·프로젝트 추가                 | `src/content/blog/`, `src/content/projects/`                       |
| 카드 디자인                      | `src/components/content/EntryCard.astro`, `src/styles/content.css` |
| 글 본문 디자인                   | `src/styles/prose.css`                                             |

`pages`에는 URL에 필요한 파일을 유지하고, 반복되는 UI는 `components`에서 재사용합니다.
홈 애니메이션과 오프닝 CSS·JavaScript는 홈에서만 불러옵니다.

## 자동 생성 폴더

`node_modules/`는 설치 패키지, `.astro/`는 Astro 캐시·타입, `dist/`는 배포 결과입니다.
직접 편집하지 않으며 Git에서 제외합니다. 버전 고정 파일 `pnpm-lock.yaml`은 유지합니다.
`public/fonts`의 원본 라이선스는 삭제하지 않습니다.
