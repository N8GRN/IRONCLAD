# IRONCLAD CRM

Roofing CRM for **Ironclad Roofing LLC** — jobs, customers, estimates, quotes, service agreements, signatures, and alerts.

This is a **static PWA**: HTML, JavaScript, and CSS in the `public/` folder. Open `public/index.html` after you host it. No React build is required to run or edit the CRM.

Firebase project: **`ironclad-127a5`** (Auth, Firestore, Cloud Messaging).

## Does this push to the existing Firestore?

**Yes — when someone signs in with Firebase email/password.** Writes go to the existing project `ironclad-127a5`, collections:

`jobs` · `customers` · `crews` · `notifications` · `meta` · `signLinks` · `fcmTokens`

**“Work on this device” does not push.** That mode stays in the browser (`localStorage`) until a teammate signs in with Firebase. The first Firebase login on an empty cloud workspace uploads the local jobs/customers so nothing is lost.

The old `projects` collection is left alone.

## Edit it (languages you already know)

| What you want to change | File |
|---|---|
| Starting team, rates, company copy, Firebase keys | [`public/js/config.js`](public/js/config.js) |
| **Add / remove teammates, change names & roles** | Settings → Team (admins only: Nate and Matt). Use **Add user**. Saved on this device and to Firestore `meta/team` after Firebase sign-in. `config.js` is only the first-run roster. Matt’s login label is **Owner**; his role stays **Admin** so he and Nate have equal privileges. |
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
