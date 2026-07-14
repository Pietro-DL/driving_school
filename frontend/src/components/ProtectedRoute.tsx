"use client";

/**
 * components/ProtectedRoute.tsx
 *
 * Wrapper component that guards routes requiring authentication AND verification.
 *
 * Behaviour (3-tier guard):
 *  - isLoading = true         → show spinner (auth state not settled)
 *  - user = null              → redirect to /login (not authenticated)
 *  - user.is_verified = false → redirect to /verify-pending (not verified)
 *  - user exists + verified   → render children
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 */

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Full-screen loading spinner
// ---------------------------------------------------------------------------
function FullPageSpinner() {
  return (
    <div
      role="status"
      aria-label="Caricamento in corso"
      className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="h-10 w-10 animate-spin text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Caricamento…
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------
interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect until auth state has settled

    if (!user) {
      // Not authenticated at all
      router.replace("/login");
      return;
    }

    if (!user.is_verified) {
      // Authenticated but email not verified — bounce to OTP page
      router.replace("/verify-pending");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <FullPageSpinner />;

  // Not authenticated or not verified: return null while redirect fires
  if (!user || !user.is_verified) return null;

  // Fully authenticated and verified: render the protected content
  return <>{children}</>;
}
