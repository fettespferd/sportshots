"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Profile {
  id: string;
  username: string | null;
  full_name: string;
}

export function UsernameSettings({ profile }: { profile: Profile }) {
  const [username, setUsername] = useState(profile.username || "");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  const validateUsername = (name: string) => {
    return /^[a-z0-9-]+$/.test(name) && name.length >= 3 && name.length <= 30;
  };

  const reservedUsernames = [
    "admin", "api", "signin", "signup", "callback", "dashboard",
    "photographer", "event", "search", "checkout", "orders", "team", "settings"
  ];

  const checkAvailability = async (name: string) => {
    if (!validateUsername(name)) {
      setAvailable(false);
      return;
    }

    if (reservedUsernames.includes(name.toLowerCase())) {
      setAvailable(false);
      return;
    }

    // If it's the current username, it's available
    if (name.toLowerCase() === profile.username?.toLowerCase()) {
      setAvailable(true);
      return;
    }

    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", name.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      setAvailable(data === null);
    } catch (err) {
      console.error("Error checking username:", err);
      setAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(cleaned);
    
    if (cleaned.length >= 3) {
      checkAvailability(cleaned);
    } else {
      setAvailable(null);
    }
  };

  const handleSave = async () => {
    if (!validateUsername(username)) {
      setMessage({
        type: "error",
        text: "Benutzername muss 3-30 Zeichen lang sein und nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
      });
      return;
    }

    if (available === false) {
      setMessage({
        type: "error",
        text: "Dieser Benutzername ist bereits vergeben oder reserviert.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.toLowerCase() })
        .eq("id", profile.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Benutzername erfolgreich aktualisiert! 🎉",
      });
    } catch (error: any) {
      console.error("Error updating username:", error);
      setMessage({
        type: "error",
        text: error.message || "Fehler beim Aktualisieren",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanged = username !== profile.username;
  const profileUrl = username ? `https://sportshots.brainmotion.ai/${username}` : null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Öffentliche URL
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Dein eindeutiger Benutzername für deine öffentliche Profilseite
      </p>

      {message && (
        <div
          className={`mt-4 rounded-md p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Benutzername
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
            className="block w-full rounded-none rounded-r-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
            placeholder="dein-username"
          />
        </div>
        
        {/* Validation feedback */}
        {username.length > 0 && (
          <div className="mt-1 text-xs">
            {checkingAvailability ? (
              <span className="text-zinc-500">Prüfe Verfügbarkeit...</span>
            ) : available === true ? (
              <span className="text-green-600 dark:text-green-400">✓ Verfügbar</span>
            ) : available === false ? (
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

      {profileUrl && (
        <div className="mt-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-700/50">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Deine öffentliche Seite:
          </p>
          <Link
            href={`/${username}`}
            target="_blank"
            className="mt-1 block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {profileUrl}
          </Link>
        </div>
      )}

      {hasChanged && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={loading || available === false}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
          >
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
        </div>
      )}
    </div>
  );
}

