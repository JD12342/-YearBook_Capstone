# GradBook

GradBook is one unified React web application for Sorsogon National High School. Public visitors, verified community users, and administrators all enter through the same landing page and role-aware login.

## Application structure

```text
src/
  app/          Application shell and the single route tree
  features/
    public/     Landing page and public storytelling experience
    auth/       Unified sign-in, registration, and session state
    user/       Read-only community portal for verified users
    admin/      Protected administration workspace and Firebase services
  styles/       Global and application-wide styling
  main.jsx      Browser entry point
public/         Static images, seal, and campus video
```

Each feature owns its pages, components, hooks, and data. The public website and administrative workspace remain routes in the same application, with one dependency set, one build output, and one Firebase configuration.

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Production build

```bash
npm run build
```

The deployable website is generated in `dist/`. Firebase Hosting is configured to serve the application and route all browser paths through React Router.

## Vercel deployment

The repository includes a Vercel configuration for Vite builds, direct-link React Router support, production headers, and static asset caching. Add the Firebase values from `.env.example` to the Vercel project before deploying. The production build stops with a clear error if any required Firebase value is missing.

Follow the complete [Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md), including the required Firebase Authorized Domains and Firebase rules steps.

## Firebase deployment

GradBook does not trust a role selected in the browser. After Firebase Authentication verifies the email and password, the application resolves the role from either a Firebase Auth custom claim or an active `users/{uid}` Firestore document.

The authorization model intentionally has only two roles:

- `Administrator` can use the management workspace, approve accounts, and publish content.
- `User` can view the authenticated community website and published content.

Student, Teacher, and Staff are profile types, not permission roles. Registration stores the selected `profileType` and a school reference number for administrator verification, while approved accounts always receive the `User` role.

The initial administrator is bootstrapped from the exact Firebase Authentication UID `iVLZld9fcpcPQXbat8jdlmN6AsC3`. After the matching Firestore rules are published, its first successful login creates or repairs this trusted profile automatically:

```text
Collection: users
Document ID: iVLZld9fcpcPQXbat8jdlmN6AsC3
Fields:
  role: Administrator
  status: active
  email: <the email attached to that Firebase UID>
```

The bootstrap is limited to that exact server-authenticated UID and is duplicated in the application, Firestore rules, and Storage rules. Change all three locations together if the initial administrator account changes. Ordinary browser registrations cannot request an administrator role. Once the first administrator is active, approving an access request in GradBook creates the corresponding trusted `User` profile. Students, teachers, and staff may describe their school profile during registration, but that request grants no access until approval.

After selecting the Firebase project in the Firebase CLI:

```bash
npm run build
firebase deploy --only hosting,firestore:rules,storage
```
