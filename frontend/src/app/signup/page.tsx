/**
 * app/signup/page.tsx
 *
 * Route: /signup  (automatically registered by Next.js App Router)
 *
 * Server Component (no "use client" directive needed).
 * Renders the SignupForm centered on a full-height screen.
 * All interactivity lives inside SignupForm, which is a Client Component.
 */

import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

// SEO metadata — required per frontend_skill.md
export const metadata: Metadata = {
  title: "Registrati — Scuola Guida",
  description:
    "Crea un account per accedere alle lezioni, ai quiz e ai materiali della scuola guida.",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <SignupForm />
    </main>
  );
}
