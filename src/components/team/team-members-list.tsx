"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export function TeamMembersList({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadMembers();
  }, [teamId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Möchtest du dieses Mitglied wirklich aus dem Team entfernen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ team_id: null })
        .eq("id", memberId);

      if (error) throw error;

      // Refresh list
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Fehler beim Entfernen des Mitglieds");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
        <div className="text-4xl">👥</div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Noch keine Team-Mitglieder
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Lade Fotografen ein, um dein Team aufzubauen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-700/50"
        >
          <div className="flex items-center gap-3">
            {member.avatar_url ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src={member.avatar_url}
                  alt={member.full_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-300 text-sm font-medium text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200">
                {member.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {member.full_name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {member.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemoveMember(member.id)}
            className="rounded-md px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Entfernen
          </button>
        </div>
      ))}
    </div>
  );
}

