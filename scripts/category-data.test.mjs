import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertCategoryRemovable, categoryPathFromAction, validateCatalog } from './category-data.mjs';

const categories = [
  { file: 'src/data/categories/blog.json', name: '블로그', parent: '' },
  { file: 'src/data/categories/astro.json', name: 'Astro', parent: '블로그' },
  { file: 'src/data/categories/empty.json', name: '빈 분류', parent: '' },
];
const posts = [{ file: 'src/content/blog/example.md', tags: ['Astro', '블로그'] }];

test('글이나 하위 분류가 있는 카테고리는 삭제하지 않는다', () => {
  const catalog = { categories, posts };
  assert.throws(() => assertCategoryRemovable(catalog, categories[0].file), /하위 카테고리/);
  assert.throws(() => assertCategoryRemovable(catalog, categories[1].file), /먼저 재분류/);
  assert.equal(assertCategoryRemovable(catalog, categories[2].file).name, '빈 분류');
});

test('유효하지 않은 글 태그와 카테고리 계층을 거부한다', () => {
  assert.doesNotThrow(() => validateCatalog({ categories, posts }));
  assert.throws(() => validateCatalog({ categories, posts: [{ file: 'x.md', tags: ['없는 분류'] }] }), /등록되지 않은/);
  assert.throws(() => validateCatalog({ categories: [...categories, { file: 'x.json', name: '손자', parent: 'Astro' }], posts }), /두 단계/);
});

test('삭제 액션은 대상 저장소의 카테고리 파일만 허용한다', () => {
  const payload = {
    source: 'pages-cms', action: { name: 'delete-unused-category' },
    context: { type: 'entry', name: 'categories', path: categories[2].file },
    repository: { owner: 'mldlcl2022', repo: 'mldlcl2022.github.io', ref: 'main' },
  };
  assert.equal(categoryPathFromAction(payload, process.cwd()).path, categories[2].file);
  assert.throws(() => categoryPathFromAction({ ...payload, context: { ...payload.context, path: 'src/data/categories/../../x.json' } }, process.cwd()), /잘못된/);
  assert.throws(() => categoryPathFromAction({ ...payload, repository: { ...payload.repository, ref: 'develop' } }, process.cwd()), /유효한/);
});

test('실제 삭제 명령은 사용 중인 분류를 남기고 빈 분류만 지운다', async () => {
  const root = await mkdtemp(join(tmpdir(), 'blog-cms-categories-'));
  try {
    const categoryFolder = join(root, 'src/data/categories');
    const postFolder = join(root, 'src/content/blog');
    await mkdir(categoryFolder, { recursive: true });
    await mkdir(postFolder, { recursive: true });
    for (const category of categories) {
      await writeFile(join(root, category.file), JSON.stringify({ name: category.name, parent: category.parent }));
    }
    await writeFile(join(postFolder, 'example.md'), '---\ntags:\n  - Astro\n---\n본문\n');
    const run = file => spawnSync(process.execPath, [fileURLToPath(new URL('./delete-category.mjs', import.meta.url))], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PAGES_CMS_PAYLOAD: JSON.stringify({
        source: 'pages-cms', action: { name: 'delete-unused-category' },
        context: { type: 'entry', name: 'categories', path: file },
        repository: { owner: 'mldlcl2022', repo: 'mldlcl2022.github.io', ref: 'main' },
      }) },
    });
    const used = run(categories[1].file);
    assert.notEqual(used.status, 0);
    assert.match(used.stderr, /먼저 재분류/);
    assert.ok(await readFile(join(root, categories[1].file)));
    const empty = run(categories[2].file);
    assert.equal(empty.status, 0, empty.stderr);
    await assert.rejects(readFile(join(root, categories[2].file)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
