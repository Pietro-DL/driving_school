/**
 * app/verify-pending/page.tsx
 *
 * Email verification page. Reached after signup or when a logged-in user
 * has is_verified=false (intercepted by ProtectedRoute).
 *
 * This is a Server Component wrapper. VerifyForm is a Client Component
 * that handles all interactivity.
 *
 * The user's email is passed via searchParams (?email=...) set during signup.
 * If email is missing, the user is redirected to /signup.
 */

import { redirect } from "next/navigation";
import { VerifyForm } from "@/features/auth/components/VerifyForm";

interface VerifyPendingPageProps {
  searchParams: Promise<{ email?: string }>;
}

export const metadata = {
  title: "Verifica Email — Scuola Guida",
  description: "Inserisci il codice di verifica ricevuto via email per attivare il tuo account.",
};

export default async function VerifyPendingPage({ searchParams }: VerifyPendingPageProps) {
  const params = await searchParams;
  const email = params.email;

  // Guard: if email is missing, we can't show the form
  if (!email) {
    redirect("/signup");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-indigo-50 dark:from-zinc-950 dark:to-indigo-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-100 dark:border-zinc-800">
        <VerifyForm email={email} />
      </div>
    </main>
  );
}
