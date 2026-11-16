import { site, visitorCounterEndpoint } from '../data/site';

const endpoint = import.meta.env.PUBLIC_VISITOR_COUNTER_URL?.trim() || visitorCounterEndpoint;
const status = document.querySelector('[data-visitor-status]');
// Preview and local development must never increase the public counter.
const productionSite = location.origin === new URL(site.url).origin;
if (endpoint && (productionSite || import.meta.env.DEV)) {
  if (status) status.textContent = '불러오는 중…';
  let visitorId = null;
  if (productionSite) {
    try {
      visitorId = localStorage.getItem('blog-visitor-id');
      if (!visitorId || !/^[a-f\d-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('blog-visitor-id', visitorId);
      }
    } catch {
      // Without persistent storage, read totals without inventing a new visitor.
      visitorId = null;
    }
  }
  fetch(endpoint, {
    method: visitorId ? 'POST' : 'GET',
    headers: visitorId ? { 'Content-Type': 'application/json' } : undefined,
    body: visitorId ? JSON.stringify({ visitorId }) : undefined,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(5000),
  }).then(async response => {
    if (!response.ok) throw new Error('Visitor count unavailable');
    const stats = await response.json();
    if (!['today', 'yesterday', 'total'].every(key => Number.isSafeInteger(stats[key]) && stats[key] >= 0)) {
      throw new Error('Invalid visitor counts');
    }
    document.querySelectorAll('[data-visitors]').forEach(element => {
      element.textContent = stats[element.dataset.visitors].toLocaleString('ko-KR');
    });
    if (status) status.hidden = true;
  }).catch(() => {
    if (status) status.textContent = '통계를 불러올 수 없습니다.';
  });
}
