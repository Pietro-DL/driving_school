"use client";

/**
 * hooks/useAuth.ts
 *
 * Custom React hook that manages the full authentication lifecycle:
 *   - Login (email + password → JWT → user profile)
 *   - Signup (registration → redirect to login)
 *   - Logout (clear state → redirect to /login)
 *   - Session restore on mount (getMeRequest with stored token)
 *
 * JWT STORAGE STRATEGY — Phase 1:
 *   The access_token is stored in React component state (in-memory only).
 *   It is NOT persisted to localStorage or sessionStorage.
 *   This is intentional: in-memory storage is immune to XSS attacks.
 *   Trade-off: the token is lost on page refresh (user must log in again).
 *
 * Phase 2 migration path (future):
 *   Replace in-memory state with an HttpOnly cookie set by the backend.
 *   That requires a backend change (Set-Cookie response header on login).
 *   When that is done, this hook can call getMeRequest() on mount to restore session.
 *
 * Rules:
 *   - No fetch() calls. All HTTP is delegated to @/api/auth.api.
 *   - No UI rendering. State and logic only.
 *   - Error messages are Italian (primary locale per i18n spec).
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginRequest, signupRequest, getMeRequest, ApiError } from "@/api/auth.api";
import type { UserResponse, UserCreate } from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Hook State Shape
// ---------------------------------------------------------------------------

export interface AuthState {
  /** Authenticated user profile. Null if not logged in. */
  user: UserResponse | null;
  /** JWT access token held in memory. Null if not logged in. */
  token: string | null;
  /** True while any async auth operation is in flight. */
  isLoading: boolean;
  /** Italian-language error message for the UI. Null when no error. */
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: UserCreate) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Error → Italian message mapping
// ---------------------------------------------------------------------------

/**
 * Translates an ApiError into an Italian user-facing string.
 * Uses HTTP status codes as the primary discriminator.
 */
function toItalianErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return "Credenziali non valide. Controlla email e password.";
      case 403:
        return "Accesso negato. Non hai i permessi necessari.";
      case 409:
        return "Questo indirizzo email è già registrato.";
      case 422:
        // 422 carries Pydantic field errors — extract first message.
        if (err.detail && err.detail.length > 0) {
          return `Errore di validazione: ${err.detail[0].msg}`;
        }
        return "I dati inseriti non sono validi. Controlla il modulo.";
      case 500:
        return "Errore del server. Riprova tra qualche minuto.";
      default:
        return `Si è verificato un errore (codice ${err.status}). Riprova.`;
    }
  }
  // Network error or unexpected throw (no HTTP response received).
  return "Impossibile raggiungere il server. Controlla la connessione.";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const router = useRouter();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  /**
   * Authenticates the user.
   *
   * Flow:
   *  1. Set isLoading = true, error = null.
   *  2. POST /api/v1/auth/login (form-data) → receive Token.
   *  3. GET  /api/v1/users/me  (Bearer)    → receive UserResponse.
   *  4. Store token + user in state.
   *  5. Redirect to /dashboard.
   *
   * On failure: set Italian error message, clear loading flag.
   *
   * @param email    - The user's email address (sent as OAuth2 "username" field).
   * @param password - The user's plaintext password.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Exchange credentials for a JWT.
        // The "username" field name is mandated by OAuth2; the value is the email.
        const tokenResponse = await loginRequest({
          username: email,
          password,
        });

        const accessToken = tokenResponse.access_token;

        // Step 2: Fetch the authenticated user's profile.
        const userProfile = await getMeRequest(accessToken);

        // Step 3: Persist in memory state.
        setToken(accessToken);
        setUser(userProfile);

        // Step 4: Navigate to the protected dashboard.
        router.push("/dashboard");
      } catch (err) {
        setError(toItalianErrorMessage(err));
        // Ensure token/user are clean on failure.
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // -------------------------------------------------------------------------
  // signup
  // -------------------------------------------------------------------------

  /**
   * Registers a new user.
   *
   * Flow:
   *  1. Set isLoading = true, error = null.
   *  2. POST /api/v1/auth/signup (JSON) → receive UserResponse (201).
   *  3. Redirect to /login (user must log in after registration).
   *
   * On failure: set Italian error message, clear loading flag.
   *
   * @param data - UserCreate payload: { email, first_name, last_name, password }
   */
  const signup = useCallback(
    async (data: UserCreate): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Backend returns the created user profile on 201.
        // We discard it: the user is redirected to login, not auto-logged-in.
        await signupRequest(data);

        // Redirect to login. A success message can be shown there via query param.
        router.push("/login?registered=true");
      } catch (err) {
        setError(toItalianErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  /**
   * Clears all authentication state and redirects to /login.
   * Synchronous — no network call needed (server-side JWT invalidation
   * is a future concern; for now, dropping the token is sufficient).
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    router.push("/login");
  }, [router]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    user,
    token,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
