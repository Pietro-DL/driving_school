# types/

This directory contains all shared TypeScript type definitions for the frontend.

## Purpose

Types act as the **contract layer** between the frontend and the backend.
Every interface here is a strict mirror of a Pydantic schema in the FastAPI backend.
If the backend schema changes, the corresponding type here MUST be updated.

## Rules

- **No invented types.** Every interface must map to a backend schema or be a frontend-only helper explicitly marked as such.
- **snake_case only.** Field names match backend JSON exactly. Do not camelCase backend fields.
- **No logic.** This directory contains type definitions only. No functions, no classes, no runtime code.
- **Source of truth:** `agent_tools/coding_tools/openapi.json` → `components/schemas/*`

## Files

| File              | Contents                                                          |
|-------------------|-------------------------------------------------------------------|
| `auth.types.ts`   | `UserCreate`, `UserResponse`, `Token`, `LoginCredentials`, `HTTPValidationError`, `ValidationError`, `ApiErrorShape` |

## Adding a New Type File

When the backend exposes a new resource (e.g. lessons, quizzes), create a matching file:

```
types/
├── auth.types.ts       ← exists
├── lessons.types.ts    ← add when GET /api/v1/lessons spec is finalized
└── quizzes.types.ts    ← add when GET /api/v1/quizzes spec is finalized
```

Never create a type file for a resource whose backend contract is missing or ambiguous.
Flag the blocker and wait for the OpenAPI spec update.
