"use client";

/**
 * hooks/useAuth.ts
 *
 * Custom React hook that exposes the shared authentication state.
 *
 * ARCHITECTURAL NOTE — WHY THIS IS NOW A RE-EXPORT:
 *   Previously, this file contained its own useState logic.
 *   The problem: each component that called `useAuth()` got its own isolated
 *   state. LoginForm setting the token was invisible to ProtectedRoute.
 *
 *   Solution: state was lifted into AuthContext (src/contexts/AuthContext.tsx).
 *   This file re-exports the hook and types from that context so that
 *   all existing import paths (`@/hooks/useAuth`) remain unchanged.
 *
 * USAGE:
 *   import { useAuth } from "@/hooks/useAuth";
 *   const { user, login, logout, isLoading, error } = useAuth();
 *
 * REQUIREMENT:
 *   The component tree must be wrapped by <AuthProvider> in app/layout.tsx.
 */

// Re-export the hook and all public types.
// Components import from here; they never import from AuthContext directly.
export { useAuth } from "@/contexts/AuthContext";
export type { AuthState, UseAuthReturn } from "@/contexts/AuthContext";
