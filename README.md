# GradBook

## Project

GradBook

## Description

GradBook is a capstone project for a digital yearbook and alumni engagement system for Sorsogon National High School. It has separate browser experiences for the school community and school staff.

## Applications

- `client/` — React.js public client website for students, alumni, and families
- `admin/` — React.js administration website for school staff

## Technologies

The foundation is configured with:

- React.js (Vite)
- Firebase Authentication
- Firebase Firestore
- Firebase Storage

## Running the Project

### Client website

```bash
cd client
npm install
npm run dev
```

### Admin

```bash
cd admin
npm install
npm run dev -- --host 0.0.0.0
```

## Development Approach

GradBook will be developed one module at a time so the application remains manageable, testable, and easier to extend without introducing unnecessary complexity.
