"use client";

/**
 * components/Navbar.tsx
 *
 * Global top navigation bar. Rendered in app/layout.tsx above all page content.
 *
 * Conditional rendering based on auth state (from useAuth):
 *  - Logged out: shows "Accedi" and "Registrati" links.
 *  - Logged in:  shows navigation links, user first name, and "Esci" button.
 *
 * This is a Client Component because it reads from the AuthContext.
 */

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
function SchoolLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 hover:opacity-80 transition-opacity"
      aria-label="Scuola Guida — vai alla home"
    >
      {/* Steering wheel icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-indigo-600 dark:text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3a9 9 0 100 18A9 9 0 0012 3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v4M12 17v4M3 12h4m10 0h4M6.34 6.34l2.83 2.83m5.66 5.66l2.83 2.83M17.66 6.34l-2.83 2.83M8.17 15.17l-2.83 2.83"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
      <span className="tracking-tight">Scuola Guida</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
export function Navbar() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 transition-shadow ${isScrolled ? "shadow-sm" : ""}`}>
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Navigazione principale"
      >
        {/* Left: Logo */}
        <SchoolLogo />

        {/* Center: Nav links — only shown when logged in */}
        {user && (
          <ul className="hidden items-center gap-6 sm:flex" role="list">
            <li>
              <Link
                href="/lessons"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Lezioni
              </Link>
            </li>
            <li>
              <Link
                href="/quizzes"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Quiz
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Dashboard
              </Link>
            </li>
          </ul>
        )}

        {/* Right: Auth actions */}
        <div className="flex items-center gap-3">
          {user ? (
            // Logged in: display name badge + logout button
            <>
              <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:block">
                {user.first_name}
              </span>
              {/* Plan tier badge */}
              {user.plan_tier !== "free" && (
                <span className="hidden rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 sm:block">
                  Premium
                </span>
              )}
              <button
                id="navbar-logout"
                onClick={logout}
                className="rounded-lg border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Esci
              </button>
            </>
          ) : (
            // Logged out: login + signup links
            <>
              <Link
                id="navbar-login"
                href="/login"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Accedi
              </Link>
              <Link
                id="navbar-signup"
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Registrati
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
