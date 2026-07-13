/**
 * types/auth.types.ts
 *
 * Single source of truth for all authentication-related TypeScript types.
 * Every interface here is a strict mirror of the corresponding Pydantic schema
 * in the backend. Field names use snake_case to match backend JSON exactly.
 *
 * Source: agent_tools/coding_tools/openapi.json (components/schemas/*)
 * Do NOT add, rename, or remove fields without a matching backend change.
 */

// ---------------------------------------------------------------------------
// REQUEST PAYLOADS (data flowing FROM frontend TO backend)
// ---------------------------------------------------------------------------

/**
 * Mirrors: components/schemas/UserCreate
 * Endpoint: POST /api/v1/auth/signup
 * Content-Type: application/json
 */
export interface UserCreate {
  email: string;       // format: email
  first_name: string;
  last_name: string;
  password: string;
}

/**
 * Mirrors: components/schemas/Body_login_api_v1_auth_login_post
 * Endpoint: POST /api/v1/auth/login
 * Content-Type: application/x-www-form-urlencoded (NOT application/json)
 *
 * IMPORTANT: The `username` field carries the user's email address.
 * This is mandated by the OAuth2 Password Bearer spec that FastAPI implements.
 * The UI label can say "Email", but the field name sent over the wire MUST be "username".
 * NOTE: In practice, username === email for this application.
 */
export interface LoginCredentials {
  username: string; // This IS the user's email. OAuth2 spec requires the field name "username".
  password: string;
}

// ---------------------------------------------------------------------------
// RESPONSE PAYLOADS (data flowing FROM backend TO frontend)
// ---------------------------------------------------------------------------

/**
 * Mirrors: components/schemas/Token
 * Returned by: POST /api/v1/auth/login (200 OK)
 */
export interface Token {
  access_token: string;
  token_type: string; // Always "bearer"
}

/**
 * Mirrors: components/schemas/UserResponse
 * Returned by:
 *   - POST /api/v1/auth/signup (201 Created)
 *   - GET  /api/v1/users/me   (200 OK)
 */
export interface UserResponse {
  email: string;       // format: email
  first_name: string;
  last_name: string;
  id: string;          // format: uuid
  role: string;        // e.g. "student", "admin" — enum values defined by backend
  plan_tier: string;   // e.g. "free", "premium" — enum values defined by backend
  is_active: boolean;
  created_at: string;  // format: date-time (ISO 8601)
}

// ---------------------------------------------------------------------------
// ERROR SHAPES (data flowing FROM backend on non-2xx responses)
// ---------------------------------------------------------------------------

/**
 * Mirrors: components/schemas/ValidationError
 * Represents a single field-level validation error from Pydantic.
 */
export interface ValidationError {
  loc: (string | number)[]; // Path to the invalid field, e.g. ["body", "email"]
  msg: string;              // Human-readable error message
  type: string;             // Pydantic error type, e.g. "value_error.missing"
  input?: unknown;          // The invalid value that was received
  ctx?: Record<string, unknown>; // Additional context from Pydantic validator
}

/**
 * Mirrors: components/schemas/HTTPValidationError
 * Returned by FastAPI on 422 Unprocessable Entity (schema validation failure).
 */
export interface HTTPValidationError {
  detail?: ValidationError[];
}

/**
 * Generic API error for non-422 failures (401, 403, 404, 500, etc.).
 * Constructed by the API client's error parser; not a backend schema.
 */
export interface ApiErrorShape {
  status: number;
  message: string;
  detail?: ValidationError[]; // Present if the backend returned 422 details
}
