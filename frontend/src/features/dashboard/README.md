# features/dashboard/

The main dashboard view shown to authenticated users after login.

## Purpose

Provides a personalized overview of the user's learning progress.
Aggregates data from multiple features (lessons, quizzes) in one place.

## Current State (Phase 7)

Lesson and quiz widgets are **placeholder only** — they use hardcoded mock data.
They will be replaced with live data once the backend APIs are specified and implemented.

| Widget                | Data Source        | Status                         |
|-----------------------|--------------------|--------------------------------|
| Hero / Greeting       | `useAuth().user`   | ✅ Live — reads `first_name`, `plan_tier`, `role`, `email` |
| Resume Learning card  | Lessons API        | ⚠ Placeholder — blocked on `GET /api/v1/lessons` spec |
| Quiz Snapshot card    | Quizzes API        | ⚠ Placeholder — blocked on `GET /api/v1/quizzes` spec  |
| Upsell card           | `useAuth().user`   | ✅ Conditional — shown only when `plan_tier === "free"` |

## Structure

```
features/dashboard/
├── README.md              ← This file.
└── components/
    ├── README.md          ← Component-level docs.
    └── Dashboard.tsx      ← Main dashboard component.
```

## Data Flow

```
app/dashboard/page.tsx
  └─ <ProtectedRoute>         ← guards the route
       └─ <Dashboard>
            └─ useAuth()      ← reads user.first_name, plan_tier, role
```

## Backend Contracts (Future)

| Widget to implement   | Endpoint needed                  |
|-----------------------|----------------------------------|
| Resume Learning       | `GET /api/v1/lessons?recent=1`   |
| Quiz Snapshot         | `GET /api/v1/quizzes/results`    |
| Upsell CTA            | `POST /api/v1/payments/checkout` |

All three are **blocked** until backend contracts are finalized in the OpenAPI spec.
