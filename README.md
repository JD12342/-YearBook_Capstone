# GradBook

GradBook is one unified React web application for Sorsogon National High School. Public visitors, verified students and alumni, staff, and administrators all enter through the same landing page and role-aware login.

## Application structure

```text
src/
  app/          Application shell and the single route tree
  features/
    public/     Landing page and community experience
    auth/       Unified sign-in, registration, and session state
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

## Firebase deployment

After selecting the Firebase project in the Firebase CLI:

```bash
npm run build
firebase deploy --only hosting,firestore:rules,storage
```
