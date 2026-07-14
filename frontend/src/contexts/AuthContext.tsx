"use client";

/**
 * contexts/AuthContext.tsx
 *
 * React Context that holds the single, application-wide authentication state.
 *
 * PHASE 2 CHANGES:
 *  - `token` field removed from state. JWT lives in an HttpOnly cookie
 *    managed by the browser. JavaScript has no access to it.
 *  - login() flow: loginRequest() → getMeRequest() → check is_verified
 *    → redirect to /dashboard or /verify-pending
 *  - logout() is now async: calls logoutRequest() to clear the server cookie.
 *  - New actions: verify() and resendCode() for the OTP flow.
 *  - All fetch calls use credentials:'include' (handled in auth.api.ts).
 *
 * JWT STORAGE — Phase 2:
 *   Token lives in an HttpOnly cookie set by the backend /login endpoint.
 *   Browser sends it automatically on every request. XSS cannot steal it.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loginRequest,
  signupRequest,
  getMeRequest,
  verifyCodeRequest,
  resendCodeRequest,
  logoutRequest,
  ApiError,
} from "@/api/auth.api";
import type {
  UserResponse,
  UserCreate,
  VerifyCodeRequest,
  ResendCodeRequest,
} from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AuthState {
  /** Authenticated user profile. Null = not logged in. */
  user: UserResponse | null;
  /** True while any async auth operation is in flight. */
  isLoading: boolean;
  /** Italian-language error message for the UI. Null = no error. */
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
  verify: (data: VerifyCodeRequest) => Promise<void>;
  resendCode: (data: ResendCodeRequest) => Promise<void>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<UseAuthReturn | null>(null);

// ---------------------------------------------------------------------------
// Error → Italian message mapping
// ---------------------------------------------------------------------------

function toItalianErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return err.message || "Richiesta non valida. Controlla i dati inseriti.";
      case 401:
        return "Credenziali non valide. Controlla email e password.";
      case 403:
        if (err.message.toLowerCase().includes("verified")) {
          return "Email non verificata. Controlla la tua casella di posta.";
        }
        return "Accesso negato. Non hai i permessi necessari.";
      case 404:
        return "Nessun account trovato con questo indirizzo email.";
      case 409:
        return "Questo indirizzo email è già registrato.";
      case 422:
        if (err.detail && err.detail.length > 0) {
          return `Errore di validazione: ${err.detail[0].msg}`;
        }
        return "I dati inseriti non sono validi. Controlla il modulo.";
      case 429:
        return "Troppi tentativi. Attendi un minuto e riprova.";
      case 500:
        return "Errore del server. Riprova tra qualche minuto.";
      default:
        return `Si è verificato un errore (codice ${err.status}). Riprova.`;
    }
  }
  return "Impossibile raggiungere il server. Controlla la connessione.";
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Login flow:
   *  1. POST /auth/login  → sets HttpOnly cookie (no token in body)
   *  2. GET  /users/me    → hydrates user state from the new cookie
   *  3. Check is_verified → route to /dashboard or /verify-pending
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await loginRequest({ username: email, password });
        const userProfile = await getMeRequest();
        setUser(userProfile);

        if (!userProfile.is_verified) {
          router.push(`/verify-pending?email=${encodeURIComponent(email)}`);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        setError(toItalianErrorMessage(err));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Signup flow:
   *  POST /auth/signup → redirect to /verify-pending
   *  User is NOT auto-logged-in. They must verify email first.
   */
  const signup = useCallback(
    async (data: UserCreate): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await signupRequest(data);
        // Pass email in URL so /verify-pending can display it and call resend-code
        router.push(`/verify-pending?email=${encodeURIComponent(data.email)}`);
      } catch (err) {
        setError(toItalianErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Logout flow:
   *  POST /auth/logout → server clears the HttpOnly cookie
   *  Client clears user state and navigates to /login.
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutRequest();
    } catch {
      // Even if the request fails, clear local state and redirect.
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
      router.push("/login");
    }
  }, [router]);

  /**
   * OTP verify flow:
   *  POST /auth/verify → on success, refresh user state (is_verified now true)
   *  → redirect to /dashboard
   */
  const verify = useCallback(
    async (data: VerifyCodeRequest): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await verifyCodeRequest(data);
        // Refresh user profile — is_verified is now true server-side
        const updatedUser = await getMeRequest();
        setUser(updatedUser);
        router.push("/dashboard");
      } catch (err) {
        setError(toItalianErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Resend OTP flow:
   *  POST /auth/resend-code → server generates new code + sends email
   *  UI handles the 60-second cooldown on the button.
   */
  const resendCode = useCallback(
    async (data: ResendCodeRequest): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await resendCodeRequest(data);
      } catch (err) {
        setError(toItalianErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const value: UseAuthReturn = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    verify,
    resendCode,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "[useAuth] Must be called inside <AuthProvider>. " +
        "Ensure app/layout.tsx wraps the app with <AuthProvider>."
    );
  }
  return ctx;
}
