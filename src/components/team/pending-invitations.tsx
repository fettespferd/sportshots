"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Invitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
}

export function PendingInvitations({ teamId }: { teamId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadInvitations();
  }, [teamId]);

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Möchtest du diese Einladung wirklich zurückziehen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      // Refresh list
      loadInvitations();
    } catch (error) {
      console.error("Error canceling invitation:", error);
      alert("Fehler beim Löschen der Einladung");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
        <div className="text-4xl">✉️</div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Keine ausstehenden Einladungen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-700/50"
        >
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {invitation.invited_email}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Gesendet am{" "}
              {new Date(invitation.created_at).toLocaleDateString("de-DE")}
            </p>
          </div>
          <button
            onClick={() => handleCancelInvitation(invitation.id)}
            className="rounded-md px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Zurückziehen
          </button>
        </div>
      ))}
    </div>
  );
}

