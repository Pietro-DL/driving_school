/**
 * app/dashboard/page.tsx
 *
 * Route: /dashboard  (automatically registered by Next.js App Router)
 *
 * Server Component. Renders the Dashboard inside ProtectedRoute.
 * ProtectedRoute handles the auth guard (redirect to /login if user is null).
 * Dashboard handles the UI.
 *
 * No business logic here — this page is intentionally thin per the spec.
 */

import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Scuola Guida",
  description: "Il tuo pannello personale: lezioni, quiz e progressi.",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
