"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorKey } from "@/lib/i18n/error-messages";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AGB_VERSION } from "@/app/(public)/agb/page";
import { DATENSCHUTZ_VERSION } from "@/app/(public)/datenschutz/page";

export default function SignUpPage() {
  const { t } = useLanguage();
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
  const [acceptedAGB, setAcceptedAGB] = useState(false);
  const [acceptedDatenschutz, setAcceptedDatenschutz] = useState(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Auto-generate username from full name
  const generateUsername = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[äöü]/g, (match) => ({ ä: "ae", ö: "oe", ü: "ue" }[match] || match)) // Replace umlauts
      .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
      .slice(0, 30); // Limit to 30 characters
  };

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
    setUsernameManuallyEdited(true); // Mark as manually edited
    
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

    // Validate legal consent
    if (!acceptedAGB || !acceptedDatenschutz) {
      setError("Du musst den AGB und der Datenschutzerklärung zustimmen, um dich zu registrieren.");
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

        // Store legal consent with versions
        const consentPromises = [
          supabase.from("user_legal_consents").insert({
            user_id: data.user.id,
            document_type: "agb",
            version: AGB_VERSION,
          }),
          supabase.from("user_legal_consents").insert({
            user_id: data.user.id,
            document_type: "datenschutz",
            version: DATENSCHUTZ_VERSION,
          }),
        ];

        const consentResults = await Promise.all(consentPromises);
        const consentErrors = consentResults.filter(result => result.error);
        
        if (consentErrors.length > 0) {
          console.error("Error storing legal consent:", consentErrors);
          // Don't block signup, but log the error
        }

        // Send welcome email (don't block on this)
        fetch("/api/auth/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        }).catch(err => {
          console.error("Failed to send welcome email:", err);
          // Don't block signup if email fails
        });

        setMessage(
          `Registrierung erfolgreich! 🎉 Dein ${accountType === "team" ? "Team-" : ""}Account ist sofort aktiv und bereit! 🚀 Deine öffentliche Seite: sportshots.brainmotion.ai/${username}`
        );
        // Redirect to dashboard after a delay
        setTimeout(() => router.push("/photographer/events"), 2500);
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      const errorKey = getAuthErrorKey(err);
      setError(t(errorKey));
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
              ? "Erstelle einen Team-Account für deine Surf-/Skischule oder ein anderes Team" 
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
                  <div className="text-zinc-900 dark:text-zinc-100">Surf/Ski oder anderes Team</div>
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
                onChange={(e) => {
                  const newName = e.target.value;
                  setFullName(newName);
                  
                  // Only auto-generate username if user hasn't manually edited it
                  if (!usernameManuallyEdited) {
                    const newUsername = generateUsername(newName);
                    setUsername(newUsername);
                    if (newUsername.length >= 3) {
                      checkUsernameAvailability(newUsername);
                    } else {
                      setUsernameAvailable(null);
                    }
                  }
                }}
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
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                  placeholder="Mindestens 6 Zeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? (
                    // Eye-off icon (geschlossen)
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    // Eye icon (offen)
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Legal Consent Checkboxes */}
            <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <input
                  id="accept-agb"
                  type="checkbox"
                  checked={acceptedAGB}
                  onChange={(e) => setAcceptedAGB(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
                />
                <label
                  htmlFor="accept-agb"
                  className="text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Ich akzeptiere die{" "}
                  <Link
                    href="/agb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
                  >
                    Allgemeinen Geschäftsbedingungen
                  </Link>
                  <span className="text-red-600 dark:text-red-400"> *</span>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="accept-datenschutz"
                  type="checkbox"
                  checked={acceptedDatenschutz}
                  onChange={(e) => setAcceptedDatenschutz(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
                />
                <label
                  htmlFor="accept-datenschutz"
                  className="text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Ich akzeptiere die{" "}
                  <Link
                    href="/datenschutz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
                  >
                    Datenschutzerklärung
                  </Link>
                  <span className="text-red-600 dark:text-red-400"> *</span>
                </label>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="text-red-600 dark:text-red-400">*</span> Pflichtfeld - Die Zustimmung ist erforderlich für die Registrierung
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedAGB || !acceptedDatenschutz}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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


