# contexts/

This directory contains React Context providers — shared state that must be accessible across the entire component tree.

## Purpose

React hooks using `useState` create **local** state per component instance.
When the same logical state must be shared (e.g., the current user's JWT), it must be lifted into a Context Provider that wraps the app.

Components access context via the corresponding hook (e.g. `useAuth` from `@/hooks/useAuth.ts`).
**Never import from this directory directly in components.** Always use the hook.

## Files

| File               | Provider        | Shared State                                      |
|--------------------|-----------------|---------------------------------------------------|
| `AuthContext.tsx`  | `<AuthProvider>`| `user`, `token`, `isLoading`, `error`, `login()`, `signup()`, `logout()` |

## Architecture Note

```
app/layout.tsx
  └─ <AuthProvider>          ← single state instance for the whole tree
       ├─ Navbar             → useAuth() reads user, calls logout()
       ├─ ProtectedRoute     → useAuth() reads user, isLoading
       └─ LoginForm          → useAuth() calls login(), reads error
```

Without the Provider, each component's `useAuth()` call would create isolated state.
`LoginForm` setting `user` would not be seen by `ProtectedRoute`.

## Adding New Contexts

Create one file per shared concern:
```
contexts/
├── AuthContext.tsx    ← exists
└── ThemeContext.tsx   ← add if global theme needs shared state
```

Each new context file must export:
1. A `Provider` component to mount in `layout.tsx`.
2. A typed hook (or re-export it via `@/hooks/`).
Update this README when adding new context files.
