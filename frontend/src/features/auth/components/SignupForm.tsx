"use client";

/**
 * features/auth/components/SignupForm.tsx
 *
 * Presentation component for the registration flow.
 * Responsibilities:
 *   - Render all UserCreate fields: email, first_name, last_name, password, confirm_password.
 *   - Client-side validation: passwords must match before submitting.
 *   - Delegate the API call entirely to the useAuth hook.
 *   - Display isLoading spinner and error messages from the hook.
 *   - Italian UI text (placeholder for future i18n module).
 *
 * Rules:
 *   - No fetch() calls.
 *   - No useState for auth data (only controlled-input values + local validation).
 *   - confirm_password is a UI-only field; it is NOT sent to the backend.
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
// Shared input field styles
// ---------------------------------------------------------------------------
const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-400";

const inputErrorClass =
  "block w-full rounded-lg border border-red-400 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500";

// ---------------------------------------------------------------------------
// Local form state shape
// ---------------------------------------------------------------------------
interface FormFields {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
}

// ---------------------------------------------------------------------------
// SignupForm
// ---------------------------------------------------------------------------
export function SignupForm() {
  const { signup, isLoading, error, clearError } = useAuth();

  const [fields, setFields] = useState<FormFields>({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });

  // Client-side validation error (password mismatch only; server validates the rest).
  const [localError, setLocalError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear both local and hook errors as the user types.
    if (localError) setLocalError(null);
    if (error) clearError();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side guard: passwords must match.
    if (fields.password !== fields.confirm_password) {
      setLocalError("Le password non coincidono. Ricontrolla.");
      return;
    }

    // Minimum password length guard (server also enforces this, but UX is better with early feedback).
    if (fields.password.length < 8) {
      setLocalError("La password deve contenere almeno 8 caratteri.");
      return;
    }

    // Delegate to hook — confirm_password is NOT sent to the backend.
    await signup({
      email: fields.email,
      first_name: fields.first_name,
      last_name: fields.last_name,
      password: fields.password,
    });
  }

  const displayedError = localError ?? error;

  const isFormEmpty =
    !fields.email ||
    !fields.first_name ||
    !fields.last_name ||
    !fields.password ||
    !fields.confirm_password;

  const passwordMismatch =
    fields.confirm_password.length > 0 &&
    fields.password !== fields.confirm_password;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-8 py-10 sm:px-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            {/* User-plus icon */}
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
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Crea un account
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Compila il modulo per iniziare.
          </p>
        </div>

        {/* Error banner (local validation OR hook error from backend) */}
        {displayedError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400"
          >
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
            <span>{displayedError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Modulo di registrazione">
          <div className="space-y-5">

            {/* Name row: first_name + last_name side by side on wider screens */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signup-first-name"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Nome
                </label>
                <input
                  id="signup-first-name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={fields.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Mario"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-last-name"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Cognome
                </label>
                <input
                  id="signup-last-name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={fields.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Rossi"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={fields.email}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="mario.rossi@esempio.it"
                className={inputClass}
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={fields.password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Minimo 8 caratteri"
                className={inputClass}
              />
            </div>

            {/* Confirm password field */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Conferma password
              </label>
              <input
                id="signup-confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                value={fields.confirm_password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Ripeti la password"
                className={passwordMismatch ? inputErrorClass : inputClass}
                aria-invalid={passwordMismatch}
                aria-describedby={
                  passwordMismatch ? "password-mismatch-hint" : undefined
                }
              />
              {/* Inline mismatch hint — appears before form submit */}
              {passwordMismatch && (
                <p
                  id="password-mismatch-hint"
                  className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                >
                  Le password non coincidono.
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading || isFormEmpty || passwordMismatch}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Registrazione in corso…</span>
                </>
              ) : (
                "Registrati"
              )}
            </button>
          </div>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Hai già un account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
