# features/auth/components/

Presentation components for the authentication feature.

## Purpose

Components here are **dumb** — they render UI and capture user input.
They do NOT:
- Call `fetch()` directly.
- Import from `@/api/`.
- Manage auth state (token, user profile, loading flags).

All logic is delegated to the `useAuth` hook (`@/hooks/useAuth`).

## Files

| File            | Renders                                              | Hook Used  |
|-----------------|------------------------------------------------------|------------|
| `LoginForm.tsx` | Email + password form. Error banner. Loading spinner. | `useAuth` |
| `SignupForm.tsx` | Nome, Cognome, Email, Password, Conferma password form. Client-side password-match check. | `useAuth` |

## UI Decisions

- **Language:** Italian text hardcoded as a placeholder for the future i18n module.
- **Styling:** Tailwind CSS v4. Zinc palette + indigo accent. Dark mode via `dark:` variants.
- **Accessibility:** `<label htmlFor>` paired with `<input id>`. `role="alert"` on error banners. `aria-invalid` + `aria-describedby` on the confirm-password field when mismatched.
- **Loading state:** Submit button disabled + spinner when `isLoading === true`.
- **Error display:** Single banner at the top of the form. Sourced from `useAuth.error` (hook) or local validation (password mismatch).

## Adding New Auth Components

Place any future auth-related UI here:
- `PasswordResetRequestForm.tsx` — when `/api/v1/auth/reset-password` is specified
- `PasswordResetConfirmForm.tsx` — when the token-confirmation endpoint is specified

Update this README and `features/auth/README.md` when new components are added.
