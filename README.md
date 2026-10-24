# OKEAN KAFE: HTML5 + CSS3 + vanilla JavaScript

No frameworks. All files sit in the repository root.

| File | Purpose |
|---|---|
| `index.html`, `style.css`, `script.js` | Customer site: entrance animation, category rail, menu, search, cart, order form |
| `admin.html`, `admin.css`, `admin.js` | Administrator panel: Messages (orders), Products, Categories, live order alerts |
| `firebase.js` | Firebase Auth + Firestore + Storage, or DEMO mode when not configured |
| `firebase-config.js` | **The only file you edit**: Firebase keys and the admin email |
| `i18n.js`, `icons.js` | Kyrgyz/Russian/English texts; line-art category icons |
| `firestore.rules`, `storage.rules` | Security rules to publish in the Firebase console |
| `manifest.json`, `sw.js`, `icon-*.png` | PWA files for Android APK packaging |

## How orders and notifications work
1. A customer places an order. It is saved to Firestore (`orders`) and the customer sees an order number. Nothing is sent through WhatsApp or any third party.
2. Every administrator who is signed in at `admin.html` and has the page open receives it in real time: a notification card, a chime, a badge on **Messages**, and a count in the browser tab title.
3. **Messages is private.** Orders are only loaded after administrator sign-in, and Firestore rules allow only the admin account to read them. The customer site has no link to the admin page.

**Real SMS to a phone is not included.** A static website cannot send SMS securely; it needs a server (for example a Firebase Cloud Function with an SMS provider such as Twilio, which is a paid service). The in-app alerts above work only while the admin page is open and signed in.

## Run locally
ES modules need a web server: `python3 -m http.server 8000`, then open http://localhost:8000.
Until `firebase-config.js` is filled in, a gold **DEMO MODE** banner appears and data lives only in that browser. Demo admin password: `Admin.2026`.

## Connect Firebase
1. https://console.firebase.google.com → **Add project**.
2. **Authentication → Sign-in method → Email/Password → Enable.** **Users → Add user**: email `admin@okeankafe.kg` and password `Admin.2026` (a longer password is safer because it has been shared in chat).
3. **Firestore Database → Create database** (production mode).
4. **Storage → Get started.** Storage may require the Blaze plan; check current Firebase pricing.
5. **Project settings → Your apps → Web (</>)**: register the app and copy the config into `firebase-config.js`. Set `ADMIN_EMAIL` to the email from step 2.
6. **Rules:** paste `firestore.rules` into Firestore → Rules → Publish; paste `storage.rules` into Storage → Rules → Publish. If you use another admin email, replace `admin@okeankafe.kg` in both files first.
7. **Authentication → Settings → Authorized domains:** add `YOURNAME.github.io`.
8. Open `admin.html`, sign in, press **Load sample menu** once, or add your own products.

In Firebase mode the password is checked by Firebase Authentication, never by the page. Sign-in with any other email is rejected, and the rules block everything else.

## GitHub Pages
Upload all files to a repository root → Settings → Pages → Deploy from branch `main` / root. Customer site: `https://YOURNAME.github.io/REPO/`. Admin: `.../admin.html`.

## Android APK
Easiest: deploy to GitHub Pages, then use https://www.pwabuilder.com with the URL and choose Android. Alternative: Capacitor (`npx cap add android`) with this folder as `webDir`.
