"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotographerSignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Starting photographer signup...", { email, fullName });
      
      // 1. Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      console.log("Signup response:", { data, error: signUpError });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw signUpError;
      }

      if (data.user) {
        console.log("User created, now creating photographer request...", data.user.id);
        
        // 2. Create photographer request
        const { error: requestError } = await supabase
          .from("photographer_requests")
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            portfolio_link: portfolioLink,
            message: message,
            status: "pending",
          });

        if (requestError) {
          console.error("Photographer request error:", requestError);
          throw requestError;
        }

        console.log("Photographer request created successfully!");
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Photographer signup failed:", err);
      setError(err.message || "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
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
                Registrierung erfolgreich!
              </h2>
            </div>
            <div className="space-y-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Deine Fotografen-Registrierung wurde erfolgreich übermittelt.
              </p>
              <p>
                Bitte überprüfe deine E-Mails, um dein Konto zu bestätigen.
                Nach der Bestätigung wird dein Antrag von unserem Admin-Team geprüft.
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                Du erhältst eine E-Mail, sobald dein Account freigeschaltet wurde.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => router.push("/signin")}
                className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Zur Anmeldung
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Als Fotograf registrieren
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Erstelle einen Fotografen-Account und verkaufe deine Sportfotos
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Vollständiger Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                E-Mail-Adresse *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="max@beispiel.de"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Passwort *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <label
                htmlFor="portfolioLink"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Portfolio-Link
              </label>
              <input
                id="portfolioLink"
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="https://mein-portfolio.de"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Optional: Link zu deinem Portfolio oder Instagram
              </p>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Nachricht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="Erzähl uns etwas über deine Erfahrung als Sportfotograf..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Wird registriert..." : "Registrierung absenden"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Bereits ein Account?{" "}
            </span>
            <Link
              href="/signin"
              className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Jetzt anmelden
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
            >
              ← Als Athlet registrieren
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


