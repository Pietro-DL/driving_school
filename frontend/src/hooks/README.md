# hooks/

This directory contains custom React hooks.
Hooks are the **state and orchestration layer** — they sit between components and the API client.

## Purpose

A hook manages:
- Async operation state (`isLoading`, `error`, `data`)
- Side effects (redirects after success/failure)
- Calling API client functions and reacting to results

A hook does NOT:
- Render any JSX
- Call `fetch()` directly (delegates to `@/api/`)
- Manage routing logic beyond redirects after auth events

## Rules

- All hooks are `"use client"` — they use browser APIs (`useState`, `useRouter`).
- Error messages are in Italian (primary locale). Map HTTP status codes → Italian strings inside the hook.
- No `localStorage` or `sessionStorage`. Phase 1 stores tokens in React state only.
- One hook per domain concern. Don't merge auth and quiz state into one hook.

## Files

| File         | Manages                                                              |
|--------------|----------------------------------------------------------------------|
| `useAuth.ts` | Login, signup, logout. Holds `user`, `token`, `isLoading`, `error`. |

## State Exposed by `useAuth`

| Property    | Type                  | Description                                          |
|-------------|-----------------------|------------------------------------------------------|
| `user`      | `UserResponse \| null` | Authenticated user profile. Null = not logged in.   |
| `token`     | `string \| null`      | JWT in memory. Lost on page refresh (Phase 1).       |
| `isLoading` | `boolean`             | True during any async auth operation.                |
| `error`     | `string \| null`      | Italian-language error message for the UI.           |
| `login()`   | `async (email, pw)`   | Calls login API, then getMeRequest, then redirects.  |
| `signup()`  | `async (UserCreate)`  | Calls signup API, then redirects to /login.          |
| `logout()`  | `() => void`          | Clears state, redirects to /login.                   |
| `clearError()` | `() => void`       | Resets error to null (e.g. when user starts typing). |

## Adding a New Hook

Create one file per domain. Example when lessons feature is implemented:

```
hooks/
├── useAuth.ts      ← exists
├── useLesson.ts    ← add when lessons API is finalized
└── useQuiz.ts      ← add when quizzes API is finalized
```

Each new hook must have a companion update to this README describing its state shape.
