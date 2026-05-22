This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Manual Testing

Manual testing results are documented in:

```txt
docs/manual-testing.md


---

# 4. Probar que no usamos LocalStorage ni SessionStorage

Ejecuta:

```powershell
Select-String -Path src\**\*.ts,src\**\*.tsx -Pattern "localStorage|sessionStorage"

# AuditFlow Frontend

Frontend for AuditFlow, a security audit management platform.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

## Main Features

- Login page.
- Register page.
- Dashboard.
- Projects page.
- Findings page.
- Cookie-based authentication.
- Protected navigation.
- Role-aware UI behavior.
- Findings filters stored in URL.
- Findings pagination.

## Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |

## Deploy URLs

Deployment URLs are pending.

| Service | URL |
|---|---|
| Frontend production | Pending |
| Backend production | Pending |

## Environment Variables

Create a local `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Do not commit `.env.local`.

## Run Locally

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Build

```bash
npm run build
```

## Authentication

The frontend uses cookie-based authentication.

The backend sets the JWT as an HTTPOnly cookie.

Frontend rules:

- Do not store token in LocalStorage.
- Do not store token in SessionStorage.
- Do not read the token with JavaScript.
- Use `credentials: "include"` in API requests.

API client:

```txt
src/lib/api.ts
```

Auth service:

```txt
src/lib/auth.ts
```

## Pages

| Route | Description |
|---|---|
| `/login` | User login |
| `/register` | Public user registration |
| `/dashboard` | Main authenticated dashboard |
| `/projects` | Project listing and creation |
| `/findings` | Findings listing, creation, filters and pagination |

## Test Credentials

Seed data from the backend creates:

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@auditflow.local | Admin123! |
| AUDITOR | auditor@auditflow.local | Auditor123! |

## Findings Filters

The findings page supports URL-based filters.

Examples:

```txt
/findings
/findings?severity=HIGH
/findings?status=OPEN
/findings?severity=HIGH&status=OPEN&page=0
/findings?projectId=1&severity=CRITICAL&status=OPEN&page=0
```

Valid severities:

```txt
LOW
MEDIUM
HIGH
CRITICAL
```

Valid statuses:

```txt
OPEN
IN_PROGRESS
RESOLVED
CLOSED
FALSE_POSITIVE
```

Invalid values should not break the UI.

Example:

```txt
/findings?severity=HIGH&status=PUBLISHED&page=1
```

The UI should show a warning because `PUBLISHED` is not a valid finding status.

## Manual Testing

Manual testing is documented in:

```txt
docs/manual-testing.md
```

Validated flows include:

- Admin login.
- Auditor login.
- Logout.
- HTTPOnly cookie.
- No LocalStorage usage.
- No SessionStorage usage.
- Admin creates project.
- Auditor cannot create project.
- Auditor sees only assigned projects.
- Auditor creates finding in assigned project.
- Auditor cannot create finding in unassigned project.
- Findings filters.
- Pagination.
- Local deployment.

## Technical Decisions

- Next.js was selected for frontend routing and React-based UI.
- Tailwind CSS was selected for fast and consistent styling.
- API calls are centralized in `src/lib/api.ts`.
- The frontend does not handle JWT directly.
- Protected navigation is based on `/api/auth/me`.
- Findings filters are stored in URL search params for better UX.