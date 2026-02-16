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
