# AI Workflow — AuditFlow Frontend

## Purpose

This document explains how AI assistance was used during the development of the AuditFlow frontend.

The frontend was built with Next.js to consume the AuditFlow backend securely using HTTPOnly cookie authentication.

## AI-assisted workflow

AI was used to support:

- Frontend structure planning.
- API integration design.
- Authentication flow.
- Protected navigation.
- UI page implementation.
- URL-based filters.
- Manual testing documentation.

All generated code and guidance were manually reviewed, executed and tested by the developer.

## Frontend phases

1. Next.js project initialization.
2. Backend API connection.
3. Login, register, logout and auth/me.
4. Main screens:
   - `/login`
   - `/register`
   - `/dashboard`
   - `/projects`
   - `/findings`
5. Findings filters in URL search params.
6. Manual testing documentation.

## Key decisions

### Next.js App Router

The project uses the Next.js App Router with a `src/` directory.

### Cookie-based authentication

The frontend does not store tokens.

Rules:

- No LocalStorage.
- No SessionStorage.
- No token in JSON.
- All authenticated requests use `credentials: "include"`.

### API client

The API client is centralized in:

```txt
src/lib/api.ts
```

This ensures all requests include credentials and consistent error handling.

### URL-based filters

The findings page stores filters in the URL.

Example:

```txt
/findings?severity=HIGH&status=OPEN&page=0
```

This allows:

- Reloading without losing filters.
- Sharing filtered URLs.
- Better UX for listing screens.

## Human review

AI-generated suggestions were tested manually in the browser and validated against the backend API.

The developer verified:

- Login.
- Register.
- Logout.
- Protected routes.
- Project creation rules.
- Findings filters.
- Pagination.
- Cookie behavior.
- Build process.