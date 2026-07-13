# frontend\src\README.md

This directory contains all source code for the Next.js 16 frontend application.
It serves as the global specification for the frontend architecture, data-flow rules, and integration contracts with the FastAPI backend.

Every subdirectory MUST contain its own `README.md` describing its purpose (see: `frontend_skill.md` — Tiered Context Management rule).
**Design phylosophy**
1. `Page` → `Component` → `Hook` → `API Client` → `Backend`
  this because we ensure seperation of concerns and a clear data flow.
---

## Tech Stack

| Layer         | Technology                 | Version  |
|---------------|----------------------------|----------|
| Framework     | Next.js (App Router)       | 16.2.10  |
| Language      | TypeScript (strict mode)   | ^5       |
| UI Library    | React                      | 19.2.4   |
| Styling       | Tailwind CSS               | ^4       |
| Backend       | FastAPI + PostgreSQL       | 0.1.0    |
| Auth Protocol | OAuth2 Password Bearer + JWT | —      |

---

## Directory Structure

```
frontend/src/
├── README.md          ← You are here. Global frontend specification.
│
├── app/               # Next.js App Router pages (route = folder)
│   ├── layout.tsx     # Root layout. Wraps all pages. Provides fonts, global CSS, i18n provider.
│   ├── page.tsx       # Landing page → localhost:3000/
│   ├── globals.css    # Tailwind imports + global custom properties.
│   ├── login/
│   │   └── page.tsx   # Login page → localhost:3000/login
│   ├── signup/
│   │   └── page.tsx   # Signup page → localhost:3000/signup
│   ├── dashboard/
│   │   └── page.tsx   # Protected. User dashboard → localhost:3000/dashboard
│   ├── lessons/
│   │   ├── page.tsx   # Lessons list → localhost:3000/lessons
│   │   └── [id]/
│   │       └── page.tsx  # Single lesson (text or video) → localhost:3000/lessons/:id
│   └── quizzes/
│       ├── page.tsx      # Quiz list → localhost:3000/quizzes
│       └── [id]/
│           └── page.tsx  # Quiz runner → localhost:3000/quizzes/:id
│
├── types/             # TypeScript interfaces. Mirror backend Pydantic schemas exactly.
│   └── auth.types.ts  # UserCreate, UserResponse, Token, LoginCredentials, ValidationError
│
├── api/               # HTTP client layer. One file per backend resource.
│   └── auth.api.ts    # signup(), login(), getMe() — calls to /api/v1/auth/* and /api/v1/users/me
│
├── hooks/             # Custom React hooks. State + side-effects logic.
│   └── useAuth.ts     # Manages login/signup flow, JWT storage, loading/error state.
│
├── features/          # Domain-driven UI modules. Each feature is self-contained.
│   ├── auth/          # Login form, signup form, password reset UI.
│   │   └── components/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── lessons/       # Lesson viewer (text + video rendering).
│   │   └── components/
│   │       ├── LessonCard.tsx
│   │       └── LessonViewer.tsx
│   ├── quizzes/       # Quiz runner, result screens.
│   │   └── components/
│   │       ├── QuizCard.tsx
│   │       └── QuizRunner.tsx
│   └── payments/      # Pricing table, Stripe checkout redirect.
│       └── components/
│           └── PricingTable.tsx
│
├── components/        # Shared "dumb" components. Reusable across features.
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ProtectedRoute.tsx  # Wrapper. Redirects unauthenticated users to /login.
│
└── i18n/              # Internationalization module.
    ├── config.ts      # Supported locales, default locale, detection strategy.
    └── locales/
        ├── it.json    # Italian (primary, mandatory).
        └── en.json    # English (future extension).
```

---

## Architectural Data Flow

Every user interaction that triggers an HTTP request MUST follow this 5-layer pipeline.
No layer may skip another.

```
[ Page ]  →  [ Component ]  →  [ Hook ]  →  [ API Client ]  →  [ Backend ]
 (app/)     (features/*)     (hooks/)       (api/)          (FastAPI)
   ↑              ↑              ↑               ↑
   |              |              |               |
  Route        UI render     State mgmt     HTTP fetch
  only         + events      + side-fx      + JSON parse
```

### Layer-by-layer rules:

**1. Pages (`app/`)** — Route entry points only.
- Import one feature component.
- No business logic.
- No direct fetch calls.
- Server Component by default. Add `"use client"` only when the page needs browser APIs.

**2. Components (`features/*/components/`)** — Visual rendering + event capture.
- Render HTML/JSX.
- Capture user input (forms, clicks).
- Call hook functions on events.
- Never call `fetch()` directly.

**3. Hooks (`hooks/`)** — State management + orchestration.
- Manage `isLoading`, `error`, `data` states.
- Call API client functions.
- Handle success/failure branching (redirect on success, set error on failure).
- Store JWT in browser memory.

**4. API Client (`api/`)** — HTTP transport only.
- Build request (URL, method, headers, body).
- Call `fetch()`.
- Parse response JSON.
- Throw typed errors on non-2xx status.
- Never manage UI state.

**5. Backend (FastAPI)** — Source of truth.
- Validates data.
- Executes business logic.
- Returns JSON responses per OpenAPI spec.

---

## Step 1: The Contract — Types (`types/auth.types.ts`)

TypeScript interfaces MUST mirror backend Pydantic schemas exactly.
Source of truth: `agent_tools/coding_tools/openapi.json`.
Field names use `snake_case` to match backend JSON.

### Schemas derived from OpenAPI:

```typescript
// Mirrors: components/schemas/UserCreate
export interface UserCreate {
  email: string;        // format: email
  first_name: string;
  last_name: string;
  password: string;
}

// Mirrors: components/schemas/UserResponse
export interface UserResponse {
  email: string;        // format: email
  first_name: string;
  last_name: string;
  id: string;           // format: uuid
  role: string;
  plan_tier: string;
  is_active: boolean;
  created_at: string;   // format: date-time (ISO 8601)
}

// Mirrors: components/schemas/Token
export interface Token {
  access_token: string;
  token_type: string;
}

// Login form uses OAuth2 form-data, NOT JSON.
// The backend expects: Content-Type: application/x-www-form-urlencoded
export interface LoginCredentials {
  username: string;     // This IS the email. OAuth2 spec requires "username" field name.
  password: string;
  //note: we may want to also let the user acces with his own email linked to the username
}

// Mirrors: components/schemas/ValidationError
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

// Mirrors: components/schemas/HTTPValidationError
export interface HTTPValidationError {
  detail?: ValidationError[];
}
```

> **Critical:** The login endpoint expects `application/x-www-form-urlencoded`, NOT `application/json`. The API client must encode accordingly. The field name is `username` (which maps to the user's email). These quirks come from OAuth2 spec compliance in FastAPI.

---

## Step 2: The Bridge — API Client (`api/auth.api.ts`)

Async functions using the browser's native `fetch` API.
One function per backend endpoint.
Base URL loaded from environment variable.

### Environment Variable:

```
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Endpoint Mapping:

| Function          | Method | Backend Route          | Content-Type                          | Auth Required |
|-------------------|--------|------------------------|---------------------------------------|---------------|
| `signupRequest()` | POST   | `/api/v1/auth/signup`  | `application/json`                    | No            |
| `loginRequest()`  | POST   | `/api/v1/auth/login`   | `application/x-www-form-urlencoded`   | No            |
| `getMeRequest()`  | GET    | `/api/v1/users/me`     | —                                     | Yes (Bearer)  |

### Pseudocode:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// POST /api/v1/auth/signup — JSON body
export async function signupRequest(data: UserCreate): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// POST /api/v1/auth/login — URLSearchParams body (OAuth2 form)
export async function loginRequest(creds: LoginCredentials): Promise<Token> {
  const body = new URLSearchParams({
    username: creds.username,
    password: creds.password,
  });
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// GET /api/v1/users/me — Bearer token in Authorization header
export async function getMeRequest(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
```

### Error Handling Pattern:

```typescript
// Standard error wrapper for non-2xx responses
async function parseError(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  // Return structured error with status + backend detail
  return new ApiError(res.status, body?.detail ?? "Request failed");
}
```

---

## Step 3: The Brains — Custom Hook (`hooks/useAuth.ts`)

React hook managing authentication state and side effects.

### State Variables:

| Variable    | Type                  | Purpose                              |
|-------------|-----------------------|--------------------------------------|
| `user`      | `UserResponse | null` | Current authenticated user profile.  |
| `token`     | `string | null`       | JWT access token.                    |
| `isLoading` | `boolean`             | True during async operations.        |
| `error`     | `string | null`       | Error message for UI display.        |

### Flow — `login(email, password)`:

1. Set `isLoading = true`, `error = null`.
2. Call `loginRequest({ username: email, password })`.
3. **On success:** store `access_token` in memory state. Call `getMeRequest(token)` to fetch user profile. Set `user`. Redirect to `/dashboard`.
4. **On 401:** set `error = "Credenziali non valide"` (Italian).
5. **On 422:** set `error` from validation detail.
6. Set `isLoading = false`.

### Flow — `signup(data: UserCreate)`:

1. Set `isLoading = true`, `error = null`.
2. Call `signupRequest(data)`.
3. **On 201:** redirect to `/login` (user must log in after signup).
4. **On 422:** set `error` from validation detail.
5. Set `isLoading = false`.

### Flow — `logout()`:

1. Clear `token` and `user` from state.
2. Redirect to `/login`.

### JWT Storage Strategy:

> **Phase 1 (current):** Store JWT in React state (in-memory). Token lost on page refresh. Simple. Secure against XSS (no localStorage).
>
> **Phase 2 (future):** Migrate to `HttpOnly` cookie set by the backend. Requires backend changes (`Set-Cookie` response header). Survives page refresh. Best security against XSS.

---

## Step 4: The Muscle — Feature Components

### `features/auth/components/LoginForm.tsx`

- Renders: email input, password input, submit button, error alert, loading spinner.
- Imports `useAuth` hook.
- On submit: calls `login(email, password)`.
- Displays `error` from hook state.
- Shows spinner when `isLoading === true`.
- Disables button during loading.
- All labels in Italian (via i18n keys).

### `features/auth/components/SignupForm.tsx`

- Renders: email, first name, last name, password, confirm password inputs + submit button.
- Client-side validation: password match check, email format.
- On submit: calls `signup({ email, first_name, last_name, password })`.
- Field names match `UserCreate` schema exactly.

### Shared Components (`components/`)

- **`ProtectedRoute.tsx`** — Wrapper component. Checks if `user` exists in auth state. If not, redirects to `/login`. Wraps all dashboard/lesson/quiz pages.
- **`Navbar.tsx`** — Shows logo, navigation links. Conditionally shows "Accedi" (login) or user name + "Esci" (logout) based on auth state.
- **`Button.tsx`** — Reusable button. Accepts `isLoading` prop for spinner state.
- **`Input.tsx`** — Reusable form input. Accepts `label`, `type`, `error` props.

---

## Step 5: The Canvas — Next.js Pages (`app/`)

Next.js App Router uses folder-based routing. Each folder under `app/` becomes a URL route.

### Route Map:

| Route                    | File                              | Auth Required | Description                     |
|--------------------------|-----------------------------------|---------------|---------------------------------|
| `/`                      | `app/page.tsx`                    | No            | Landing page.                   |
| `/login`                 | `app/login/page.tsx`              | No            | Login form.                     |
| `/signup`                | `app/signup/page.tsx`             | No            | Registration form.              |
| `/dashboard`             | `app/dashboard/page.tsx`          | Yes           | User dashboard (home after login). |
| `/lessons`               | `app/lessons/page.tsx`            | Yes           | Lesson list.                    |
| `/lessons/[id]`          | `app/lessons/[id]/page.tsx`       | Yes           | Single lesson viewer.           |
| `/quizzes`               | `app/quizzes/page.tsx`            | Yes           | Quiz list.                      |
| `/quizzes/[id]`          | `app/quizzes/[id]/page.tsx`       | Yes           | Quiz runner.                    |

### Page Implementation Pattern:

```typescript
// app/login/page.tsx — minimal: import + render
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

Protected pages wrap content with `ProtectedRoute`:

```typescript
// app/dashboard/page.tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

---

## Internationalization (i18n)

### Design Decisions:

- **Default locale:** `it` (Italian). Primary and mandatory.
- **Future locales:** `en` (English). Structured for easy extension.
- **Strategy:** Client-side dictionary lookup. No URL-based locale routing (e.g. no `/it/login` vs `/en/login`) in Phase 1.
- **Library:** Lightweight custom solution OR `next-intl` (to be decided). No heavy frameworks for Phase 1.

### File Structure:

```
src/i18n/
├── config.ts           # Exports: defaultLocale, supportedLocales, getCurrentLocale()
└── locales/
    ├── it.json         # All Italian strings (primary)
    └── en.json         # All English strings (future)
```

### Locale File Format (it.json):

```json
{
  "common": {
    "loading": "Caricamento...",
    "error": "Si è verificato un errore.",
    "submit": "Invia",
    "cancel": "Annulla",
    "back": "Indietro",
    "logout": "Esci"
  },
  "auth": {
    "login_title": "Accedi",
    "signup_title": "Registrati",
    "email_label": "Email",
    "password_label": "Password",
    "first_name_label": "Nome",
    "last_name_label": "Cognome",
    "confirm_password_label": "Conferma password",
    "login_button": "Accedi",
    "signup_button": "Registrati",
    "invalid_credentials": "Credenziali non valide.",
    "signup_success": "Registrazione completata. Effettua il login.",
    "no_account": "Non hai un account?",
    "has_account": "Hai già un account?"
  },
  "nav": {
    "home": "Home",
    "lessons": "Lezioni",
    "quizzes": "Quiz",
    "dashboard": "Dashboard",
    "login": "Accedi",
    "pricing": "Prezzi"
  },
  "lessons": {
    "title": "Le tue lezioni",
    "video_lesson": "Video lezione",
    "text_lesson": "Lezione testuale",
    "start": "Inizia",
    "continue": "Continua"
  },
  "quizzes": {
    "title": "I tuoi quiz",
    "start_quiz": "Inizia quiz",
    "question": "Domanda",
    "of": "di",
    "next": "Avanti",
    "previous": "Indietro",
    "submit_quiz": "Invia quiz",
    "score": "Punteggio",
    "passed": "Superato!",
    "failed": "Non superato."
  }
}
```

### Usage Pattern:

```typescript
// In a component:
import { useTranslation } from "@/i18n/config";

function LoginForm() {
  const t = useTranslation();
  return <h1>{t("auth.login_title")}</h1>; // renders "Accedi"
}
```

### `<html lang>` Tag:

The root layout (`app/layout.tsx`) MUST set `<html lang="it">` for SEO and accessibility.
Current value is `"en"`. Must be changed to `"it"`.

---

## Planned Features (Skeleton — Backend Contracts Pending)

These features have empty directories ready. Implementation is **blocked** until backend API specs exist.

### Lessons (`features/lessons/`)

**Expected functionality:**
- List lessons (text + video types).
- View single lesson content.
- Track progress (completed/in-progress).
- Filter by category/topic.

**Blocked on:** `GET /api/v1/lessons`, `GET /api/v1/lessons/{id}` endpoint specs.

**Expected types (draft — NOT final, subject to backend schema):**

```typescript
// DRAFT — awaiting backend contract
export interface Lesson {
  id: string;
  title: string;
  type: "text" | "video";
  content_url?: string;     // Video URL or text content
  category: string;
  duration_minutes?: number;
  order: number;
}
```

### Quizzes (`features/quizzes/`)

**Expected functionality:**
- List available quizzes.
- Run quiz (sequential questions, multiple-choice answers).
- Submit answers and receive score.
- View past results.

**Blocked on:** `GET /api/v1/quizzes`, `GET /api/v1/quizzes/{id}`, `POST /api/v1/quizzes/{id}/submit` endpoint specs.

**Expected types (draft — NOT final, subject to backend schema):**

```typescript
// DRAFT — awaiting backend contract
export interface Quiz {
  id: string;
  title: string;
  question_count: number;
  category: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  // correct_answer NOT sent to frontend (server-side grading)
}

export interface QuizSubmission {
  quiz_id: string;
  answers: Record<string, string>;  // question_id → selected option
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
}
```

### Payments (`features/payments/`)

**Expected functionality:**
- Display pricing table (free vs. premium tiers).
- Redirect to Stripe checkout.
- Show success/cancel pages.

**Blocked on:** `POST /api/v1/payments/checkout` endpoint spec.
Webhook handled server-side only. Frontend only redirects + shows result.

---

## Security Rules (Frontend)

These rules are mandatory. Violations are bugs.

1. **No secrets in client bundles.** Only `NEXT_PUBLIC_*` env vars are accessible. Never expose `SECRET_KEY`, database URLs, or Stripe secret keys.
2. **JWT storage.** Phase 1: in-memory React state only. Never `localStorage` or `sessionStorage` (XSS risk). Phase 2: `HttpOnly` cookie from backend.
3. **Authorization is server-side.** Frontend hides/shows UI elements based on `role` and `plan_tier`, but the backend enforces access. A hidden button is not security.
4. **Input validation is UX, not security.** Client-side validation improves user experience. Server-side validation (Pydantic) enforces correctness.
5. **No raw user HTML rendering.** Never use `dangerouslySetInnerHTML` with user-supplied content. XSS vector.
6. **HTTPS in production.** All API calls use HTTPS. `NEXT_PUBLIC_API_BASE_URL` must be `https://` in production.
7. **CORS.** Backend must whitelist the frontend origin. Frontend does not control CORS.

---

## Blocker Protocol

If a backend endpoint spec is missing for a frontend feature:

1. **STOP.** Do not invent endpoints or mock data.
2. **Document** the missing contract in the feature's `README.md`.
3. **Flag** the blocker to the backend developer.
4. **Wait** for the OpenAPI spec update.

Source of truth for existing specs: `agent_tools/coding_tools/openapi.json`.

---

## Implementation Priority

| Phase | Task                                                    | Status       |
|-------|---------------------------------------------------------|--------------|
| 1     | Types (`types/auth.types.ts`)                           | To do        |
| 2     | API client (`api/auth.api.ts`)                          | To do        |
| 3     | Auth hook (`hooks/useAuth.ts`)                          | To do        |
| 4     | Auth components (`features/auth/components/`)           | To do        |
| 5     | Auth pages (`app/login/`, `app/signup/`)                | To do        |
| 6     | Protected route + Navbar                                | To do        |
| 7     | Dashboard page                                          | To do        |
| 8     | i18n module (`i18n/`)                                   | To do        |
| 9     | Lessons feature (blocked — awaiting backend spec)       | Blocked      |
| 10    | Quizzes feature (blocked — awaiting backend spec)       | Blocked      |
| 11    | Payments feature (blocked — awaiting backend spec)      | Blocked      |
| 12    | Root layout update (`lang="it"`, i18n provider, fonts)  | To do        |

---

## Commands

```bash
# Start dev server
cd frontend
npm run dev
# → http://localhost:3000

# Lint
npm run lint

# Build (production check)
npm run build
```

Backend must be running at `http://localhost:8000` for API calls to work.
Start backend:

```bash
cd backend
.venv/scripts/activate
uvicorn app.main:app --reload
```
