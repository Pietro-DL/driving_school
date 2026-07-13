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
 * Backend base URL is read from the NEXT_PUBLIC_API_BASE_URL environment variable.
 * Set this in frontend/.env.local for local development:
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 */

import type {
  LoginCredentials,
  Token,
  UserCreate,
  UserResponse,
  ApiErrorShape,
  HTTPValidationError,
} from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  // Fail loudly at module load time so misconfiguration is caught immediately.
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

/**
 * Parses a non-2xx Response into a typed ApiError.
 * Attempts JSON parse; falls back to status text on failure.
 */
async function parseErrorResponse(res: Response): Promise<ApiError> {
  let message = `HTTP ${res.status}: ${res.statusText}`;
  let detail: HTTPValidationError["detail"] | undefined;

  try {
    const body: HTTPValidationError & { detail?: string | HTTPValidationError["detail"] } =
      await res.json();

    if (typeof body.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body.detail)) {
      // 422 Pydantic validation error — extract human-readable message from first error.
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
 *
 * @param data - UserCreate payload (email, first_name, last_name, password)
 * @returns    - UserResponse on 201 Created
 * @throws     - ApiError on 422 (validation) or other non-2xx
 */
export async function signupRequest(data: UserCreate): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.json() as Promise<UserResponse>;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/v1/auth/login
// ---------------------------------------------------------------------------

/**
 * Authenticates a user and returns a JWT access token.
 *
 * CRITICAL: This endpoint uses OAuth2 Password Bearer and expects
 * `application/x-www-form-urlencoded`, NOT application/json.
 * The email address MUST be sent as the `username` field per OAuth2 spec.
 *
 * @param credentials - { username: email, password }
 * @returns           - Token on 200 OK  { access_token, token_type }
 * @throws            - ApiError(401) on wrong credentials
 * @throws            - ApiError(422) on malformed payload
 */
export async function loginRequest(credentials: LoginCredentials): Promise<Token> {
  // URLSearchParams serializes to application/x-www-form-urlencoded automatically.
  const body = new URLSearchParams({
    username: credentials.username, // Maps to the user's email address.
    password: credentials.password,
    grant_type: "password",         // Required by OAuth2 Password flow.
  });

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      // Explicitly set. URLSearchParams body does NOT auto-set this in all environments.
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.json() as Promise<Token>;
}

// ---------------------------------------------------------------------------
// Endpoint: GET /api/v1/users/me
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's profile.
 * Requires a valid JWT access token passed as a Bearer token.
 *
 * @param accessToken - JWT string obtained from loginRequest()
 * @returns           - UserResponse on 200 OK
 * @throws            - ApiError(401) if token is missing, expired, or invalid
 */
export async function getMeRequest(accessToken: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.json() as Promise<UserResponse>;
}
