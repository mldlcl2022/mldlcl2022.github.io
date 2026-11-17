import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const boot = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const entrance = readFileSync(new URL('../src/scripts/home/entrance.js', import.meta.url), 'utf8')
  .replace('export function startEntrance', 'function startEntrance');

function page({ reduced, seen }) {
  const classes = new Set();
  const frameQueue = new Map();
  const timers = new Map();
  let nextId = 0;
  let drawn = 0;
  let removed = false;
  const root = { classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) } };
  const regions = Array.from({ length: 3 }, () => ({ inert: false }));
  const ctx = { setTransform() {}, clearRect() {}, fillText() { drawn++; } };
  const overlay = { remove() { removed = true; } };
  const canvas = { getContext: () => ctx };
  const elements = { '#boot-screen': overlay, '#boot-rain': canvas, header: regions[0], main: regions[1], footer: regions[2] };
  const context = createContext({
    document: { documentElement: root, querySelector: s => elements[s], querySelectorAll: () => [] },
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: { getItem: () => seen ? '1' : null, setItem() {} },
    innerWidth: 1024, innerHeight: 768, devicePixelRatio: 1,
    requestAnimationFrame(callback) { const id = ++nextId; frameQueue.set(id, callback); return id; },
    cancelAnimationFrame(id) { frameQueue.delete(id); },
    setTimeout(callback) { const id = ++nextId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener() {}, removeEventListener() {},
  });
  context.window = context;
  return {
    context, classes, regions,
    get drawn() { return drawn; },
    get removed() { return removed; },
    frame(now) { const callbacks = [...frameQueue.values()]; frameQueue.clear(); callbacks.forEach(callback => callback(now)); },
    failSafe() { [...timers.values()].forEach(callback => callback()); },
  };
}

for (const settings of [{ reduced: false, seen: false }, { reduced: true, seen: false }, { reduced: true, seen: true }]) {
  test(`문자 비 오프닝을 재생하고 정상 종료한다: ${JSON.stringify(settings)}`, () => {
    const browser = page(settings);
    runInContext(boot, browser.context);
    assert.equal(browser.classes.has('booting'), true);
    runInContext(`${entrance}\nstartEntrance();`, browser.context);
    assert.equal(browser.regions.every(region => region.inert), true);
    browser.frame(0);
    browser.frame(1000);
    assert.ok(browser.drawn > 0, '문자 비 프레임을 실제로 그려야 한다');
    browser.frame(4000);
    assert.equal(browser.classes.has('booting'), false);
    assert.equal(browser.regions.some(region => region.inert), false);
    assert.equal(browser.removed, true);
  });
}

test('같은 페이지의 재진입에도 오프닝을 시작한다', () => {
  const browser = page({ reduced: true, seen: true });
  runInContext(boot, browser.context);
  runInContext(`${entrance}\nstartEntrance();`, browser.context);
  browser.frame(0);
  browser.frame(4000);
  runInContext(boot, browser.context);
  assert.equal(browser.classes.has('booting'), true);
});

test('모듈 로딩 실패 시에도 검은 화면에서 빠져나온다', () => {
  const browser = page({ reduced: true, seen: false });
  runInContext(boot, browser.context);
  browser.failSafe();
  assert.equal(browser.classes.has('booting'), false);
  assert.equal(browser.removed, true);
});
