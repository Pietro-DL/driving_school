"use client";

/**
 * features/auth/components/LoginForm.tsx
 *
 * Presentation component for the login flow.
 * Responsibilities:
 *   - Render email + password inputs and a submit button.
 *   - Delegate all state and async logic to the useAuth hook.
 *   - Display isLoading spinner and error messages from the hook.
 *   - Italian UI text (placeholder for future i18n module).
 *
 * Rules:
 *   - No fetch() calls.
 *   - No useState for auth data (only controlled-input values).
 *   - No direct import of api/auth.api.ts.
 */

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Spinner — inline SVG, no external dependency
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
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
  );
}

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------
export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();

  // Controlled inputs — local UI state only; no auth logic here.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (error) clearError(); // Clear stale error as user types.
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (error) clearError();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-8 py-10 sm:px-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            {/* Lock icon */}
            <svg
              className="h-7 w-7 text-indigo-600 dark:text-indigo-400"
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
                d="M16.5 10.5V7.875A4.875 4.875 0 007.5 7.875V10.5m-2.25 0h13.5A1.5 1.5 0 0120.25 12v7.5A1.5 1.5 0 0118.75 21H5.25A1.5 1.5 0 013.75 19.5V12a1.5 1.5 0 011.5-1.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Accedi al tuo account
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Bentornato. Inserisci le tue credenziali.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400"
          >
            {/* Warning icon */}
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Modulo di accesso">
          <div className="space-y-5">

            {/* Email field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                placeholder="nome@esempio.it"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-400"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                {/* Placeholder — password reset page is a future feature */}
                <span className="text-xs text-indigo-600 dark:text-indigo-400 cursor-default select-none">
                  Password dimenticata?
                </span>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-400"
              />
            </div>

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Accesso in corso…</span>
                </>
              ) : (
                "Accedi"
              )}
            </button>
          </div>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Non hai un account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
