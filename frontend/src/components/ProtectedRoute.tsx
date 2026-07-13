"use client";

/**
 * components/ProtectedRoute.tsx
 *
 * Wrapper component that guards routes requiring authentication.
 *
 * Behaviour:
 *  - isLoading = true  → show a full-screen spinner (auth state not settled yet)
 *  - user = null       → redirect to /login (not authenticated)
 *  - user exists       → render children (authenticated)
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 * IMPORTANT: This is a client component. Wrap it server-side in page.tsx
 * which itself has no "use client" directive.
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
    // Only redirect once the loading state has settled.
    // isLoading guards against flashing a redirect on the initial render.
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // While loading: show spinner (e.g. during login async operation).
  if (isLoading) return <FullPageSpinner />;

  // Not authenticated and not loading: return null while the redirect fires.
  // Avoids a flash of the protected content before the router.replace completes.
  if (!user) return null;

  // Authenticated: render children.
  return <>{children}</>;
}
