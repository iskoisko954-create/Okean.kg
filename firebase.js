// Data layer: Firebase Auth + Firestore + Storage when configured, otherwise a local DEMO store.
import { firebaseConfig as cfg, ADMIN_EMAIL } from './firebase-config.js';

const filled = v => v && !String(v).startsWith('PASTE');
export const mode = { demo: !(filled(cfg.apiKey) && filled(cfg.projectId)), error: null };
const CDN = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
let fb = null;

export const ready = (async () => {
  if (mode.demo) return;
  try {
    const [app, fs, au, st] = await Promise.all(['app', 'firestore', 'auth', 'storage'].map(n => import(`${CDN}${n}.js`)));
    const a = app.initializeApp(cfg);
    fb = { fs, au, st, db: fs.getFirestore(a), auth: au.getAuth(a), store: st.getStorage(a) };
  } catch (e) {
    console.error('Firebase SDK failed to load:', e);
    mode.demo = true; mode.error = String(e.message || e);
  }
})();

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- sample menu ----------
const T = (en, ru, ky) => ({ en, ru, ky });
const C = (id, sort, icon, name) => ({ id, sort, icon, name });
const D = (id, cat, price, name, desc) => ({ id, cat, price, name, desc, img: '', available: true, createdAt: 0 });
export const SAMPLE = {
  categories: [
    C('rolls', 1, 'rolls', T('Rolls', 'Роллы', 'Роллдор')),
    C('lemonades', 2, 'lemonade', T('Lemonades', 'Лимонады', 'Лимонаддар')),
    C('snacks', 3, 'snack', T('Snacks', 'Закуски', 'Закускалар')),
    C('shashlik', 4, 'shashlik', T('Shashlik', 'Шашлык', 'Шашлык')),
    C('teas', 5, 'tea', T('Teas', 'Чаи', 'Чайлар'))
  ],
  products: [
    D('philadelphia', 'rolls', 420, T('Philadelphia Roll', 'Ролл Филадельфия', 'Филадельфия ролл'), T('Salmon, cream cheese, cucumber', 'Лосось, сливочный сыр, огурец', 'Лосось, каймак сыры, бадыраң')),
    D('california', 'rolls', 380, T('California Roll', 'Ролл Калифорния', 'Калифорния ролл'), T('Crab, avocado, tobiko', 'Краб, авокадо, тобико', 'Краб, авокадо, тобико')),
    D('lemonade', 'lemonades', 180, T('Classic Lemonade', 'Классический лимонад', 'Классикалык лимонад'), T('Lemon, sugar, sparkling water', 'Лимон, сахар, газированная вода', 'Лимон, кант, газдалган суу')),
    D('mint', 'lemonades', 200, T('Mint Cucumber', 'Мята и огурец', 'Жалбыз жана бадыраң'), T('Fresh mint and cucumber', 'Свежая мята и огурец', 'Жаңы жалбыз жана бадыраң')),
    D('fries', 'snacks', 160, T('French Fries', 'Картофель фри', 'Картошка фри'), T('Golden and crisp', 'Золотистый и хрустящий', 'Алтындай кытырак')),
    D('nuggets', 'snacks', 250, T('Chicken Nuggets', 'Куриные наггетсы', 'Тоок наггетс'), T('With garlic sauce', 'С чесночным соусом', 'Сарымсак соусу менен')),
    D('lamb', 'shashlik', 320, T('Lamb Shashlik', 'Шашлык из баранины', 'Козу шашлыгы'), T('Charcoal-grilled, with onion', 'На углях, с луком', 'Көмүрдө бышкан, пияз менен')),
    D('chicken', 'shashlik', 260, T('Chicken Shashlik', 'Шашлык из курицы', 'Тоок шашлыгы'), T('Tender marinated chicken', 'Нежная маринованная курица', 'Жумшак маринаддалган тоок')),
    D('black', 'teas', 90, T('Black Tea', 'Чёрный чай', 'Кара чай'), T('Strong, served in a pot', 'Крепкий, в чайнике', 'Күчтүү, чайнекте')),
    D('jasmine', 'teas', 100, T('Jasmine Green Tea', 'Зелёный чай с жасмином', 'Жасмин жашыл чай'), T('Light and floral', 'Лёгкий, цветочный', 'Жеңил, гүл жыттуу'))
  ]
};

// ---------- demo store (localStorage; other tabs update through the "storage" event) ----------
const KEY = 'okean.demo.v2';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
let demo = read() || { products: structuredClone(SAMPLE.products), categories: structuredClone(SAMPLE.categories), orders: [] };
const subs = { products: new Set(), categories: new Set(), orders: new Set() };
const fire = () => Object.entries(subs).forEach(([k, s]) => s.forEach(f => f(demo[k])));
const commit = () => { localStorage.setItem(KEY, JSON.stringify(demo)); fire(); };
addEventListener('storage', e => { if (e.key === KEY) { demo = read() || demo; fire(); } });
const authSubs = new Set();
const isAdminDemo = () => sessionStorage.getItem('okean.admin') === '1';

// ---------- collections ----------
export function watch(col, cb) {
  let stop = () => {}, dead = false;
  ready.then(() => {
    if (dead) return;
    if (mode.demo) { subs[col].add(cb); cb(demo[col]); stop = () => subs[col].delete(cb); }
    else stop = fb.fs.onSnapshot(fb.fs.collection(fb.db, col), s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), e => console.error(`${col}:`, e.code, e.message));
  });
  return () => { dead = true; stop(); };
}
export async function save(col, doc) {
  await ready;
  const id = doc.id || newId();
  if (mode.demo) {
    const arr = demo[col], i = arr.findIndex(x => x.id === id), row = { ...doc, id };
    if (i < 0) arr.push(row); else arr[i] = row;
    commit();
  } else { const { id: _drop, ...data } = doc; await fb.fs.setDoc(fb.fs.doc(fb.db, col, id), data); }
  return id;
}
export async function patch(col, id, fields) {
  await ready;
  if (mode.demo) { Object.assign(demo[col].find(x => x.id === id) || {}, fields); commit(); }
  else await fb.fs.updateDoc(fb.fs.doc(fb.db, col, id), fields);
}
export async function remove(col, id) {
  await ready;
  if (mode.demo) { demo[col] = demo[col].filter(x => x.id !== id); commit(); }
  else await fb.fs.deleteDoc(fb.fs.doc(fb.db, col, id));
}
export async function loadSample() {
  await ready;
  if (mode.demo) { demo.products = structuredClone(SAMPLE.products); demo.categories = structuredClone(SAMPLE.categories); commit(); return; }
  const b = fb.fs.writeBatch(fb.db);
  for (const col of ['categories', 'products']) for (const { id, ...d } of SAMPLE[col]) b.set(fb.fs.doc(fb.db, col, id), d);
  await b.commit();
}

// ---------- images ----------
async function shrink(file, max) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}
export async function upload(file, id) {
  await ready;
  const c = await shrink(file, mode.demo ? 640 : 1000);
  if (mode.demo) return c.toDataURL('image/jpeg', 0.8);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
  const ref = fb.st.ref(fb.store, `products/${id}-${Date.now()}.jpg`);
  await fb.st.uploadBytes(ref, blob, { contentType: 'image/jpeg' });
  return fb.st.getDownloadURL(ref);
}

// ---------- administrator authentication ----------
export async function signIn(email, password) {
  await ready;
  if (mode.demo) {
    if (password !== 'Admin.2026') throw new Error('Wrong password');
    sessionStorage.setItem('okean.admin', '1'); authSubs.forEach(f => f(true));
  } else await fb.au.signInWithEmailAndPassword(fb.auth, email, password);
}
export async function signOut() {
  await ready;
  if (mode.demo) { sessionStorage.removeItem('okean.admin'); authSubs.forEach(f => f(false)); }
  else await fb.au.signOut(fb.auth);
}
export function watchAuth(cb) {
  ready.then(() => {
    if (mode.demo) { authSubs.add(cb); cb(isAdminDemo()); return; }
    fb.au.onAuthStateChanged(fb.auth, u => {
      if (u && u.email !== ADMIN_EMAIL) { fb.au.signOut(fb.auth); cb(false, 'This account is not the administrator.'); }
      else cb(!!u);
    });
  });
}
