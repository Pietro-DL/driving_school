# features/auth/

This directory is the self-contained UI module for authentication.

## Purpose

Owns the complete login, signup, and (future) password-reset user experience.

## Structure

```
features/auth/
├── README.md              ← This file.
└── components/
    ├── README.md          ← Component-level docs.
    ├── LoginForm.tsx      ← Login form component.
    └── SignupForm.tsx     ← Signup form component.
```

## Data Flow

```
app/login/page.tsx
  └─ renders LoginForm
       └─ calls useAuth.login(email, password)
            └─ calls api/auth.api.loginRequest()
                 └─ POST /api/v1/auth/login  (form-data)
                      └─ on success: calls getMeRequest() → redirect /dashboard
                      └─ on failure: sets Italian error string on hook state
```

## Backend Contracts (Auth Feature)

| UI Action         | Endpoint                    | Method | Auth |
|-------------------|-----------------------------|--------|------|
| Login form submit | `/api/v1/auth/login`        | POST   | No   |
| Signup form submit | `/api/v1/auth/signup`      | POST   | No   |
| Profile fetch (post-login) | `/api/v1/users/me` | GET  | Bearer |

All contracts are finalized in `agent_tools/coding_tools/openapi.json`.

## Future Components (Blocked — Awaiting Backend Specs)

- `PasswordResetRequestForm.tsx` — needs `POST /api/v1/auth/forgot-password`
- `PasswordResetConfirmForm.tsx` — needs `POST /api/v1/auth/reset-password`
