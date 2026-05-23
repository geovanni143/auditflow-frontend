# AI Workflow — AuditFlow Frontend

## Purpose

This document explains how AI tools were used during the development of the AuditFlow frontend.

AuditFlow is a fullstack MVP for managing security audit projects, assigned auditors and vulnerability findings. The frontend was built with Next.js, React, TypeScript and Tailwind CSS, and it connects to the backend using HTTPOnly cookie-based authentication.

AI was used as a support tool during development, mainly for planning, reviewing ideas, debugging issues and improving documentation. The final implementation, testing and commits were handled manually.

---

## AI Tools Used

The AI tools used during the project were:

- ChatGPT
- Claude

They were used as assistants to review requirements, organize tasks, reason about frontend behavior and troubleshoot production issues.

AI suggestions were reviewed before being applied. I did not copy changes blindly; I tested the behavior locally and in production before committing.

---

## How AI Was Used

AI helped with:

- Breaking the frontend work into smaller phases.
- Reviewing the challenge requirements.
- Planning the Next.js App Router structure.
- Designing the API integration flow.
- Reviewing the login, register and logout flow.
- Improving protected route behavior.
- Debugging cookie/session behavior in production.
- Improving documentation and testing notes.

The final code was adjusted to match the real backend behavior and the actual production deployment.

---

## What I Implemented and Reviewed Manually

I manually implemented, reviewed and tested:

- Next.js project structure.
- Login page.
- Register page.
- Dashboard page.
- Projects page.
- Findings page.
- Users page.
- Centralized API client.
- Protected route behavior.
- Role-based navigation.
- URL-based filters for findings.
- Pagination behavior.
- Error handling in the UI.
- Vercel deployment.
- Production environment variables.
- Browser testing with demo credentials.

AI helped with guidance, but the final decisions and changes were validated manually.

---

## Frontend Development Phases

### Phase 1 — Project Setup

The frontend was created with Next.js using the App Router and a `src/` directory.

Main technologies:

- Next.js
- React
- TypeScript
- Tailwind CSS

---

### Phase 2 — API Client

A centralized API client was created in:

```txt
src/lib/api.ts
```

This file handles:

- API requests.
- JSON responses.
- API errors.
- Credential handling.

Authenticated requests use:

```ts
credentials: "include"
```

This is required because authentication is handled with HTTPOnly cookies from the backend.

---

### Phase 3 — Authentication Flow

The frontend includes:

- Login.
- Register.
- Logout.
- Current user validation with `/api/auth/me`.

The frontend does not store tokens manually.

Rules followed:

- No LocalStorage.
- No SessionStorage.
- No frontend-managed token.
- Session handled through HTTPOnly cookies.

---

### Phase 4 — Main Screens

The main frontend screens are:

- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/findings`
- `/users`

The UI was kept simple and focused on the challenge requirements.

---

### Phase 5 — Projects

The projects page allows Admin users to manage audit projects.

The frontend shows actions depending on the user role, but the backend is still responsible for enforcing real authorization.

---

### Phase 6 — Findings

The findings page allows users to view and manage vulnerability findings according to their permissions.

Findings include:

- Title.
- Severity.
- Status.
- Project.
- Description.
- Recommendation.
- Evidence.

---

### Phase 7 — URL-Based Filters

The findings page stores filters in the URL.

Example:

```txt
/findings?severity=HIGH&status=OPEN&page=0
```

This allows:

- Reloading without losing filters.
- Sharing filtered URLs.
- Keeping filter state visible in the address bar.
- Better testing of list behavior.

---

### Phase 8 — Protected Navigation

Protected routes were added for:

- `/dashboard`
- `/projects`
- `/findings`
- `/users`

The goal was to prevent private screens from being visible to unauthenticated users.

The `/users` route is restricted to Admin users.

Frontend route protection improves the user experience, but backend authorization remains the main security layer.

---

### Phase 9 — Production Configuration

The frontend was deployed on Vercel.

The backend was deployed on Render.

Because the frontend and backend run on different domains, API requests were routed through Next.js rewrites to make the session flow more stable in production.

The frontend calls relative paths such as:

```txt
/api/auth/login
/api/auth/me
/api/projects
/api/findings
```

Next.js forwards those requests to the backend.

---

## Key Decisions

### Next.js App Router

The App Router was used to organize pages and layouts clearly.

This made it easier to separate public pages, protected pages and shared route behavior.

---

### TypeScript

TypeScript was used to make API types, component props and error handling clearer.

---

### Tailwind CSS

Tailwind CSS was used to build a clean interface quickly while keeping styling consistent.

---

### HTTPOnly Cookie Authentication

The frontend does not handle the token directly.

The backend creates and validates the HTTPOnly cookie.

This was important because the challenge explicitly prohibits storing session tokens in LocalStorage or SessionStorage.

Rules followed:

- No token in LocalStorage.
- No token in SessionStorage.
- No token stored manually in the frontend.
- Authenticated requests include credentials.
- The backend remains responsible for validating the session.

---

### Centralized API Client

Using one API client helped keep request behavior consistent across the application.

It also made it easier to confirm that all authenticated requests include credentials.

---

## AI Mistakes and Corrections

AI helped during the project, but some suggestions required correction.

---

### 1. Cookie Behavior in Production

At first, direct requests from Vercel to Render caused session behavior to be inconsistent in some browsers.

Correction:

- The frontend API client was changed to use relative `/api/...` paths.
- Next.js rewrites were added to proxy requests to the backend.
- Requests still use `credentials: "include"`.

This made the session flow more reliable in production.

---

### 2. Protected Page Flash

A protected page could briefly appear before the session validation finished.

Correction:

- Protected route handling was added.
- Private content is not shown before validation.
- Unauthenticated users are redirected to login.

This improved the user experience and prevented protected information from appearing during the initial render.

---

### 3. Session Check on Every Page Change

After adding route protection, the “Verifying session” screen appeared too often when navigating between protected pages.

Correction:

- The session validation behavior was adjusted to avoid unnecessary loading screens during normal authenticated navigation.
- No token was stored in LocalStorage or SessionStorage.
- The frontend still validates the session safely before showing private content.

---

## Testing Approach

The frontend was tested with local builds, browser testing and production testing.

---

## Build Verification

Before committing important changes, the frontend build was checked with:

```bash
npm run build
```

This was used to confirm that the frontend compiled correctly before committing changes.

---

## Authentication Tests

Tested scenarios:

- Login as Admin.
- Login as Auditor.
- Invalid login.
- Register organization.
- Logout.
- Redirect after login.
- Redirect after logout.
- Calling `/api/auth/me` through the frontend session flow.

---

## Protected Route Tests

Tested scenarios:

- Open `/dashboard` without session.
- Open `/projects` without session.
- Open `/findings` without session.
- Open `/users` without session.
- Open protected routes in incognito mode.
- Refresh protected pages.
- Confirm protected content does not appear before validation.
- Confirm unauthenticated users are redirected to login.

---

## Role Tests

Tested scenarios:

- Admin can access the users page.
- Auditor cannot access the users page.
- Admin sees management actions.
- Auditor only sees allowed actions.
- Backend still blocks unauthorized API requests.

---

## Projects Page Tests

Tested scenarios:

- Admin can view projects.
- Admin can create projects.
- Admin can update projects.
- Admin can delete projects.
- Admin can assign auditors to projects.
- Auditor only sees assigned projects.
- Auditor does not see Admin-only actions.

---

## Findings Filter Tests

Tested URLs:

```txt
/findings?severity=HIGH
/findings?status=OPEN
/findings?severity=CRITICAL&status=OPEN&page=0
```

The goal was to confirm that filters remain reflected in the URL.

Tested scenarios:

- Filtering findings by severity.
- Filtering findings by status.
- Combining severity and status filters.
- Keeping filters after refresh.
- Keeping pagination in the URL.

---

## Production Tests

Production testing included:

- Vercel frontend.
- Render backend.
- Neon database.
- Demo credentials.
- Browser testing.
- Incognito testing.
- Direct route access testing.
- Login and logout testing.
- Refreshing protected pages.
- Testing API requests through the frontend proxy.

---

## Manual Review Process

Before committing changes, I reviewed:

- Whether the frontend matched the challenge requirements.
- Whether tokens were not stored in LocalStorage or SessionStorage.
- Whether protected pages were guarded.
- Whether API requests included credentials.
- Whether role-based UI behavior matched backend rules.
- Whether findings filters were reflected in the URL.
- Whether the app compiled successfully.
- Whether the deployed version worked with demo credentials.
- Whether the production frontend communicated correctly with the backend.
- Whether unauthenticated users were redirected correctly.
- Whether Admin-only pages were not available to Auditors.

---

## What I Can Explain

I can explain:

- Why Next.js was used.
- How the App Router structure works.
- How the frontend communicates with the backend.
- Why tokens are not stored in browser storage.
- Why `credentials: "include"` is needed.
- How protected routes work.
- How role-based navigation works.
- How findings filters are stored in the URL.
- Why API requests are proxied through Next.js in production.
- How the frontend was deployed on Vercel.
- How the frontend works with the Render backend.
- How the session is validated with `/api/auth/me`.
- Why the backend remains the final authorization layer.

---

## Final Notes

AI was useful for planning, debugging and documentation, but the frontend was manually reviewed, tested and adjusted.

The final implementation keeps the session flow simple, avoids storing tokens in browser storage and relies on the backend as the main authorization layer.

The main goal was to keep the frontend understandable, functional and aligned with the technical challenge requirements.
