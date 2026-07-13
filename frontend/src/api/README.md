# api/

This directory contains the HTTP client layer — the only place where `fetch()` is called.

## Purpose

Each file in this directory corresponds to one backend resource group (e.g. auth, lessons, quizzes).
Functions map 1:1 to backend endpoints defined in the OpenAPI spec.

## Rules

- **No state management.** Functions here do not call `useState`, `useContext`, or any React API.
- **No UI side effects.** No redirects, no toast notifications, no console.log in production.
- **Throw on non-2xx.** Every function throws a typed `ApiError` on failure. The hook layer handles it.
- **No invented endpoints.** Every function must correspond to a route in `agent_tools/coding_tools/openapi.json`.
- **Environment variable:** Base URL comes from `NEXT_PUBLIC_API_BASE_URL`. Never hardcode `localhost:8000`.

## Files

| File           | Endpoints Covered                                                        |
|----------------|--------------------------------------------------------------------------|
| `auth.api.ts`  | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `GET /api/v1/users/me` |

## Error Handling

All functions throw `ApiError` (defined in `auth.api.ts`). The shape:

```typescript
class ApiError extends Error {
  status: number;           // HTTP status code (401, 422, 500, …)
  detail?: ValidationError[]; // Present on 422 responses
}
```

Hooks catch `ApiError` by `status` to produce user-facing messages.

## Adding a New Resource File

Create one file per backend resource. Example when lessons endpoint is ready:

```
api/
├── auth.api.ts       ← exists
├── lessons.api.ts    ← add when GET /api/v1/lessons is finalized
└── quizzes.api.ts    ← add when GET /api/v1/quizzes is finalized
```

**Blocker protocol:** If the backend route spec is missing, stop. Do not mock.
Flag the missing contract and wait for the OpenAPI update.

## Local Development

Set base URL in `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The module throws at load time if this variable is absent, preventing silent failures.
