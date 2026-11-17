import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const source = readFileSync(new URL('../src/scripts/home/hero-animation.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace('startEntrance();', '');

function page(reducedMotion = false) {
  const frames = new Map(), handlers = {}, motionHandlers = {};
  let nextId = 0, draws = 0;
  const motion = { addEventListener: (name, callback) => { motionHandlers[name] = callback; }, setAttribute() {} };
  const ctx = { clearRect() { draws++; }, setTransform() {}, fillText() {}, beginPath() {}, ellipse() {}, stroke() {} };
  const canvas = { getContext: () => ctx, getBoundingClientRect: () => ({ width: 500, height: 400 }), addEventListener() {} };
  const reduced = { matches: reducedMotion, addEventListener: (_name, callback) => { handlers.motion = callback; } };
  const document = {
    hidden: false,
    querySelector: selector => ({ '#motion': motion, '#construct': {}, '#matrix': canvas })[selector],
    querySelectorAll: () => [],
    addEventListener: (name, callback) => { handlers[name] = callback; },
  };
  runInContext(source, createContext({
    document, messages: { play: '재생', pause: '일시정지' }, matchMedia: () => reduced,
    innerWidth: 1200, devicePixelRatio: 1,
    requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} },
  }));
  return { frames, handlers, document, motionHandlers, get draws() { return draws; } };
}

test('일시정지 중에는 프레임을 요청하지 않고 재생할 때 한 개만 예약한다', () => {
  const browser = page(true);
  assert.equal(browser.frames.size, 0);
  assert.ok(browser.draws > 0, '정지 상태에서도 도형을 그린다');
  browser.motionHandlers.click();
  assert.equal(browser.frames.size, 1);
  browser.motionHandlers.click();
  assert.equal(browser.frames.size, 0);
});

test('숨겨진 탭의 프레임은 취소하고 복귀하면 중복 없이 재개한다', () => {
  const browser = page();
  assert.equal(browser.frames.size, 1);
  browser.document.hidden = true;
  browser.handlers.visibilitychange();
  assert.equal(browser.frames.size, 0);
  browser.document.hidden = false;
  browser.handlers.visibilitychange();
  browser.handlers.visibilitychange();
  assert.equal(browser.frames.size, 1);
  browser.handlers.motion({ matches: true });
  assert.equal(browser.frames.size, 0);
});
