import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createContext, runInContext } from 'node:vm';

const source = stripTypeScriptTypes(readFileSync(new URL('../src/scripts/blog.ts', import.meta.url), 'utf8'));

function page(search = '') {
  const query = { value: '' }, count = { textContent: '' }, empty = { hidden: true };
  const posts = [
    { dataset: { title: 'Astro 시작', content: '한글 본문 검색', tags: '["Astro"]' } },
    { dataset: { title: '다른 글', content: 'TypeScript example', tags: '["TypeScript"]' } },
  ];
  const filters = ['', '블로그', 'Astro'].map(tag => ({
    dataset: { filter: tag, ...(tag === '블로그' ? { filterTags: '["블로그","Astro"]' } : {}) },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
  }));
  const handlers = {};
  const location = { search };
  const elements = {
    '#blog-query': query, '#post-count': count, '#blog-empty': empty,
    '.blog-search': { addEventListener: (name, callback) => { handlers[name] = callback; } },
  };
  const context = createContext({
    document: {
      querySelector: selector => elements[selector],
      querySelectorAll: selector => selector === '[data-filter]' ? filters : posts,
    },
    location, URLSearchParams,
    history: { pushState: (_state, _title, url) => { location.search = new URL(url, 'https://example.com').search; } },
    addEventListener: (name, callback) => { handlers[name] = callback; },
  });
  runInContext(source, context);
  return { query, count, empty, posts, filters, handlers, location };
}

test('제목·본문 검색은 대소문자를 구분하지 않는다', () => {
  for (const search of ['?q=astro', '?q=한글', '?q=TYPESCRIPT']) {
    const browser = page(search);
    assert.equal(browser.count.textContent, '1');
    assert.equal(browser.empty.hidden, true);
  }
});

test('부모 카테고리는 자식 태그 글을 포함하며 검색 조건도 함께 적용한다', () => {
  const browser = page('?tag=블로그&q=한글');
  assert.equal(browser.posts[0].hidden, false);
  assert.equal(browser.posts[1].hidden, true);
  assert.equal(browser.filters[1]['aria-current'], 'page');
  assert.equal(browser.count.textContent, '1');
});

test('검색 결과가 없으면 빈 상태를 표시한다', () => {
  const browser = page('?q=없는단어');
  assert.equal(browser.count.textContent, '0');
  assert.equal(browser.empty.hidden, false);
});

test('엔터 검색은 카테고리를 해제하고 뒤로 가기로 필터를 복원한다', () => {
  const browser = page('?tag=Astro');
  browser.query.value = ' TypeScript ';
  let prevented = false;
  browser.handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(browser.location.search, '?q=TypeScript');
  assert.equal(browser.posts[1].hidden, false);
  browser.location.search = '?tag=Astro';
  browser.handlers.popstate();
  assert.equal(browser.query.value, '');
  assert.equal(browser.posts[0].hidden, false);
  assert.equal(browser.posts[1].hidden, true);
});
