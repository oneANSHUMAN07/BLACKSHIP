# Enable BLACKSHIP authentication and cloud data

This build uses Firebase Authentication for real email/password accounts and Google sign-in. The Firebase Web app configuration is required before either provider can work.

You can still use **Continue as Demo** on the login page without Firebase configuration. Demo mode does not verify an account; it opens a clearly labeled workspace with browser-local demo data.

## Firebase setup

1. In the Firebase console, create a project or select an existing one, then register a **Web app** under Project settings.
2. Open **Authentication → Sign-in method** and enable **Email/Password** and **Google**.
3. In Authentication settings, keep email-enumeration protection enabled. In the **Authorized domains** list, ensure the following are added:
   - `localhost` (for local development)
   - `oneblackship.xyz` (production custom domain)
   - `ais-dev-pqxj5v5b6yc5fbin3uqd6j-340298743077.asia-southeast1.run.app` (Google AI Studio development preview)
   - `ais-pre-pqxj5v5b6yc5fbin3uqd6j-340298743077.asia-southeast1.run.app` (Google AI Studio shared preview)
4. In the project folder containing `package.json`, copy `.env.example` to `.env.local` and fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` from the Firebase Web app config.
5. In Firebase Console, open **Firestore Database → Create database** and create a database. Choose a region close to your users.
6. Open the Firestore **Rules** tab, replace the starter rules with the contents of `firestore.rules`, then publish the rules. These rules let each signed-in account read and write only its own workspace.
7. Run `npm install`, then `npm run dev`.

Do not put a Firebase service-account key or private server credential in this frontend project. The Web app config is intended for client apps; Firebase Authentication and its security settings enforce the sign-in providers.

## What this connects

- Email/password signup creates a Firebase Authentication account and sends an email-verification link. Users must verify their email before opening `/app`.
- Email/password sign-in checks the registered account with Firebase.
- Google sign-in uses Firebase's Google provider.
- Password reset sends a Firebase reset email.
- `/app` requires either an authenticated Firebase user or an explicitly started demo session. Demo mode is for preview only and does not protect data as a real account would. Exit demo returns to `/login`.
- Brand DNA and audit/review records are backed up in this browser and synced to Cloud Firestore for real Firebase accounts. The first signed-in launch uploads local records for that same site address, then other devices signed in to the same Firebase account can load them.
- Demo mode remains browser-local and never syncs to Firestore.
- Local browser data is isolated by site address: `localhost:3000` and `localhost:3001` have separate browser storage. Data saved under one address does not automatically appear under the other.
- If Firestore is not created or its rules are not published, the app keeps the device copy and displays a cloud-sync setup warning. Do not clear browser data until cloud sync shows as connected.
- The Firestore rules in `firestore.rules` restrict each user to their own `/users/{userId}` document and `/users/{userId}/audits/{auditId}` collection. Never use open public rules for a real app.
