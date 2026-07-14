"use client";

/**
 * hooks/useAuth.ts
 *
 * Custom React hook that exposes the shared authentication state.
 * Re-exports the hook and all public types from AuthContext.
 *
 * PHASE 2 ADDITIONS:
 *   - verify and resendCode actions exported for /verify-pending page.
 */

export { useAuth } from "@/contexts/AuthContext";
export type { AuthState, UseAuthReturn } from "@/contexts/AuthContext";
