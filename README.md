# Little List

A Christmas gift tracker built for GitHub Pages, Firebase Authentication, and Cloud Firestore. No build step. Includes Google sign-in, private per-account gifts, editing/deletion, five progress stages, budgets in EUR, search, year selection, and JSON backup export. Demo data lives only in memory; signing in discards it. Actual gift records are never stored in this repository.

## Connect Firebase (one-time setup)

1. Open https://console.firebase.google.com/ and create a project on the **Spark** plan. Analytics is optional and not used by this app. Do not attach billing for this app's features.
2. In Project settings → General, register a **Web app**. Copy its config values into `firebase-config.js`. Copy only the web config, never a service-account key or admin credential. Web API keys identify your project; Firestore rules control data access.
3. In Authentication → Sign-in method, enable **Google** and select a support email.
4. In Authentication → Settings → Authorized domains, add your GitHub Pages hostname (for example `yourname.github.io`, without protocol or repo path). For local testing also add `localhost`. Keep the Firebase-provided authDomain in the config.
5. Create a **Cloud Firestore Standard edition** database, choose a suitable region (for example an EU region), and start in **production mode**.
6. In Firestore → Rules, replace the rules with the full contents of `firestore.rules` and click **Publish**. Do this before saving real gifts. The rules deny access except to `/users/<signed-in UID>/gifts/*` for that UID and validate writes. Other signed-in people can have their own lists but cannot access yours.
7. Run `npm start`, visit http://localhost:5173, and sign in. Add a gift and reload to verify persistence. Sign out to verify the list clears. Sign in on another device to verify syncing.

Configuration values are intentionally blank in the repository. Until configured, real sign-in is disabled and an explicitly labelled sample mode is available. Cloud functionality cannot be validated until a real project and its published rules are available.

## GitHub Pages

Push the app files to your repository. In GitHub → Settings → Pages, choose **Deploy from a branch**, select your branch and **/(root)**, then save. All asset paths are relative so repository subpaths work. `.nojekyll` disables Jekyll processing. No GitHub Actions workflow or paid hosting is required.

The website is public; Firestore enforces privacy independently of the interface. Do not put real gift exports in the repository. Downloaded backups are unencrypted private files. The UI uses textContent for user-entered content and restricts product links to HTTP(S).

## Local development and checks

- `npm start` — static server on port 5173 (Python 3 required).
- `npm test` — data validation and summary tests (Node.js required).
- `node --check app.js` — JavaScript syntax check.

Before using real data, use Firebase Rules Playground with two distinct authenticated UIDs: an owner can read/create/update/delete their own valid gift; an anonymous user and a different UID must fail all operations on that gift. Invalid stages, negative budgets, missing fields and extra fields must fail writes. Client tests do not replace rules verification.

Firebase SDK modules load from Google's CDN, pinned to 13.4.0. Fonts load from Google Fonts with local fallbacks. Network access is needed for sign-in and cloud operations. Firestore uses its default in-memory cache; this app does not enable persistent offline storage. Export backup downloads the selected year's gifts as JSON; automatic restore/import is not included.

## Troubleshooting

- **Unauthorized domain:** add the exact hostname to Authentication's authorized domains.
- **Permission denied:** publish `firestore.rules` in the same Firebase project as your web config.
- **Popup blocked:** allow pop-ups and press sign in again.
- **Connection unavailable:** check internet connectivity and the web config, then reload.

Official documentation: https://firebase.google.com/docs/web/setup · https://firebase.google.com/docs/auth/web/google-signin · https://firebase.google.com/docs/firestore/security/get-started
