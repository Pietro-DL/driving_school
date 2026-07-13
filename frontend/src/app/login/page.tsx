/**
 * app/login/page.tsx
 *
 * Route: /login  (automatically registered by Next.js App Router)
 *
 * Server Component (no "use client" directive needed).
 * Renders the LoginForm centered on a full-height screen.
 * All interactivity lives inside LoginForm, which is a Client Component.
 */

import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

// SEO metadata — required per frontend_skill.md
export const metadata: Metadata = {
  title: "Accedi — Scuola Guida",
  description:
    "Accedi al tuo account della scuola guida per accedere alle lezioni e ai quiz.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <LoginForm />
    </main>
  );
}
