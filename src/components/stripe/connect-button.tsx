"use client";

import { useState, useEffect } from "react";

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Connect onboarding
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
      alert("Fehler beim Verbinden mit Stripe");
      setLoading(false);
    }
  };

  if (status === null) {
    return (
      <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Status wird geladen...
        </p>
      </div>
    );
  }

  if (status.connected && status.charges_enabled) {
    return (
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <div className="flex items-center">
          <svg
            className="mr-2 h-5 w-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-medium text-green-900 dark:text-green-400">
            Stripe Connect aktiviert - Du kannst Zahlungen empfangen!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
      <div className="mb-4 flex items-start">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Zahlungen aktivieren
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Verbinde dein Stripe-Konto, um Zahlungen von Kunden zu empfangen.
            Die Auszahlung erfolgt automatisch.
          </p>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Wird verbunden..." : "Mit Stripe verbinden"}
      </button>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        💰 Du erhältst 85% des Verkaufspreises (15% Plattform-Gebühr)
      </p>
    </div>
  );
}

