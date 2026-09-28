const FAVORITES_KEY = 'spider-quotes:favorites:v1';
const THEME_KEY = 'spider-quotes:theme:v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let catalog = [];
const storedFavorites = readJSON(FAVORITES_KEY, []);
let favorites = new Set(Array.isArray(storedFavorites) ? storedFavorites.filter(id => typeof id === 'string') : []);
let category = '전체';
let toastTimer;
let todaysQuoteId = null;

function readJSON(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
}
function saveFavorites() { try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch { toast('저장 공간이 부족해 즐겨찾기를 저장하지 못했어요.'); } }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2300); }
function make(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; }
function currentRoute() { const [name = 'today', id] = location.hash.replace(/^#\/?/, '').split('/'); return { name: ['today', 'quotes', 'favorites', 'settings', 'quote'].includes(name) ? name : 'today', id }; }
function navigate() {
  const route = currentRoute();
  const viewName = route.name === 'quote' ? 'detail' : route.name;
  $$('.view').forEach(view => { view.hidden = view.dataset.view !== viewName; });
  $$('.bottom-nav a').forEach(link => { link.classList.toggle('is-active', link.dataset.nav === viewName || (viewName === 'detail' && link.dataset.nav === 'quotes')); });
  $('#settings-open').classList.toggle('is-active', viewName === 'settings');
  if (viewName === 'today') renderToday();
  if (viewName === 'quotes') renderQuotes();
  if (viewName === 'favorites') renderFavorites();
  if (viewName === 'detail') renderDetail(route.id);
  window.scrollTo(0, 0);
}
function quoteCard(quote, { featured = false, detail = false } = {}) {
  const article = make('article', `quote-card${featured ? ' quote-card--featured' : ''}${detail ? ' quote-card--detail' : ''}`);
  article.style.setProperty('--art', `url("./assets/city-${(Number(quote.id.split('-').at(-1)) - 1) % 4 + 1}.svg")`);
  const top = make('div', 'quote-card__top');
  top.append(make('span', 'quote-kicker', featured ? 'TODAY’S THOUGHT' : quote.category.toUpperCase()));
  const fav = make('button', 'star-button', favorites.has(quote.id) ? '★' : '☆'); fav.type = 'button'; fav.dataset.favorite = quote.id; fav.setAttribute('aria-pressed', String(favorites.has(quote.id))); fav.setAttribute('aria-label', favorites.has(quote.id) ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'); top.append(fav); article.append(top);
  const text = make(detail ? 'blockquote' : 'p', 'quote-card__text', `“${quote.textKo}”`); article.append(text);
  const meta = make('div', 'quote-card__meta'); meta.append(make('span', 'author-mark', '✳'), make('span', '', '오리지널 문장'), make('span', 'meta-separator', '·'), make('span', '', quote.category)); article.append(meta);
  if (detail) {
    const credits = [quote.speaker, quote.work, quote.year].filter(value => value != null && value !== '');
    if (credits.length) article.append(make('p', 'detail-credit', credits.join(' · ')));
    const tags = make('div', 'detail-tags'); quote.tags.forEach(tag => tags.append(make('span', 'chip', `#${tag}`))); article.append(tags);
    const note = make('p', 'rights-note', '책임·용기·친절의 주제에서 영감을 받아 새로 쓴 문장입니다. 기존 작품의 대사나 번역문이 아닙니다.'); article.append(note);
    const actions = make('div', 'detail-actions'); const share = make('button', 'button button--primary', '↗ 문장 공유'); share.type = 'button'; share.dataset.share = quote.id; actions.append(share); article.append(actions);
  }
  if (!featured && !detail) { const open = make('a', 'quote-open', '자세히 보기 →'); open.href = `#/quote/${quote.id}`; article.append(open); }
  return article;
}
function renderToday() {
  const now = new Date(); $('#today-date').textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now);
  const index = Math.abs(hash(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}|${catalog.length}`)) % catalog.length;
  const quote = catalog[index]; todaysQuoteId = quote.id; $('#today-card').replaceChildren(quoteCard(quote, { featured: true }));
  const button = $('#today-favorite'); button.setAttribute('aria-pressed', String(favorites.has(quote.id))); button.innerHTML = `${favorites.has(quote.id) ? '★' : '☆'} <span>${favorites.has(quote.id) ? '저장됨' : '저장'}</span>`; button.dataset.favorite = quote.id;
}
function hash(value) { let n = 2166136261; for (const c of value) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); } return n >>> 0; }
function renderCategories() {
  const root = $('#categories'); root.replaceChildren();
  ['전체', ...new Set(catalog.map(q => q.category))].forEach(name => { const button = make('button', `chip-button${category === name ? ' is-active' : ''}`, name); button.type = 'button'; button.dataset.category = name; button.setAttribute('aria-pressed', String(category === name)); root.append(button); });
}
function matches(q, query) { if (!query) return true; const haystack = [q.textKo, q.speaker, q.work, q.category, ...q.tags].join(' ').toLocaleLowerCase('ko'); return haystack.includes(query.toLocaleLowerCase('ko')); }
function renderQuotes() {
  renderCategories(); const query = $('#search').value.trim();
  const rows = catalog.filter(q => (category === '전체' || q.category === category) && matches(q, query));
  $('#result-count').textContent = `${rows.length}개의 문장`;
  $('#quote-list').replaceChildren(...rows.map(q => quoteCard(q)));
  $('#no-results').hidden = rows.length > 0;
}
function renderFavorites() {
  const rows = catalog.filter(q => favorites.has(q.id)); $('#favorite-list').replaceChildren(...rows.map(q => quoteCard(q)));
  $('#favorites-empty').hidden = rows.length > 0;
}
function renderDetail(id) { const quote = catalog.find(q => q.id === id); if (!quote) { location.hash = '#/quotes'; return; } $('#detail-card').replaceChildren(quoteCard(quote, { detail: true })); }
function toggleFavorite(id) { if (favorites.has(id)) { favorites.delete(id); toast('즐겨찾기에서 제거했어요.'); } else { favorites.add(id); toast('즐겨찾기에 저장했어요.'); } saveFavorites(); navigate(); }
async function shareQuote(id) {
  const q = catalog.find(item => item.id === id); if (!q) return;
  const text = `“${q.textKo}”\n— Spider Quotes · ${q.category}`;
  try { if (navigator.share) await navigator.share({ title: 'Spider Quotes', text }); else throw new Error('share unavailable'); }
  catch (error) { if (error.name === 'AbortError') return; try { await navigator.clipboard.writeText(text); toast('문장을 클립보드에 복사했어요.'); } catch { window.prompt('문장을 복사하세요', text); } }
}
function applyTheme(value) { if (value === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = value; }
function setup() {
  let theme = 'system'; try { theme = localStorage.getItem(THEME_KEY) || 'system'; } catch { /* 테마 저장이 불가하면 기기 테마 사용 */ }
  if (!['system', 'light', 'dark'].includes(theme)) theme = 'system'; applyTheme(theme); const radio = $(`input[name="theme"][value="${theme}"]`); if (radio) radio.checked = true;
  addEventListener('hashchange', navigate);
  $('#settings-open').addEventListener('click', () => { location.hash = '#/settings'; });
  $('#search').addEventListener('input', renderQuotes);
  $('#categories').addEventListener('click', e => { const button = e.target.closest('[data-category]'); if (button) { category = button.dataset.category; renderQuotes(); } });
  $('#clear-search').addEventListener('click', () => { $('#search').value = ''; renderQuotes(); $('#search').focus(); });
  $('#detail-back').addEventListener('click', () => { location.hash = '#/quotes'; });
  $('#today-share').addEventListener('click', () => shareQuote(todaysQuoteId));
  document.addEventListener('click', e => { const favorite = e.target.closest('[data-favorite]'); if (favorite) toggleFavorite(favorite.dataset.favorite); const share = e.target.closest('[data-share]'); if (share) shareQuote(share.dataset.share); });
  $$('input[name="theme"]').forEach(input => input.addEventListener('change', () => { try { localStorage.setItem(THEME_KEY, input.value); } catch { toast('테마를 저장하지 못했어요.'); } applyTheme(input.value); }));
  if ('serviceWorker' in navigator && isSecureContext) navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('오프라인 지원을 준비하지 못했습니다.', error));
}
try {
  const response = await fetch('./data/quotes.json'); if (!response.ok) throw new Error('문장 카탈로그를 불러오지 못했습니다.');
  catalog = (await response.json()).filter(q => q.rightsStatus === 'approved-for-use' && q.contentType === 'original' && q.textKo);
  if (!catalog.length) throw new Error('사용할 수 있는 문장이 없습니다.');
  setup(); navigate();
} catch (error) {
  document.querySelector('main').innerHTML = '<section class="load-error"><h1>문장을 불러오지 못했어요.</h1><p>네트워크 연결을 확인하고 다시 시도해 주세요.</p><button class="button button--primary" onclick="location.reload()">다시 시도</button></section>';
  console.error(error);
}
