/**
 * api/auth.api.ts
 *
 * HTTP client functions for all authentication-related backend endpoints.
 * This file is the ONLY place in the frontend that constructs raw fetch() calls
 * for the /api/v1/auth/* and /api/v1/users/* routes.
 *
 * Rules:
 *  - No state management (no useState, no context).
 *  - No UI logic (no redirects, no toast messages).
 *  - Throw ApiError on any non-2xx response. Callers handle the error.
 *  - All types imported from @/types/auth.types.
 *
 * PHASE 2 CHANGES:
 *  - All fetch() calls include `credentials: "include"` so the browser
 *    automatically sends the HttpOnly auth cookie on every request.
 *  - loginRequest() no longer returns { access_token }. JWT is in Set-Cookie.
 *  - getMeRequest() no longer accepts an accessToken parameter.
 *  - 3 new functions: verifyCodeRequest, resendCodeRequest, logoutRequest.
 *
 * Backend base URL is read from the NEXT_PUBLIC_API_BASE_URL environment variable.
 * Set this in frontend/.env.local for local development:
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 */

import type {
  LoginCredentials,
  MessageResponse,
  ResendCodeRequest,
  UserCreate,
  UserResponse,
  VerifyCodeRequest,
  ApiErrorShape,
  HTTPValidationError,
} from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  throw new Error(
    "[auth.api] NEXT_PUBLIC_API_BASE_URL is not set. " +
      "Add it to frontend/.env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000"
  );
}

// ---------------------------------------------------------------------------
// Typed Error Class
// ---------------------------------------------------------------------------

/**
 * Thrown by all API functions on non-2xx HTTP responses.
 * Callers (hooks) catch this to update UI state.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly detail?: HTTPValidationError["detail"];

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.detail = shape.detail;
  }
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let message = `HTTP ${res.status}: ${res.statusText}`;
  let detail: HTTPValidationError["detail"] | undefined;

  try {
    const body: HTTPValidationError & { detail?: string | HTTPValidationError["detail"] } =
      await res.json();

    if (typeof body.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body.detail)) {
      detail = body.detail;
      message = body.detail.map((e) => `${e.loc.join(".")}: ${e.msg}`).join("; ");
    }
  } catch {
    // Body was not JSON — keep the default message.
  }

  return new ApiError({ status: res.status, message, detail });
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/signup
// ---------------------------------------------------------------------------

/**
 * Registers a new user account.
 * Response includes is_verified: false — frontend should redirect to /verify-pending.
 */
export async function signupRequest(data: UserCreate): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    credentials: "include",   // Sends/receives cookies cross-origin
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<UserResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/login
// ---------------------------------------------------------------------------

/**
 * Authenticates a user.
 * JWT is set in an HttpOnly cookie by the server (Set-Cookie header).
 * The response body contains only { message } — NOT a token.
 *
 * After login, call getMeRequest() to hydrate user state.
 */
export async function loginRequest(credentials: LoginCredentials): Promise<MessageResponse> {
  const body = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
    grant_type: "password",
  });

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",   // Browser stores the Set-Cookie from the response
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<MessageResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: GET /api/v1/users/me
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's profile.
 * NO accessToken parameter — the browser sends the HttpOnly cookie automatically.
 * credentials: "include" is required for the cookie to be attached cross-origin.
 */
export async function getMeRequest(): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<UserResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/verify
// ---------------------------------------------------------------------------

/**
 * Submits the 6-digit OTP to verify the user's email address.
 * On success, the backend marks the user as verified (is_verified=true).
 *
 * @param data - { email, code }
 * @throws ApiError(400) on wrong/expired code
 * @throws ApiError(429) on brute-force lockout (5 failed attempts)
 */
export async function verifyCodeRequest(data: VerifyCodeRequest): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<MessageResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/resend-code
// ---------------------------------------------------------------------------

/**
 * Requests a fresh 6-digit OTP email.
 * Rate-limited server-side to 1 request per minute per IP.
 * Frontend should also enforce a 60-second cooldown on the button.
 *
 * @param data - { email }
 * @throws ApiError(429) if called more than once per minute
 */
export async function resendCodeRequest(data: ResendCodeRequest): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/resend-code`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<MessageResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/logout
// ---------------------------------------------------------------------------

/**
 * Clears the HttpOnly auth cookie server-side.
 * HttpOnly cookies cannot be deleted by JavaScript — this endpoint is required.
 * After calling this, getMeRequest() will return 401.
 */
export async function logoutRequest(): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return res.json() as Promise<MessageResponse>;
}
