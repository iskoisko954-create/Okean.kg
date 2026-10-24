import * as DB from './firebase.js';
import { ADMIN_EMAIL } from './firebase-config.js';
import { icon, ICON_KEYS } from './icons.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const label = o => (o && (o.en || o.ru || o.ky)) || '—';
const STATUS = ['new', 'preparing', 'ready', 'done', 'cancelled'];
const TYPE = { delivery: 'Delivery', pickup: 'Pickup', dine: 'Dine in' };
let cats = [], prods = [], orders = [], stops = [], seen = null, selected = null, filter = 'all', editP = null, editC = null, photo = null;
let toastTimer; const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => e.classList.remove('on'), 3200); };
const run = async (fn, ok) => { try { await fn(); if (ok) toast(ok); } catch (e) { console.error(e); toast('Failed: ' + (e.code || e.message)); } };
const fmt = ts => new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const hm = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ---------- authentication gate ----------
DB.ready.then(() => {
  if (DB.mode.demo) {
    $('#demo').hidden = false; $('#emailRow').hidden = true;
    $('#demo').textContent = DB.mode.error ? `Firebase failed to load (${DB.mode.error}). DEMO MODE active.` : 'DEMO MODE: Firebase is not connected. Demo password: Admin.2026. Data stays in this browser only.';
  } else $('#lf').elements.email.value = ADMIN_EMAIL;
  $('#mode').textContent = DB.mode.demo ? 'DEMO' : 'FIREBASE';
  DB.watchAuth((ok, msg) => {
    $('#gate').hidden = ok; $('#shell').hidden = !ok;
    if (msg) $('#lerr').textContent = msg;
    ok ? start() : stop();
  });
});
$('#lf').onsubmit = async e => {
  e.preventDefault(); $('#lerr').textContent = ''; unlockSound();
  try { await DB.signIn(e.target.elements.email.value.trim(), e.target.elements.pw.value); e.target.elements.pw.value = ''; }
  catch (err) { $('#lerr').textContent = DB.mode.demo ? 'Incorrect password.' : 'Sign-in failed: ' + (err.code || err.message); }
};
$('#out').onclick = () => DB.signOut();

// Data (including private orders) is only subscribed after authentication succeeds.
function start() {
  stop();
  stops = [DB.watch('categories', a => { cats = a; rCats(); rProds(); }), DB.watch('products', a => { prods = a; rProds(); }), DB.watch('orders', onOrders)];
}
function stop() { stops.forEach(f => f()); stops = []; orders = []; seen = null; selected = null; $('#olist').innerHTML = ''; $('#detail').innerHTML = ''; document.title = 'OKEAN KAFE · Administration'; }

$('#nav').onclick = e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.view').forEach(v => (v.hidden = v.id !== 'v-' + b.dataset.view));
};
document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) $('#' + c.dataset.close).close(); });

// ---------- live notifications ----------
let audio = null;
function unlockSound() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch {} }
function chime() {
  if (!audio) return;
  [[880, 0], [1318, 0.16]].forEach(([f, t0]) => {
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + t0;
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.75);
  });
}
function announce(o) {
  chime();
  const n = o.items.reduce((s, i) => s + Number(i.qty), 0), el = document.createElement('div');
  el.className = 'alert';
  el.innerHTML = `<strong>New order · #${esc(o.code)}</strong><span>${esc(o.name)} · ${n} item${n > 1 ? 's' : ''} · ${Number(o.total)} KGS</span><div class="row"><button class="btn sm" data-open="${esc(o.id)}">Open message</button><button class="btn sm ghost" data-dismiss>Dismiss</button></div>`;
  $('#alerts').prepend(el); setTimeout(() => el.remove(), 12000);
}
$('#alerts').onclick = e => {
  const open = e.target.closest('[data-open]');
  if (open) { selected = open.dataset.open; filter = 'all'; document.querySelector('[data-view=messages]').click(); rOrders(); }
  if (open || e.target.closest('[data-dismiss]')) e.target.closest('.alert').remove();
};
function onOrders(list) {
  orders = [...list].sort((a, b) => b.createdAt - a.createdAt);
  if (seen === null) seen = new Set(orders.map(o => o.id));           // existing orders are not announced
  else orders.filter(o => !seen.has(o.id)).forEach(o => { seen.add(o.id); announce(o); });
  rOrders();
}

// ---------- messages (orders) ----------
function rOrders() {
  const count = s => orders.filter(o => o.status === s).length, fresh = count('new');
  $('#badge').hidden = !fresh; $('#badge').textContent = fresh;
  document.title = (fresh ? `(${fresh}) ` : '') + 'OKEAN KAFE · Administration';
  $('#stats').innerHTML = `<div class="stat ${fresh ? 'hot' : ''}"><span>New</span><b>${fresh}</b></div><div class="stat"><span>In progress</span><b>${count('preparing') + count('ready')}</b></div><div class="stat"><span>Completed</span><b>${count('done')}</b></div>`;
  $('#filters').innerHTML = ['all', ...STATUS].map(s => `<button data-f="${s}" class="${s === filter ? 'on' : ''}">${s}${s === 'all' ? ` (${orders.length})` : ` (${count(s)})`}</button>`).join('');
  const list = orders.filter(o => filter === 'all' || o.status === filter);
  if (!list.some(o => o.id === selected)) selected = list[0]?.id ?? null;
  $('#olist').innerHTML = list.map(o => `<button class="msg ${o.status === 'new' ? 'unread' : ''} ${o.id === selected ? 'on' : ''}" data-id="${esc(o.id)}"><span class="dot"></span><span><b>${esc(o.name)}</b><small>#${esc(o.code)} · ${o.items.reduce((s, i) => s + Number(i.qty), 0)} item${o.items.reduce((s, i) => s + Number(i.qty), 0) > 1 ? 's' : ''} · ${Number(o.total)} KGS</small></span><time>${hm(o.createdAt)}</time></button>`).join('') || '<p class="none">No messages yet. New orders will appear here instantly.</p>';
  const o = orders.find(x => x.id === selected);
  $('#detail').innerHTML = !o ? '<div class="empty"><p>Select a message to read the order.</p></div>' : `
    <div class="dtop"><div><h2>Order <i>#${esc(o.code)}</i></h2><p>${fmt(o.createdAt)}</p></div></div>
    <div class="states">${STATUS.map(s => `<button data-st="${s}" class="${s === o.status ? 'on' : ''}">${s}</button>`).join('')}</div>
    <div class="info"><div><span>Customer</span><b>${esc(o.name)}</b></div><div><span>Phone</span><b><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></b></div><div><span>Service</span><b>${TYPE[o.type] || esc(o.type)}</b></div><div><span>Language</span><b>${esc((o.lang || '').toUpperCase())}</b></div>${o.address ? `<div class="wide"><span>Address</span><b>${esc(o.address)}</b></div>` : ''}${o.note ? `<div class="wide"><span>Comment</span><b>${esc(o.note)}</b></div>` : ''}</div>
    <table class="items">${o.items.map(i => `<tr><td>${esc(i.name)}</td><td>× ${Number(i.qty)}</td><td>${Number(i.price) * Number(i.qty)} KGS</td></tr>`).join('')}</table>
    <div class="sum"><span>Total</span><b>${Number(o.total)} KGS</b></div>
    <button class="btn ghost red" data-del>Delete message</button>`;
}
$('#filters').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; rOrders(); } };
$('#olist').onclick = e => { const b = e.target.closest('[data-id]'); if (b) { selected = b.dataset.id; rOrders(); } };
$('#detail').onclick = e => {
  const st = e.target.closest('[data-st]');
  if (st) run(() => DB.patch('orders', selected, { status: st.dataset.st }), 'Status updated');
  if (e.target.closest('[data-del]') && confirm('Delete this message permanently?')) run(() => DB.remove('orders', selected), 'Message deleted');
};

// ---------- products ----------
const catOf = id => cats.find(c => c.id === id);
function rProds() {
  const order = [...cats].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(c => c.id);
  $('#plist').innerHTML = [...prods].sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat)).map(p => `
    <div class="tr" data-id="${esc(p.id)}"><div class="thumb">${p.img ? `<img src="${esc(p.img)}" alt="">` : icon(catOf(p.cat)?.icon || 'dish', 34)}</div>
    <div class="nm"><b>${esc(label(p.name))}</b><small>${esc(p.name?.ru || '')}${p.name?.ky ? ' · ' + esc(p.name.ky) : ''}</small></div>
    <div class="c"><span class="pill">${esc(label(catOf(p.cat)?.name))}</span></div><div class="p"><b>${Number(p.price)} KGS</b></div>
    <div class="av"><label class="switch"><input type="checkbox" data-a="avail" ${p.available !== false ? 'checked' : ''}><i></i></label></div>
    <div class="acts"><button class="btn sm ghost" data-a="edit">Edit</button><button class="btn sm ghost red" data-a="del">Delete</button></div></div>`).join('') || '<p class="none">No products yet. Add your first dish or load the sample menu.</p>';
}
$('#plist').onclick = e => {
  const row = e.target.closest('[data-id]'), a = e.target.closest('[data-a]')?.dataset.a, p = prods.find(x => x.id === row?.dataset.id);
  if (!p || !a) return;
  if (a === 'edit') openProduct(p);
  if (a === 'del' && confirm(`Delete "${label(p.name)}"?`)) run(() => DB.remove('products', p.id), 'Product deleted');
  if (a === 'avail') run(() => DB.patch('products', p.id, { available: e.target.checked }), e.target.checked ? 'Marked available' : 'Marked unavailable');
};
$('#sample').onclick = () => confirm('Write the sample menu (5 categories, 10 dishes)? Items with the same ids are overwritten.') && run(() => DB.loadSample(), 'Sample menu loaded');
$('#addP').onclick = () => openProduct(null);
function openProduct(p) {
  if (!cats.length) return toast('Create a category first.');
  editP = p; photo = null; const f = $('#pf'); f.reset(); $('#perr').textContent = '';
  $('#pt').textContent = p ? 'Edit product' : 'Add product';
  f.elements.cat.innerHTML = [...cats].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(c => `<option value="${esc(c.id)}">${esc(label(c.name))}</option>`).join('');
  if (p) {
    f.elements.cat.value = p.cat; f.elements.price.value = p.price; f.elements.available.checked = p.available !== false;
    for (const l of ['en', 'ru', 'ky']) { f.elements['n_' + l].value = p.name?.[l] || ''; f.elements['d_' + l].value = p.desc?.[l] || ''; }
  }
  $('#prev').hidden = !p?.img; if (p?.img) $('#prev').src = p.img;
  $('#pd').showModal();
}
$('#file').onchange = e => { const f = e.target.files[0]; if (!f) return; photo = f; $('#prev').src = URL.createObjectURL(f); $('#prev').hidden = false; };
$('#pf').onsubmit = async e => {
  e.preventDefault(); const f = e.target.elements, btn = $('#psave');
  if (!f.n_en.value.trim() || f.price.value === '') return ($('#perr').textContent = 'English name and price are required.');
  btn.disabled = true; btn.textContent = 'Saving…'; $('#perr').textContent = '';
  try {
    const id = editP?.id || DB.newId(), en = f.n_en.value.trim(), dEn = f.d_en.value.trim();
    const img = photo ? await DB.upload(photo, id) : editP?.img || '';
    await DB.save('products', { id, cat: f.cat.value, price: Number(f.price.value), img, available: f.available.checked, createdAt: editP?.createdAt || Date.now(),
      name: { en, ru: f.n_ru.value.trim() || en, ky: f.n_ky.value.trim() || en },
      desc: { en: dEn, ru: f.d_ru.value.trim() || dEn, ky: f.d_ky.value.trim() || dEn } });
    $('#pd').close(); toast('Product saved');
  } catch (err) { console.error(err); $('#perr').textContent = 'Could not save: ' + (err.code || err.message) + (photo ? ' (If the photo is HEIC, set the camera to JPEG.)' : ''); }
  btn.disabled = false; btn.textContent = 'Save product';
};

// ---------- categories ----------
function rCats() {
  $('#clist').innerHTML = [...cats].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map(c => `
    <div class="cc" data-id="${esc(c.id)}"><div class="ic">${icon(c.icon, 30)}</div><h3>${esc(label(c.name))}</h3><p>${esc(c.name?.ru || '')} · ${esc(c.name?.ky || '')}<br>Order ${c.sort ?? 0} · ${prods.filter(p => p.cat === c.id).length} dishes</p>
    <div class="acts"><button class="btn sm ghost" data-a="edit">Edit</button><button class="btn sm ghost red" data-a="del">Delete</button></div></div>`).join('') || '<p class="none">No categories yet.</p>';
}
$('#clist').onclick = e => {
  const a = e.target.closest('[data-a]')?.dataset.a, c = catOf(e.target.closest('[data-id]')?.dataset.id);
  if (!c || !a) return;
  if (a === 'edit') openCategory(c);
  if (a === 'del') {
    const n = prods.filter(p => p.cat === c.id).length;
    if (n) return toast(`Move or delete the ${n} dish(es) in this category first.`);
    if (confirm(`Delete "${label(c.name)}"?`)) run(() => DB.remove('categories', c.id), 'Category deleted');
  }
};
$('#addC').onclick = () => openCategory(null);
function openCategory(c) {
  editC = c; const f = $('#cf'); f.reset(); $('#cerr').textContent = ''; $('#ct').textContent = c ? 'Edit category' : 'Add category';
  $('#icons').innerHTML = ICON_KEYS.map(k => `<label><input type="radio" name="icon" value="${k}" ${k === (c?.icon || 'dish') ? 'checked' : ''}><span>${icon(k, 28)}</span></label>`).join('');
  if (c) { f.elements.n_en.value = c.name?.en || ''; f.elements.n_ru.value = c.name?.ru || ''; f.elements.n_ky.value = c.name?.ky || ''; f.elements.sort.value = c.sort ?? 10; }
  $('#cd').showModal();
}
$('#cf').onsubmit = e => {
  e.preventDefault(); const f = e.target.elements, en = f.n_en.value.trim();
  if (!en) return ($('#cerr').textContent = 'English name is required.');
  run(async () => {
    const id = editC?.id || en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DB.newId();
    await DB.save('categories', { id, icon: f.icon.value, sort: Number(f.sort.value), name: { en, ru: f.n_ru.value.trim() || en, ky: f.n_ky.value.trim() || en } });
    $('#cd').close();
  }, 'Category saved');
};
