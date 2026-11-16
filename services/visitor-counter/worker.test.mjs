import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { getStats, dateKeys } from './worker.mjs';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) { return { bind(...values) { return { sql, values }; } }; },
    async batch(queries) {
      sqlite.exec('BEGIN');
      try {
        const result = queries.map(({ sql, values }) => ({ results: sqlite.prepare(sql).all(...values) }));
        sqlite.exec('COMMIT');
        return result;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); },
  };
}
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const day1 = new Date('2026-11-16T14:59:59Z');
const day2 = new Date('2026-11-16T15:00:00Z');

test('한국 자정에 날짜를 전환하고 같은 브라우저는 하루 한 번만 집계한다', async () => {
  const db = database();
  try {
    assert.deepEqual(dateKeys(day1), { today: '2026-11-16', yesterday: '2026-11-15' });
    assert.deepEqual(dateKeys(day2), { today: '2026-11-17', yesterday: '2026-11-16' });
    const counts = (value) => ({ ...value });
    assert.deepEqual(counts(await getStats(db, null, day1)), { today: 0, yesterday: 0, total: 0 });
    assert.deepEqual(counts(await getStats(db, first, day1)), { today: 1, yesterday: 0, total: 1 });
    assert.deepEqual(counts(await getStats(db, first, day1)), { today: 1, yesterday: 0, total: 1 });
    assert.deepEqual(counts(await getStats(db, second, day1)), { today: 2, yesterday: 0, total: 2 });
    assert.deepEqual(counts(await getStats(db, first, day2)), { today: 1, yesterday: 2, total: 3 });
    assert.deepEqual(counts(await getStats(db, null, day2)), { today: 1, yesterday: 2, total: 3 });
  } finally { db.close(); }
});

test('허용 출처, 잘못된 요청, CORS와 중복 POST를 처리한다', async () => {
  const db = database();
  const env = { DB: db, ALLOWED_ORIGIN: 'https://mldlcl2022.github.io' };
  const request = (method, body, origin = env.ALLOWED_ORIGIN) => new Request('https://counter.example/', {
    method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body,
  });
  try {
    assert.equal((await worker.fetch(request('POST', JSON.stringify({ visitorId: first }), 'https://other.example'), env)).status, 403);
    assert.equal((await worker.fetch(request('POST', '{broken'), env)).status, 400);
    assert.equal((await worker.fetch(request('POST', JSON.stringify({ visitorId: 'invalid' })), env)).status, 400);
    assert.equal((await worker.fetch(request('OPTIONS'), env)).status, 204);
    assert.equal((await worker.fetch(request('DELETE'), env)).status, 405);
    const hit = await worker.fetch(request('POST', JSON.stringify({ visitorId: first })), env);
    assert.equal(hit.status, 200);
    assert.equal(hit.headers.get('Access-Control-Allow-Origin'), env.ALLOWED_ORIGIN);
    assert.equal((await hit.json()).total, 1);
    const repeat = await worker.fetch(request('POST', JSON.stringify({ visitorId: first })), env);
    assert.equal((await repeat.json()).total, 1);
  } finally { db.close(); }
});

test('미리보기에서는 통계를 조회할 수 있지만 방문 횟수는 늘릴 수 없다', async () => {
  const db = database();
  const env = { DB: db, ALLOWED_ORIGIN: 'https://mldlcl2022.github.io', PREVIEW_ORIGIN: 'http://127.0.0.1:4330' };
  try {
    const headers = { Origin: env.PREVIEW_ORIGIN, 'Content-Type': 'application/json' };
    const read = await worker.fetch(new Request('https://counter.example/', { headers }), env);
    assert.equal(read.status, 200);
    assert.equal((await read.json()).total, 0);
    const write = await worker.fetch(new Request('https://counter.example/', { method: 'POST', headers, body: JSON.stringify({ visitorId: first }) }), env);
    assert.equal(write.status, 403);
    const stats = await getStats(db);
    assert.equal(stats.total, 0);
  } finally { db.close(); }
});
