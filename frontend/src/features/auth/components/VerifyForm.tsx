"use client";

/**
 * features/auth/components/VerifyForm.tsx
 *
 * The OTP verification form component.
 *
 * Features:
 *  - 6 individual digit input boxes with auto-focus-next behaviour
 *  - Auto-submits when the 6th digit is entered
 *  - 10-minute countdown timer (matches server-side TTL)
 *  - "Resend Code" button with 60-second client-side cooldown
 *  - Error states: wrong code, expired, brute-force lockout (429)
 *  - Success state: spinner + redirect handled by useAuth().verify()
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VerifyFormProps {
  /** The email address of the account being verified. */
  email: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerifyForm({ email }: VerifyFormProps) {
  const { verify, resendCode, isLoading, error, clearError } = useAuth();

  // 6 individual digit boxes
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // 10-minute countdown (600 seconds, matching OTP_EXPIRE_MINUTES)
  const [timeLeft, setTimeLeft] = useState(600);

  // 60-second resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Auto-submit when all 6 digits are filled
  const handleSubmit = useCallback(
    async (code: string) => {
      clearError();
      await verify({ email, code });
    },
    [email, verify, clearError]
  );

  // Single digit input change
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1); // Only last digit, digits only
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  // Keyboard navigation: backspace moves to previous box
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste support: paste 6 digits at once
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] ?? "";
    }
    setDigits(newDigits);
    // Focus the last filled box
    const lastFilledIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    if (newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearError();
    setResendMessage(null);
    await resendCode({ email });
    setResendCooldown(60);
    setTimeLeft(600); // Reset countdown to new 10-minute window
    setDigits(Array(6).fill(""));
    setResendMessage("Nuovo codice inviato! Controlla la tua email.");
    inputRefs.current[0]?.focus();
  };

  const isExpired = timeLeft <= 0;
  const code = digits.join("");
  const isComplete = code.length === 6;

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Verifica il tuo account
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Inserisci il codice a 6 cifre inviato a
        </p>
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
          {email}
        </p>
      </div>

      {/* Countdown timer */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            ${isExpired
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : timeLeft < 120
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isExpired ? "Codice scaduto" : `Codice valido per ${formatCountdown(timeLeft)}`}
        </div>
      </div>

      {/* OTP digit inputs */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            id={`otp-digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={isLoading || isExpired}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Cifra ${i + 1} del codice di verifica`}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-lg border-2
              transition-all duration-150 outline-none
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              dark:bg-zinc-800 dark:text-zinc-50
              ${digit
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                : "border-zinc-300 dark:border-zinc-600"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
              ${isExpired ? "opacity-50 cursor-not-allowed bg-zinc-50" : ""}
            `}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Resend success message */}
      {resendMessage && !error && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400 text-center">
          {resendMessage}
        </div>
      )}

      {/* Manual submit (also auto-submits on 6th digit) */}
      <button
        type="button"
        id="btn-verify-submit"
        onClick={() => isComplete && handleSubmit(code)}
        disabled={!isComplete || isLoading || isExpired}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
          ${isComplete && !isLoading && !isExpired
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
            : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500"
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Verifica in corso…
          </span>
        ) : (
          "Verifica account"
        )}
      </button>

      {/* Resend button */}
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          Non hai ricevuto il codice?
        </p>
        <button
          type="button"
          id="btn-resend-code"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className={`
            text-sm font-medium transition-colors duration-150
            ${resendCooldown > 0 || isLoading
              ? "text-zinc-400 cursor-not-allowed dark:text-zinc-600"
              : "text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2"
            }
          `}
        >
          {resendCooldown > 0
            ? `Rinvia codice (${resendCooldown}s)`
            : "Rinvia codice"}
        </button>
      </div>
    </div>
  );
}
