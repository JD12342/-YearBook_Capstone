# GradBook web architecture

GradBook uses a single React application and a single route tree.

## Access flow

1. `/` presents the public landing page.
2. `/login` provides one sign-in and registration experience.
3. The authentication context resolves the account role.
4. Students and alumni continue to `/community`.
5. Staff and administrators continue to the protected management workspace.

## Module boundaries

- `app/AppRoutes.jsx` is the only place that maps URLs to public or role-protected pages.
- `features/public` owns the landing page, community route, editorial sections, animation hook, and editable public content.
- `features/auth` owns the unified sign-in and registration interface, form behavior, route guard, and session-wide authentication context.
- `features/admin` owns the protected dashboard, management pages, reusable admin components, Firebase initialization, service layer, and domain models.
- `styles` contains the global visual system shared by every route.

Keeping those boundaries prevents public, community, and administration features from becoming separate applications again.
