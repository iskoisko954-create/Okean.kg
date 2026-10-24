export const LANGS = { ky: 'Кыргызча', ru: 'Русский', en: 'English' };
const TEXT = {
  en: { tagline: 'Fire, flavour and fresh plates', search: 'Search the menu', all: 'All', dishes: 'dishes', add: 'Add', unavailable: 'Unavailable', none: 'Nothing found. Try another word or category.',
    yourOrder: 'Your order', view: 'View order', total: 'Total', emptyCart: 'Your cart is empty. Add something delicious.', details: 'Order details', how: 'How would you like it?', delivery: 'Delivery', pickup: 'Pickup', dine: 'Dine in',
    name: 'Your name', phone: 'Phone', address: 'Delivery address', note: 'Comment (optional)', place: 'Place order', sending: 'Sending…', cur: 'KGS', close: 'Close',
    thanks: 'Order received', thanksText: 'The restaurant has your order and will confirm shortly.', code: 'Order number', back: 'Back to menu',
    errName: 'Please enter your name.', errPhone: 'Please enter a valid phone number.', errAddr: 'Please enter the delivery address.', errSend: 'Your order could not be sent. Check your connection and try again.',
    demo: 'DEMO MODE: Firebase is not connected. Data is stored only in this browser.', theme: 'Switch light/dark theme' },
  ru: { tagline: 'Огонь, вкус и свежие блюда', search: 'Поиск по меню', all: 'Все', dishes: 'блюд', add: 'Добавить', unavailable: 'Недоступно', none: 'Ничего не найдено. Попробуйте другое слово или категорию.',
    yourOrder: 'Ваш заказ', view: 'Открыть заказ', total: 'Итого', emptyCart: 'Корзина пуста. Добавьте что-нибудь вкусное.', details: 'Данные заказа', how: 'Как получить заказ?', delivery: 'Доставка', pickup: 'Самовывоз', dine: 'В зале',
    name: 'Ваше имя', phone: 'Телефон', address: 'Адрес доставки', note: 'Комментарий (необязательно)', place: 'Оформить заказ', sending: 'Отправка…', cur: 'сом', close: 'Закрыть',
    thanks: 'Заказ принят', thanksText: 'Ресторан получил ваш заказ и скоро его подтвердит.', code: 'Номер заказа', back: 'Вернуться в меню',
    errName: 'Введите ваше имя.', errPhone: 'Введите корректный номер телефона.', errAddr: 'Введите адрес доставки.', errSend: 'Не удалось отправить заказ. Проверьте соединение и повторите попытку.',
    demo: 'ДЕМО-РЕЖИМ: Firebase не подключён. Данные хранятся только в этом браузере.', theme: 'Светлая/тёмная тема' },
  ky: { tagline: 'Оттун даамы, жаңы тамактар', search: 'Меню боюнча издөө', all: 'Баары', dishes: 'тамак', add: 'Кошуу', unavailable: 'Жок', none: 'Эч нерсе табылган жок. Башка сөз же категория байкап көрүңүз.',
    yourOrder: 'Сиздин заказ', view: 'Заказды ачуу', total: 'Жалпы', emptyCart: 'Себет бош. Даамдуу бир нерсе кошуңуз.', details: 'Заказ маалыматы', how: 'Кантип аласыз?', delivery: 'Жеткирүү', pickup: 'Өзүм алам', dine: 'Залда',
    name: 'Атыңыз', phone: 'Телефон', address: 'Жеткирүү дареги', note: 'Комментарий (милдеттүү эмес)', place: 'Заказ берүү', sending: 'Жөнөтүлүүдө…', cur: 'сом', close: 'Жабуу',
    thanks: 'Заказ кабыл алынды', thanksText: 'Ресторан заказыңызды алды, жакында ырастайт.', code: 'Заказдын номери', back: 'Менюга кайтуу',
    errName: 'Атыңызды жазыңыз.', errPhone: 'Телефон номерин туура жазыңыз.', errAddr: 'Жеткирүү дарегин жазыңыз.', errSend: 'Заказ жөнөтүлгөн жок. Байланышты текшерип, кайра аракет кылыңыз.',
    demo: 'ДЕМО РЕЖИМ: Firebase туташтырылган эмес. Маалымат ушул браузерде гана сакталат.', theme: 'Жарык/караңгы тема' }
};
let lang = localStorage.getItem('okean.lang');
if (!TEXT[lang]) lang = 'ky';
document.documentElement.lang = lang;
export const getLang = () => lang;
export const setLang = l => { lang = l; localStorage.setItem('okean.lang', l); document.documentElement.lang = l; };
export const t = k => TEXT[lang][k] ?? TEXT.en[k] ?? k;
export const tr = o => (!o ? '' : typeof o === 'string' ? o : o[lang] || o.en || o.ru || o.ky || '');
export const money = n => `${Number(n)} ${t('cur')}`;
export function applyStatic() {
  document.querySelectorAll('[data-i]').forEach(e => (e.textContent = t(e.dataset.i)));
  document.querySelectorAll('[data-ip]').forEach(e => (e.placeholder = t(e.dataset.ip)));
  document.querySelectorAll('[data-ia]').forEach(e => e.setAttribute('aria-label', t(e.dataset.ia)));
}
