# IRONCLAD CRM

Roofing CRM for **Ironclad Roofing LLC** — jobs, customers, estimates, quotes, service agreements, signatures, and alerts.

This is a **static PWA**: HTML, JavaScript, and CSS in the `public/` folder. Open `public/index.html` after you host it. No React build is required to run or edit the CRM.

Firebase project: **`ironclad-127a5`** (Auth, Firestore, Cloud Messaging).

## Shared company data

**Yes — everyone uses the same `ironclad-127a5` database.** Sign in with email/password. Jobs, customers, crews, catalog, and the `users` collection are shared.

New accounts land in `users` as **waiting**. Nate or Matt grant Sales or Admin in Settings → Team. Until then they cannot see jobs.

The old “pick a person on this device” login is gone. After you sign in once, this iPad can **Continue offline** with *your* account (cached jobs, sync when you’re back). You cannot impersonate someone else.

Collections: `jobs` · `customers` · `crews` · `notifications` · `users` · `meta` · `signLinks` · `fcmTokens`

The old `projects` collection is left alone. Alerts go to the **assigned project owner**, not the person who tapped Assign.

## Edit it (languages you already know)

| What you want to change | File |
|---|---|
| Starting team, rates, company copy, Firebase keys | [`public/js/config.js`](public/js/config.js) |
| **Teammates & access** | Settings → Team. People **Create account** on the login screen. Admins grant Sales or Admin (or link the new login to an existing seat like Jon). `users` in Firestore is the live roster. `config.js` is first-run only. |
| **Light / dark / system theme** | Settings → Appearance (saved on this device, not Firestore) |
| Colors, type, spacing | [`public/css/app.css`](public/css/app.css) |
| Screens (home, jobs, estimate, contract…) | [`public/js/views.js`](public/js/views.js) |
| Material catalog & prices | Settings → **Materials catalog**, or **Materials** in the sidebar (admins only). Add colors, retire SKUs, reprice, or bump a category by %. Saved on this device and to Firestore `meta/catalog` after Firebase sign-in. `catalog.js` is only the first-run list. |
| Estimate math | [`public/js/estimate.js`](public/js/estimate.js) |
| Contract wording | [`public/js/contract.js`](public/js/contract.js) |
| Firestore sync | [`public/js/store.js`](public/js/store.js) + [`public/js/firebase.js`](public/js/firebase.js) |
| Page shell / logo | [`public/index.html`](public/index.html) |

All app scripts hang off `window.IC`. Hash routes: `#/` `#/jobs` `#/jobs/ID` `#/customers` `#/schedule` `#/settings` `#/sign/TOKEN`.

## Host on GitHub Pages (free)

1. Push this repo to GitHub.
2. Settings → Pages → **Source: GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the `public/` folder.
4. Add the Pages URL (for example `https://YOUR_USER.github.io/ironclad-crm/`) under Firebase Console → Authentication → **Authorized domains**.

You can also upload **only the contents of `public/`** to any static host.

## Host on Firebase Hosting (Spark / free tier)

From the repo root, with [Firebase CLI](https://firebase.google.com/docs/cli) logged in:

```bash
npm i -g firebase-tools
firebase login
firebase use ironclad-127a5
firebase deploy --only hosting
```

`firebase.json` already points hosting at `public/` and rewrites every path to `index.html`. Site URL: `https://ironclad-127a5.web.app`. Add that host to Authorized domains.

## Firebase checklist

In [Firebase Console](https://console.firebase.google.com/project/ironclad-127a5):

1. **Authorized domains** — GitHub Pages URL and/or `ironclad-127a5.web.app` (and `localhost` for a laptop).
2. **Email/password** auth enabled; one user per teammate.
3. **Firestore rules** — copy from CRM Settings (includes public `signLinks` so a customer can sign on their own phone).
4. Map each teammate’s Firebase email in CRM **Settings**.
5. Fill company address, license, phone on Settings so they print on contracts.

True iOS push still needs a small Cloud Function that reads `fcmTokens` / `notifications`. In-app alerts work without it. iPhone push only after **Add to Home Screen** (iOS 16.4+).

## Run locally

Needs [Node.js 22](https://nodejs.org/).

```bash
npm install
npm run dev
```

Or open the `public/` folder with any static file server. Sign in with **Work on this device** (Nate / Matt / sales) or Firebase email/password.

On each iPhone/iPad: Safari → Share → **Add to Home Screen**.
