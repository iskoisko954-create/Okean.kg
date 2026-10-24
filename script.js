import * as DB from './firebase.js';
import { t, tr, money, getLang, setLang, LANGS, applyStatic } from './i18n.js';
import { icon } from './icons.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let cats = [], prods = [], active = 'all', query = '', cart = {};
try { cart = JSON.parse(localStorage.getItem('okean.cart')) || {}; } catch { cart = {}; }
const persist = () => localStorage.setItem('okean.cart', JSON.stringify(cart));
let toastTimer;
const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => e.classList.remove('on'), 3200); };

// ---------- entrance ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const splash = $('#splash');
setTimeout(() => splash.classList.add('go'), reduced ? 200 : 2250);
setTimeout(() => { splash.remove(); document.body.classList.remove('intro'); }, reduced ? 500 : 3250);

// ---------- theme ----------
function setTheme(m) {
  document.documentElement.dataset.theme = m; localStorage.setItem('okean.theme', m);
  document.querySelector('meta[name=theme-color]').content = m === 'dark' ? '#07111C' : '#0A3A63';
}
$('#theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setTheme(document.documentElement.dataset.theme);

// ---------- language ----------
$('#lang').innerHTML = Object.keys(LANGS).map(k => `<button data-l="${k}" title="${LANGS[k]}">${k.toUpperCase()}</button>`).join('');
$('#lang').onclick = e => { const b = e.target.closest('[data-l]'); if (b) { setLang(b.dataset.l); render(); } };

// ---------- menu ----------
const orderedCats = () => [...cats].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
const visible = () => {
  const q = query.trim().toLowerCase(), order = orderedCats().map(c => c.id);
  return prods
    .filter(p => (active === 'all' || p.cat === active) && (!q || `${Object.values(p.name || {}).join(' ')} ${Object.values(p.desc || {}).join(' ')}`.toLowerCase().includes(q)))
    .sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || (a.createdAt || 0) - (b.createdAt || 0));
};
const iconOf = p => cats.find(c => c.id === p.cat)?.icon || 'dish';
const thumb = (p, size = 56) => p.img ? `<img loading="lazy" src="${esc(p.img)}" alt="${esc(tr(p.name))}">` : icon(iconOf(p), size);

function renderRail() {
  const items = [{ id: 'all', icon: 'all', name: t('all') }, ...orderedCats().map(c => ({ id: c.id, icon: c.icon, name: tr(c.name) }))];
  $('#rail').innerHTML = items.map(c => `<button class="cat ${c.id === active ? 'on' : ''}" data-cat="${esc(c.id)}" aria-pressed="${c.id === active}"><span class="ring">${icon(c.icon, 26)}</span><span>${esc(c.name)}</span></button>`).join('');
}
const control = p => {
  const n = cart[p.id] || 0, id = esc(p.id);
  return n ? `<div class="step"><button data-d="-1" data-id="${id}" aria-label="−">−</button><b>${n}</b><button data-d="1" data-id="${id}" aria-label="+">+</button></div>`
           : `<button class="add" data-d="1" data-id="${id}" aria-label="${t('add')}">+</button>`;
};
function renderGrid() {
  const list = visible(), cur = cats.find(c => c.id === active);
  $('#secTitle').textContent = active === 'all' ? t('all') : tr(cur?.name);
  $('#secCount').textContent = `${list.length} ${t('dishes')}`;
  $('#none').hidden = list.length > 0;
  $('#grid').innerHTML = list.map((p, i) => `<article class="card ${p.available === false ? 'off' : ''}" style="--n:${Math.min(i, 9)}"><div class="ph">${thumb(p)}${p.available === false ? `<b class="tag">${t('unavailable')}</b>` : ''}</div><h3>${esc(tr(p.name))}</h3><p class="d">${esc(tr(p.desc))}</p><div class="row"><span class="pr">${money(p.price)}</span>${p.available === false ? '' : control(p)}</div></article>`).join('');
}

// ---------- cart ----------
const lines = () => Object.entries(cart).map(([id, n]) => ({ p: prods.find(x => x.id === id), n })).filter(l => l.p && l.p.available !== false);
const total = () => lines().reduce((s, l) => s + Number(l.p.price) * l.n, 0);
function renderCart() {
  const L = lines(), count = L.reduce((s, l) => s + l.n, 0);
  $('#bar').hidden = !count;
  $('#bar').innerHTML = `<span>${count} ×</span><span>${t('view')} · ${money(total())}</span>`;
  $('#lines').innerHTML = L.map(({ p, n }) => `<div class="ln"><div class="th">${thumb(p, 26)}</div><div class="nm">${esc(tr(p.name))}<small>${money(p.price)}</small></div><div class="step"><button data-d="-1" data-id="${esc(p.id)}">−</button><b>${n}</b><button data-d="1" data-id="${esc(p.id)}">+</button></div></div>`).join('');
  $('#empty').hidden = count > 0; $('#f').hidden = !count; $('#tot').textContent = money(total());
  if (!count && !$('#cartView').hidden) document.body.classList.remove('open');
}
function change(id, d) { const n = (cart[id] || 0) + d; if (n > 0) cart[id] = Math.min(n, 99); else delete cart[id]; persist(); renderGrid(); renderCart(); }
function render() {
  applyStatic(); renderRail(); renderGrid(); renderCart();
  document.querySelectorAll('#lang button').forEach(b => b.classList.toggle('on', b.dataset.l === getLang()));
}

document.addEventListener('click', e => {
  const d = e.target.closest('[data-d]'); if (d) return change(d.dataset.id, +d.dataset.d);
  const c = e.target.closest('[data-cat]'); if (c) { active = c.dataset.cat; renderRail(); renderGrid(); }
});
$('#q').oninput = e => { query = e.target.value; renderGrid(); };
const openSheet = () => document.body.classList.add('open'), closeSheet = () => document.body.classList.remove('open');
$('#bar').onclick = openSheet; $('#x').onclick = $('#shade').onclick = closeSheet;
const syncAddress = () => { $('#addr').hidden = $('#f').elements.type.value !== 'delivery'; };
$('#f').addEventListener('change', syncAddress); syncAddress();

// ---------- place order (saved to the database; the admin is notified live on the website) ----------
$('#f').onsubmit = async e => {
  e.preventDefault();
  const L = lines(); if (!L.length) return;
  const f = e.target, v = k => f.elements[k].value.trim(), type = f.elements.type.value;
  if (!v('name')) return toast(t('errName'));
  if (v('phone').replace(/\D/g, '').length < 9) return toast(t('errPhone'));
  if (type === 'delivery' && !v('address')) return toast(t('errAddr'));
  const order = {
    items: L.map(({ p, n }) => ({ id: p.id, name: tr(p.name), price: Number(p.price), qty: n })),
    total: total(), name: v('name'), phone: v('phone'), address: v('address'), note: v('note'), type,
    status: 'new', createdAt: Date.now(), lang: getLang(), code: Math.random().toString(36).slice(2, 6).toUpperCase()
  };
  const btn = $('#place'); btn.disabled = true; btn.firstElementChild.textContent = t('sending');
  try {
    await DB.save('orders', order);
    cart = {}; persist(); f.reset(); syncAddress(); renderGrid(); renderCart();
    $('#code').textContent = order.code; $('#cartView').hidden = true; $('#doneView').hidden = false; $('#shTitle').textContent = t('thanks'); openSheet();
  } catch (err) { console.error(err); toast(t('errSend')); }
  btn.disabled = false; btn.firstElementChild.textContent = t('place');
};
$('#back').onclick = () => { closeSheet(); setTimeout(() => { $('#doneView').hidden = true; $('#cartView').hidden = false; $('#shTitle').textContent = t('yourOrder'); }, 400); };

// ---------- live data ----------
DB.watch('categories', a => { cats = a; renderRail(); renderGrid(); });
DB.watch('products', a => { prods = a; renderGrid(); renderCart(); });
DB.ready.then(() => { if (DB.mode.demo) { const b = $('#demo'); b.hidden = false; b.textContent = DB.mode.error ? `Firebase failed to load (${DB.mode.error}). Showing DEMO data.` : t('demo'); } });
render();
const rail = document.getElementById('rail');
if (rail) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let velocity = 0;
    let l_activeX = 0;
    let frameId;

    const momentumScroll = () => {
        if (!isDown && Math.abs(velocity) > 0.5) {
            rail.scrollLeft -= velocity;
            velocity *= 0.92; // Силлиқ тўхташ тезлиги (инерция)
            frameId = requestAnimationFrame(momentumScroll);
        }
    };

    rail.addEventListener('mousedown', (e) => {
        isDown = true;
        cancelAnimationFrame(frameId);
        startX = e.pageX - rail.offsetLeft;
        scrollLeft = rail.scrollLeft;
        l_activeX = e.pageX;
        velocity = 0;
    });

    rail.addEventListener('mouseleave', () => { isDown = false; momentumScroll(); });
    rail.addEventListener('mouseup', () => { isDown = false; momentumScroll(); });

    rail.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - rail.offsetLeft;
        const walk = (x - startX) * 1.5; // Скролл сезувчанлиги
        rail.scrollLeft = scrollLeft - walk;
        
        velocity = e.pageX - l_activeX;
        l_activeX = e.pageX;
    });
}