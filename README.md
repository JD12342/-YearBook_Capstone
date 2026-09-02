# GradBook

## Project

GradBook

## Description

GradBook is a capstone project for an interactive 3D digital yearbook and alumni engagement system for Sorsogon National High School. The project is being developed in a modular way to keep the system maintainable and avoid unnecessary complexity.

## Applications

- `mobile/` — React Native application for the mobile experience
- `admin/` — React.js administration website for school staff

## Technologies

The foundation is configured with:

- React Native (Expo)
- React.js (Vite)
- Firebase Authentication
- Firebase Firestore
- Firebase Storage

## Running the Project

### Mobile

```bash
cd mobile
npm install
npm start
```

### Admin

```bash
cd admin
npm install
npm run dev -- --host 0.0.0.0
```

## Development Approach

GradBook will be developed one module at a time so the application remains manageable, testable, and easier to extend without introducing unnecessary complexity.
