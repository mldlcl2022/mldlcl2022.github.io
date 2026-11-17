const query = document.querySelector<HTMLInputElement>('#blog-query')!;
const countLabel = document.querySelector('#post-count')!;
const emptyState = document.querySelector<HTMLElement>('#blog-empty')!;
// Prepare immutable search data once, rather than reparsing every submitted query.
const filters = [...document.querySelectorAll<HTMLAnchorElement>('[data-filter]')].map(link => ({
  link,
  tag: link.dataset.filter!,
  tags: new Set<string>(link.dataset.filterTags ? JSON.parse(link.dataset.filterTags) : [link.dataset.filter!]),
}));
const posts = [...document.querySelectorAll<HTMLElement>('[data-post]')].map(element => ({
  element,
  tags: JSON.parse(element.dataset.tags!) as string[],
  text: `${element.dataset.title} ${element.dataset.content}`.toLocaleLowerCase(),
}));

function applyFilters() {
  const params = new URLSearchParams(location.search);
  const tag = params.get('tag') ?? '';
  const categoryTags = filters.find(filter => filter.tag === tag)?.tags ?? new Set([tag]);
  const term = (params.get('q') ?? '').trim().toLocaleLowerCase();
  query.value = params.get('q') ?? '';
  let count = 0;
  for (const post of posts) {
    post.element.hidden = Boolean(
      (tag && !post.tags.some(value => categoryTags.has(value))) ||
      (term && !post.text.includes(term)),
    );
    if (!post.element.hidden) count++;
  }
  for (const filter of filters) {
    if (filter.tag === tag) filter.link.setAttribute('aria-current', 'page');
    else filter.link.removeAttribute('aria-current');
  }
  countLabel.textContent = String(count);
  emptyState.hidden = count > 0;
}

document.querySelector('.blog-search')!.addEventListener('submit', event => {
  event.preventDefault();
  const params = new URLSearchParams(location.search);
  params.delete('tag');
  const term = query.value.trim();
  if (term) params.set('q', term);
  else params.delete('q');
  history.pushState(null, '', `/blog/${params.size ? `?${params}` : ''}`);
  applyFilters();
});
addEventListener('popstate', applyFilters);
applyFilters();
