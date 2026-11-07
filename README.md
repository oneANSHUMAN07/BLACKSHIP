# BLACKSHIP

BLACKSHIP is a local brand-governance prototype. The workspace includes Brand DNA, a deterministic content auditor, reviewer decisions, and downloadable reports.

## Run locally

**Prerequisite:** Node.js

1. Configure Firebase by following [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) to enable real accounts. You can also choose **Continue as Demo** on `/login` without Firebase setup.
2. On Windows, double-click `start-blackship.bat`. It installs dependencies if needed and starts the app.
3. Or install dependencies with `npm install --legacy-peer-deps`, then run `npm run dev`.

Email/password signup and login, Google sign-in, email verification, password reset, and authenticated dashboard access use Firebase Authentication. **Continue as Demo** opens a clearly labeled demo workspace without checking credentials; demo data stays in this browser. For real accounts, Brand DNA, audits, and reviewer decisions are saved in the browser and synced to Firebase Cloud Firestore. Follow [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) to create the database and publish the account-only rules in [`firestore.rules`](./firestore.rules). Local data is separated by site address, so `localhost:3000` and `localhost:3001` do not share browser storage.
