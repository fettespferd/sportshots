"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "team">("individual");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Username validation
  const validateUsername = (name: string) => {
    return /^[a-z0-9-]+$/.test(name) && name.length >= 3 && name.length <= 30;
  };

  // Reserved usernames that cannot be used
  const reservedUsernames = [
    "admin", "api", "signin", "signup", "callback", "dashboard",
    "photographer", "event", "search", "checkout", "orders", "team"
  ];

  // Check username availability
  const checkUsernameAvailability = async (name: string) => {
    if (!validateUsername(name)) {
      setUsernameAvailable(false);
      return;
    }

    if (reservedUsernames.includes(name.toLowerCase())) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", name.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(data === null);
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle username input change with debouncing
  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(cleaned);
    
    if (cleaned.length >= 3) {
      checkUsernameAvailability(cleaned);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate username
    if (!validateUsername(username)) {
      setError("Benutzername muss 3-30 Zeichen lang sein und nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError("Dieser Benutzername ist bereits vergeben oder reserviert.");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting signup process...", { email, username, accountType });
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase(),
            account_type: accountType,
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
        console.log("User created successfully:", data.user.id);
        
        // Update profile with username and account_type
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            username: username.toLowerCase(),
            account_type: accountType,
          })
          .eq("id", data.user.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        }

        setMessage(
          `Registrierung erfolgreich! 🎉 Dein ${accountType === "team" ? "Team-" : ""}Account ist sofort aktiv! Deine öffentliche Seite: sportshots.brainmotion.ai/${username}`
        );
        // Redirect to dashboard after a delay
        setTimeout(() => router.push("/photographer/events"), 3000);
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {accountType === "team" ? "Team-Account registrieren" : "Als Fotograf registrieren"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {accountType === "team" 
              ? "Erstelle einen Team-Account für deine Surf-/Skischule" 
              : "Erstelle einen Account und verkaufe deine Sportfotos"}
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {message}
            </div>
          )}

          <div className="space-y-4 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Account-Typ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("individual")}
                  className={`p-3 rounded-md border-2 transition-all text-sm font-medium ${
                    accountType === "individual"
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-700"
                      : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
                  }`}
                >
                  <div className="text-2xl mb-1">📸</div>
                  <div className="text-zinc-900 dark:text-zinc-100">Einzelner Fotograf</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("team")}
                  className={`p-3 rounded-md border-2 transition-all text-sm font-medium ${
                    accountType === "team"
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-700"
                      : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
                  }`}
                >
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="text-zinc-900 dark:text-zinc-100">Surf-/Skischule</div>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {accountType === "team" ? "Team-Name" : "Vollständiger Name"}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder={accountType === "team" ? "Surf Academy Mallorca" : "Max Mustermann"}
              />
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Benutzername (öffentliche URL)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800">
                  sportshots.brainmotion.ai/
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  className="block w-full rounded-none rounded-r-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                  placeholder="surf-academy-mallorca"
                />
              </div>
              {/* Username validation feedback */}
              {username.length > 0 && (
                <div className="mt-1 text-xs">
                  {checkingUsername ? (
                    <span className="text-zinc-500">Prüfe Verfügbarkeit...</span>
                  ) : usernameAvailable === true ? (
                    <span className="text-green-600 dark:text-green-400">✓ Verfügbar</span>
                  ) : usernameAvailable === false ? (
                    <span className="text-red-600 dark:text-red-400">✗ Bereits vergeben oder reserviert</span>
                  ) : username.length < 3 ? (
                    <span className="text-zinc-500">Mindestens 3 Zeichen</span>
                  ) : null}
                </div>
              )}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Nur Kleinbuchstaben, Zahlen und Bindestriche. 3-30 Zeichen.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                E-Mail-Adresse
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
                Passwort
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Wird registriert..." : "Registrieren"}
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
        </form>
      </div>
    </div>
  );
}


