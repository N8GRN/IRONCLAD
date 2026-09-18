# IRONCLAD CRM

Roofing CRM for **Ironclad Roofing LLC** — jobs, customers, estimates, quotes, service agreements, signatures, and alerts.

**This is the app.** Open `index.html` (plain HTML + JavaScript + CSS). There is no React build.

Firebase project: **`ironclad-127a5`** (Auth, Firestore, Cloud Messaging).

## Where is everything?

| What you want to change | File |
|---|---|
| Page shell / logo | `index.html` |
| Colors, type, spacing | `css/app.css` |
| Screens (home, jobs, estimate, contract…) | `js/views.js` |
| Team, rates, company copy, Firebase keys | `js/config.js` |
| Material catalog / prices | `js/catalog.js` |
| Estimate math | `js/estimate.js` |
| Contract wording | `js/contract.js` |
| Local save + Firestore sync | `js/store.js` + `js/firebase.js` |
| Router / clicks | `js/app.js` |

Hash routes: `#/` `#/jobs` `#/jobs/ID` `#/customers` `#/schedule` `#/settings` `#/sign/TOKEN`.

## Does this push to the existing Firestore?

**Yes — when someone signs in with Firebase email/password.** Writes go to project `ironclad-127a5`, collections:

`jobs` · `customers` · `crews` · `notifications` · `meta` · `signLinks` · `fcmTokens`

**“Work on this device” does not push.** That mode stays in the browser until a teammate signs in with Firebase. The first Firebase login on an empty cloud workspace uploads the local jobs/customers so nothing is lost.

The old `projects` collection is left alone.

## Host on GitHub Pages (free)

1. Create a new GitHub repo and upload this whole folder (or `git init` + push).
2. Settings → Pages → **Source: GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes this folder.
4. Add the Pages URL (for example `https://YOUR_USER.github.io/ironclad-crm/`) under Firebase Console → Authentication → **Authorized domains**.

You can also drag these files into any static host.

## Host on Firebase Hosting (Spark / free tier)

```bash
npm i -g firebase-tools
firebase login
firebase use ironclad-127a5
firebase deploy --only hosting
```

`firebase.json` already points hosting at this folder. Site URL: `https://ironclad-127a5.web.app`. Add that host to Authorized domains.

## Firebase checklist

In [Firebase Console](https://console.firebase.google.com/project/ironclad-127a5):

1. **Authorized domains** — GitHub Pages URL and/or `ironclad-127a5.web.app`.
2. **Email/password** auth enabled; one user per teammate.
3. **Firestore rules** — copy from CRM Settings (includes public `signLinks` so a customer can sign on their own phone).
4. Map each teammate’s Firebase email in CRM **Settings**.
5. Fill company address, license, phone on Settings so they print on contracts.

True iOS push still needs a small Cloud Function. In-app alerts work without it. iPhone push only after **Add to Home Screen** (iOS 16.4+).

## Run on a laptop

Open this folder with any static file server (VS Code Live Server, `npx serve .`, Python `python -m http.server`). Sign in with **Work on this device** (Nate / Matt / sales) or Firebase email/password.

On each iPhone/iPad: Safari → Share → **Add to Home Screen**.
