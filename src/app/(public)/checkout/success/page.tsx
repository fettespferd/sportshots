"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    let attemptCount = 0;
    let intervalId: NodeJS.Timeout;

    // Poll for purchase completion
    const checkPurchase = async () => {
      try {
        console.log(`Checking purchase... Attempt ${attemptCount + 1}/4`);
        const response = await fetch(`/api/downloads/${sessionId}`);
        
        if (response.ok) {
          // Purchase found, redirect to downloads
          console.log("✅ Purchase found, redirecting to downloads");
          clearInterval(intervalId);
          setChecking(false);
          setLoading(false);
          setTimeout(() => {
            router.push(`/downloads/${sessionId}`);
          }, 1000);
          return;
        }
        
        attemptCount++;
        setAttempts(attemptCount);
        
        if (attemptCount >= 4) {
          // After 4 attempts (8 seconds), try to create purchase manually (fallback)
          clearInterval(intervalId);
          console.log("⚠️ Webhook didn't fire, creating purchase manually...");
          
          try {
            const createResponse = await fetch("/api/checkout/create-purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });

            if (createResponse.ok) {
              console.log("✅ Purchase created manually");
              setChecking(false);
              setLoading(false);
              setTimeout(() => {
                router.push(`/downloads/${sessionId}`);
              }, 1000);
            } else {
              const errorData = await createResponse.json();
              console.error("❌ Failed to create purchase manually:", errorData);
              setChecking(false);
              setLoading(false);
            }
          } catch (createError) {
            console.error("❌ Error creating purchase manually:", createError);
            setChecking(false);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking purchase:", error);
        attemptCount++;
        setAttempts(attemptCount);
        
        if (attemptCount >= 4) {
          // After 4 failed attempts, try to create purchase manually (fallback)
          clearInterval(intervalId);
          console.log("⚠️ Webhook didn't fire, creating purchase manually...");
          
          try {
            const createResponse = await fetch("/api/checkout/create-purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });

            if (createResponse.ok) {
              console.log("✅ Purchase created manually");
              setChecking(false);
              setLoading(false);
              setTimeout(() => {
                router.push(`/downloads/${sessionId}`);
              }, 1000);
            } else {
              const errorData = await createResponse.json();
              console.error("❌ Failed to create purchase manually:", errorData);
              setChecking(false);
              setLoading(false);
            }
          } catch (createError) {
            console.error("❌ Error creating purchase manually:", createError);
            setChecking(false);
            setLoading(false);
          }
        }
      }
    };

    // Start checking after 2 seconds (give webhook time to process)
    setTimeout(() => {
      checkPurchase(); // First check immediately
      intervalId = setInterval(checkPurchase, 2000); // Then every 2 seconds
    }, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, router]);

  if (checking || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {checking ? "Bestellung wird verarbeitet..." : "Lädt..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
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
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Zahlung erfolgreich!
            </h2>
          </div>

          <div className="space-y-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Deine Zahlung wurde erfolgreich abgeschlossen. Du wirst in Kürze zu deinen Downloads weitergeleitet.
            </p>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Eine Bestätigungs-E-Mail wurde an dich gesendet.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {sessionId && (
              <Link
                href={`/downloads/${sessionId}`}
                className="block w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Zu meinen Downloads
              </Link>
            )}
            <Link
              href="/orders"
              className="block w-full rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Zu meinen Bestellungen
            </Link>
            <Link
              href="/search"
              className="block w-full rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Weitere Events entdecken
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

