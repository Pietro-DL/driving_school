# components/

Shared "dumb" components reused across multiple features and pages.

## Purpose

Components here are presentational building blocks.
They receive props or read from context (via hooks); they do NOT fetch data directly.

## Rules

- **No fetch() calls.** Delegate to `@/hooks/` which delegates to `@/api/`.
- **No feature-specific logic.** Feature-specific components live in `@/features/`.
- **Accessible by default.** All interactive elements have proper ARIA attributes, labels, and keyboard support.

## Files

| File                | Purpose                                                     |
|---------------------|-------------------------------------------------------------|
| `Navbar.tsx`        | Sticky global top nav. Conditionally renders auth links.    |
| `ProtectedRoute.tsx`| Auth guard wrapper. Redirects to /login if user is null.    |

## Adding New Shared Components

Create a file per component. Naming convention: `PascalCase.tsx`.
Examples for future phases:
- `Button.tsx` — Reusable button with loading/disabled states
- `Input.tsx` — Reusable labeled input with error display
- `VideoPlayer.tsx` — Shared video lesson player

Update this README when adding new files.
