"use client";

/**
 * contexts/AuthContext.tsx
 *
 * React Context that holds the single, application-wide authentication state.
 *
 * WHY THIS FILE EXISTS:
 *   React hooks (useState) are local to the component that calls them.
 *   If LoginForm and ProtectedRoute each called `useAuth()` that contained
 *   its own useState, they would have completely isolated state — the token
 *   set by LoginForm would be invisible to ProtectedRoute.
 *
 *   The solution: lift the state up into a React Context Provider that wraps
 *   the entire app. Every component that calls `useAuth()` then reads from
 *   the same shared state instance.
 *
 * USAGE:
 *   - Wrap the app in <AuthProvider> inside app/layout.tsx.
 *   - Consume via the `useAuth` hook from @/hooks/useAuth.ts (thin wrapper).
 *   - Never import AuthContext or AuthProvider directly in components.
 *     Always go through `useAuth`.
 *
 * JWT STORAGE — Phase 1:
 *   Token lives in React state (in-memory). Lost on page refresh.
 *   Phase 2: migrate to HttpOnly cookie (requires backend Set-Cookie header).
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
  ApiError,
} from "@/api/auth.api";
import type { UserResponse, UserCreate } from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Public types (re-exported so hooks/useAuth.ts and consumers can import them)
// ---------------------------------------------------------------------------

export interface AuthState {
  /** Authenticated user profile. Null = not logged in. */
  user: UserResponse | null;
  /** JWT access token in memory. Null = not logged in. */
  token: string | null;
  /** True while any async auth operation is in flight. */
  isLoading: boolean;
  /** Italian-language error message for the UI. Null = no error. */
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: UserCreate) => Promise<void>;
  logout: () => void;
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
      case 401:
        return "Credenziali non valide. Controlla email e password.";
      case 403:
        return "Accesso negato. Non hai i permessi necessari.";
      case 409:
        return "Questo indirizzo email è già registrato.";
      case 422:
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
  return "Impossibile raggiungere il server. Controlla la connessione.";
}

// ---------------------------------------------------------------------------
// Provider — holds the single shared auth state for the whole app
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Authenticates the user.
   * Flow: loginRequest → getMeRequest → setUser/setToken → push(/dashboard)
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const tokenResponse = await loginRequest({ username: email, password });
        const accessToken = tokenResponse.access_token;
        const userProfile = await getMeRequest(accessToken);
        setToken(accessToken);
        setUser(userProfile);
        router.push("/dashboard");
      } catch (err) {
        setError(toItalianErrorMessage(err));
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Registers a new user.
   * Flow: signupRequest → push(/login?registered=true)
   * User is NOT auto-logged-in after signup.
   */
  const signup = useCallback(
    async (data: UserCreate): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await signupRequest(data);
        router.push("/login?registered=true");
      } catch (err) {
        setError(toItalianErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Clears auth state and redirects to /login.
   * Synchronous — no network call (JWT invalidation is server-side future work).
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    router.push("/login");
  }, [router]);

  const value: UseAuthReturn = {
    user,
    token,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook — the only way components should access auth state
// ---------------------------------------------------------------------------

/**
 * Returns the shared auth state and actions.
 * Must be used inside a component tree wrapped by <AuthProvider>.
 * Throws if called outside the provider (dev-time safety net).
 */
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
