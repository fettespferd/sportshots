"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  account_type: string | null;
  full_name: string;
}

export function AccountTypeSettings({ profile }: { profile: Profile }) {
  const [accountType, setAccountType] = useState(profile.account_type || "individual");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: accountType })
        .eq("id", profile.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Account-Typ erfolgreich aktualisiert! 🎉",
      });

      // Refresh to update navigation
      router.refresh();
    } catch (error: any) {
      console.error("Error updating account type:", error);
      setMessage({
        type: "error",
        text: error.message || "Fehler beim Aktualisieren",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanged = accountType !== profile.account_type;

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Account-Typ
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Wähle, ob du als einzelner Fotograf oder als Team (Surf-/Skischule) auftreten möchtest
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAccountType("individual")}
          className={`flex flex-col items-center rounded-lg border-2 p-6 transition-all ${
            accountType === "individual"
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-700"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
          }`}
        >
          <div className="text-4xl mb-3">📸</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Einzelner Fotograf
          </h3>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Verwalte deine eigenen Events individuell
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAccountType("team")}
          className={`flex flex-col items-center rounded-lg border-2 p-6 transition-all ${
            accountType === "team"
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-700"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
          }`}
        >
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Team / Schule
          </h3>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Verwalte mehrere Fotografen unter einem Team-Account
          </p>
        </button>
      </div>

      {hasChanged && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
          >
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
        </div>
      )}

      {accountType === "team" && profile.account_type !== "team" && (
        <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          ℹ️ Nach dem Wechsel zu einem Team-Account kannst du andere Fotografen einladen und
          gemeinsam Events verwalten.
        </div>
      )}
    </div>
  );
}

