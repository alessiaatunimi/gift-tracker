# SANTA'S HELPER ORGANISER

A Christmas gift tracker built for GitHub Pages, Firebase Authentication, and Cloud Firestore. No build step. Includes Google sign-in, private per-account gifts, editing/deletion, eight progress phases, budgets in EUR, search, year selection, and JSON backup export. Demo data lives only in memory; signing in discards it. Actual gift records are never stored in this repository.

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

## Overview and gift details

The default Overview page (`#overview`) shows only recipient names and coloured phase selectors, sorted by phase and then alphabetically within each phase. Gift details (`#details`) retains the card layout, budget summaries and gift information. Both views use the same data, year, search and phase filter. Click a recipient row in Overview to open Gift details, scroll to its card and focus it. Delivered and Wrapped overall phases show a green check beside the recipient.

Phases: Thinking → Decided → Partly bought → Bought → Partly delivered → Delivered → Wrapped → Given.

**Updating an existing installation:** publish the updated `firestore.rules` in Firebase Console → Firestore → Rules before deploying this version. The new phase values cannot be saved under the previous rules. The rules retain support for old clients. Existing records are displayed as Deciding → Thinking, Buying → Decided, Wrapping → Delivered, Ready → Wrapped; Given stays Given. No records are rewritten on load. Saving a gift stores its new phase. Wrapped and Given count as ready in the details summary.

## Multiple items per person

Gift details now shows an item list per recipient. Add, rename or remove items in the gift editor, and change individual phases directly on the card. Each item uses Thinking, Decided, Bought, Delivered or Wrapped. Up to 30 items can be saved per person. The budget, notes and product link remain shared by the recipient's collection.

Overall phase is calculated from the latest item phase: identical phases use that phase; mixed phases use “Partly” plus the latest phase. For example Bought + Delivered = Partly delivered, and Thinking + Wrapped = Partly wrapped. An empty list is Thinking. Overview badges are calculated, not manually editable. The separate Given to recipient checkbox retains the final handoff state.

Publish the updated `firestore.rules` before deploying: the schema now accepts validated item lists and the Given flag. Existing single gifts appear as one item and are saved in the new format only when edited. Old partial phases become two editable items (the original gift and “Remaining gift items”) to preserve their partial state. No cloud records are automatically rewritten.
