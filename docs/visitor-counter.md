# 방문자 집계 연결

오른쪽 방문자 수는 오늘·어제·전체 순서이며, 카테고리와 안쪽 여백·줄 높이를 공유합니다.
아직 서버를 연결하지 않았다면 숫자 대신 `—`와 `집계 준비 중`을 표시합니다.

현재 서버는 `https://chan-blog-visitors.mldlcl2022.workers.dev/`에 배포되어 있습니다.
`src/data/site.ts`의 `visitorCounterEndpoint`에 연결되어 있어 GitHub 변수 없이도 다음 블로그 빌드부터 사용합니다.
로컬 `http://127.0.0.1:4330` 미리보기에서는 실제 통계만 조회하며, 방문 수는 증가시키지 않습니다.

## 집계 기준

- 사이트 전체 페이지 방문을 집계합니다. 같은 브라우저는 한국 시간 기준 하루 한 번만 증가합니다.
- 전체는 일별 방문자 수의 누적 합입니다. 서로 다른 날짜의 재방문은 각각 포함합니다.
- 브라우저에 임의 ID를 저장하며, 서버에는 날짜와 함께 해시한 값만 저장합니다. IP·이름·이메일을 저장하지 않습니다.
- 저장소를 차단한 브라우저는 조회만 합니다. 시크릿 창·다른 기기·저장소 삭제 시에는 별도 방문자로 집계될 수 있습니다.
- localhost와 미리보기는 집계하지 않습니다. 연결 전의 방문 기록은 소급 집계하지 않습니다.
- 공개 카운터이므로 악의적인 요청·봇까지 완벽하게 구분하는 분석 서비스는 아닙니다. Cloudflare 자체 요청 로그의 보존 정책은 계정 설정을 따릅니다.

## Cloudflare 최초 설정

GitHub Pages는 그대로 사용하고, 집계 서버와 DB만 Cloudflare에 둡니다.
계정 생성·로그인은 본인이 진행합니다. API 키를 채팅이나 저장소에 올리지 않습니다.

1. [Cloudflare](https://dash.cloudflare.com/) 계정을 만들고 터미널에서 다음 명령을 실행합니다.

   ```powershell
   Set-Location D:\works\mldlcl2022.github.io\services\visitor-counter
   pnpm dlx wrangler login --scopes account:read user:read workers:write workers_scripts:write d1:write
   pnpm dlx wrangler d1 create chan-blog-visitors
   ```

2. 출력된 `database_id`를 이 폴더의 `wrangler.jsonc` 안 `REPLACE_WITH_D1_DATABASE_ID`에 넣습니다.

3. 테이블 생성 후 집계 서버를 배포합니다.

   ```powershell
   pnpm dlx wrangler d1 execute chan-blog-visitors --remote --file=./schema.sql
   pnpm dlx wrangler deploy
   ```

4. 출력된 `https://chan-blog-visitors.<계정>.workers.dev/` 주소를 `src/data/site.ts`의 `visitorCounterEndpoint`에 입력합니다. 비밀 키가 아니라 공개 API 주소입니다. 현재 저장소는 실제 배포 주소가 이미 입력되어 있습니다.

   선택 사항으로 GitHub 저장소 Settings → Secrets and variables → Actions → Variables에 `PUBLIC_VISITOR_COUNTER_URL`을 등록하면 이 값을 우선 사용합니다.

5. 블로그를 다시 빌드·배포하면 집계를 시작합니다. API 설정을 바꾸면 재빌드해야 합니다.

개인 도메인으로 변경하면 `wrangler.jsonc`의 `ALLOWED_ORIGIN`과 `src/data/site.ts`의 `site.url`을 함께 수정하고 재배포합니다.

## 검증

```powershell
node --test services/visitor-counter/worker.test.mjs
```

한국 자정 전환, 같은 날 중복 집계 방지, 누적·어제 통계, 잘못된 입력과 허용 출처를 SQLite로 검사합니다.
Cloudflare에 실제 연결한 뒤에는 공식 사이트에서 방문 → 새로고침 → 다른 브라우저 방문 순서로 숫자를 확인합니다.

공식 참고: [D1 시작하기](https://developers.cloudflare.com/d1/get-started/), [D1 batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/).
