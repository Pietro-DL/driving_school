"use client";

/**
 * features/dashboard/components/Dashboard.tsx
 *
 * Main dashboard view shown after login.
 * Reads the authenticated user from useAuth (shared AuthContext state).
 *
 * Widget grid:
 *  1. Hero section     — personalised greeting with user.first_name
 *  2. Resume Learning  — placeholder for last-viewed lesson (blocked: lessons API)
 *  3. Quiz Snapshot    — placeholder for recent quiz scores (blocked: quizzes API)
 *  4. Upsell Card      — shown only if user.plan_tier === "free"
 *
 * All widgets are placeholders except the hero and upsell (which use live user data).
 * Lesson/quiz data requires backend endpoints not yet specified.
 */

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Shared card shell
// ---------------------------------------------------------------------------
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget: Resume Learning (placeholder — lessons API not yet available)
// ---------------------------------------------------------------------------
function ResumeLearningCard() {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Riprendi l&apos;apprendimento
        </h2>
      </div>

      {/* Placeholder progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Segnaletica stradale — Lezione 4
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">60%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          role="progressbar"
          aria-valuenow={60}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso lezione"
        >
          <div
            className="h-full w-[60%] rounded-full bg-blue-500 transition-all"
          />
        </div>
      </div>

      <Link
        href="/lessons"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Continua
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </Link>

      <p className="text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        ⚠ Dati segnaposto — In attesa delle API lezioni
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Widget: Quiz Snapshot (placeholder — quizzes API not yet available)
// ---------------------------------------------------------------------------
function QuizSnapshotCard() {
  const mockScores = [
    { label: "Precedenze", score: 18, total: 20, passed: true },
    { label: "Segnali stradali", score: 14, total: 20, passed: false },
    { label: "Norme di comportamento", score: 19, total: 20, passed: true },
  ];

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
          <svg
            className="h-5 w-5 text-violet-600 dark:text-violet-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz recenti
        </h2>
      </div>

      <ul className="flex flex-col gap-2" role="list">
        {mockScores.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
          >
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {s.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {s.score}/{s.total}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.passed
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}
              >
                {s.passed ? "Superato" : "Non sup."}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/quizzes"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
      >
        Vai ai quiz
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </Link>

      <p className="text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        ⚠ Dati segnaposto — In attesa delle API quiz
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Widget: Upsell — only rendered when plan_tier === "free"
// ---------------------------------------------------------------------------
function UpsellCard() {
  return (
    <Card className="relative overflow-hidden p-6">
      {/* Decorative gradient blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-400/20 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <svg
              className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Passa a Premium
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Piano gratuito attivo
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          {[
            "Accesso illimitato a tutte le lezioni video",
            "Quiz illimitati con spiegazioni dettagliate",
            "Simulazioni d'esame complete",
            "Supporto prioritario",
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        <Link
          id="dashboard-upsell-cta"
          href="/pricing"
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          Scopri Premium
        </Link>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — main export
// ---------------------------------------------------------------------------
export function Dashboard() {
  const { user } = useAuth();

  // ProtectedRoute guarantees user is non-null when this renders.
  // The non-null assertion is safe here.
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Hero section */}
      <section className="mb-10" aria-labelledby="dashboard-greeting">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white shadow-lg">
          <p className="mb-1 text-sm font-medium text-indigo-200">
            Dashboard
          </p>
          <h1
            id="dashboard-greeting"
            className="text-3xl font-bold tracking-tight"
          >
            Benvenuto, {user.first_name}!
          </h1>
          <p className="mt-2 text-indigo-100">
            Continua a studiare per prepararti al meglio all&apos;esame.
          </p>

          {/* Quick stats strip */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-medium text-indigo-300">Piano</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">
                {user.plan_tier === "free" ? "Gratuito" : "Premium"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-300">Ruolo</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">
                {user.role}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-300">Email</p>
              <p className="mt-0.5 text-sm font-semibold">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Widget grid */}
      <section
        aria-label="Pannello di controllo"
        className={`grid gap-6 ${
          user.plan_tier === "free"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        <ResumeLearningCard />
        <QuizSnapshotCard />
        {/* Upsell: only visible on free plan */}
        {user.plan_tier === "free" && <UpsellCard />}
      </section>
    </div>
  );
}
