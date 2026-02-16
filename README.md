# Curriculum Builder

Admin web app to create and edit courses and rudiments. Data is stored in the same Firestore project as the Rhythm app; the Learn tab in Rhythm reads this curriculum.

## Setup

1. Copy `.env.example` to `.env` and fill in the same Firebase config as the rhythm app (use `VITE_` prefix instead of `EXPO_PUBLIC_`).
2. In Firestore, create a document `admins/{your-uid}` with field `role: "admin"` (use your Firebase Auth UID after signing in once).
3. Deploy the Firestore rules from the rhythm-app project so curriculum write is allowed for admins.

## Run

- `npm install`
- `npm run dev` — open http://localhost:5173
- Sign in with an email/password account that has an `admins/{uid}` doc with `role: "admin"`.

## Build

- `npm run build` — output in `dist/`. Deploy to Vercel, Netlify, or Firebase Hosting and set the same env vars.

## Deploy (Firebase Hosting + GitHub Actions)

CD deploys to Firebase Hosting on every push to `main`.

### One-time setup

1. **Create the Hosting site** in the same Firebase project (if using a separate site from rhythm-app):
   ```bash
   firebase use <your-project-id>
   firebase hosting:sites:create crash-course-curriculum-builder
   ```
   Or use the default site by removing the `"site"` key from `firebase.json`.

   Live URL: https://crash-course-curriculum-builder.web.app

2. **Create a service account** for deployment:
   - Firebase Console → Project settings → Service accounts → Generate new private key
   - Copy the full JSON

3. **Add GitHub secrets** (Settings → Secrets and variables → Actions):
   - `FIREBASE_SERVICE_ACCOUNT` — paste the full service account JSON
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — same as your `.env`
