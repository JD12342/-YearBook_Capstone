# Deploy GradBook to Vercel

GradBook is configured as a Vite single-page application. Vercel builds `dist/`, serves its static assets, and sends application routes such as `/login`, `/reports`, and `/community/yearbooks/...` to `index.html` so React Router can open them directly.

## 1. Import the repository

Import `JD12342/-YearBook_Capstone` in Vercel. The included `vercel.json` supplies the install, build, output, routing, caching, and camera permission settings, so no build fields need to be overridden in the Vercel dashboard.

## 2. Add Firebase environment variables

In **Vercel → Project Settings → Environment Variables**, add these variables for Production and Preview. Use the values from the local `.env` file; do not commit that file.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

The first six variables are required. `VITE_FIREBASE_MEASUREMENT_ID` is optional. Vite places `VITE_` values in the browser bundle, so they identify the Firebase web app and are not server secrets. Firestore and Storage rules remain the security boundary.

## 3. Authorize the deployed domain in Firebase

After Vercel assigns the site URL, open **Firebase Console → Authentication → Settings → Authorized domains** and add the exact Vercel hostname, for example:

```text
your-gradbook-project.vercel.app
```

Add each custom domain too. Keep Email/Password enabled under **Authentication → Sign-in method**. Without an authorized domain, Firebase sign-in can fail even though the website loads.

## 4. Publish Firebase rules

Vercel deploys the website only. From this repository, publish the database and file-access rules separately:

```bash
firebase login
firebase use capstone-b4b3e
firebase deploy --only firestore:rules,storage
```

The checked-in `.firebaserc` already selects `capstone-b4b3e`. Review the administrator UID in `firebase.rules` and `storage.rules` before changing Firebase projects.

## 5. Verify the production deployment

Run the local release checks before pushing:

```bash
npm ci
npm run check
```

After deployment, verify these production behaviors:

- Opening `/login`, `/reports`, and a yearbook URL directly does not return 404.
- Administrator and approved User accounts reach their correct portals.
- Camera capture prompts for camera access over HTTPS.
- Approved portraits, content images, audio, and yearbook covers load from Firebase Storage.
- Face search loads the three models under `/face-models/` and can start the camera.
- A page refresh preserves the current React route.

Vercel automatically provides HTTPS, which is required by browser camera APIs outside localhost.
