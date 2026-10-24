// Line-art icons used for categories and photo-less product tiles.
const PATHS = {
  all: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  rolls: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  lemonade: '<path d="M6.5 7h11l-1.3 13H7.8z"/><path d="M13.5 7l2.2-4.5"/><circle cx="12" cy="13.5" r="2.6"/>',
  snack: '<path d="M6.5 10h11l-1.2 10.5H7.7z"/><path d="M8.5 10V4.5M11.2 10V3.5M13.8 10V4.8M16 10V6.5"/>',
  shashlik: '<path d="M3.5 20.5l17-17"/><rect x="5.6" y="13" width="5.4" height="5.4" rx="1.6" transform="rotate(-45 8.3 15.7)"/><rect x="9.3" y="9.3" width="5.4" height="5.4" rx="1.6" transform="rotate(-45 12 12)"/><rect x="13" y="5.6" width="5.4" height="5.4" rx="1.6" transform="rotate(-45 15.7 8.3)"/>',
  tea: '<path d="M5 10h12v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M9 3c-1 1.5 1 2.5 0 4M13 3c-1 1.5 1 2.5 0 4"/>',
  dish: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 10V8"/><circle cx="12" cy="6.6" r="1"/>'
};
export const ICON_KEYS = ['rolls', 'lemonade', 'snack', 'shashlik', 'tea', 'dish'];
export const icon = (key, size = 24) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[key] || PATHS.dish}</svg>`;
