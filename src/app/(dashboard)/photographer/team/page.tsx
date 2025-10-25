import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamMembersList } from "@/components/team/team-members-list";
import { InviteMemberForm } from "@/components/team/invite-member-form";
import { PendingInvitations } from "@/components/team/pending-invitations";

export default async function TeamManagementPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Only team accounts can access this page
  if (profile?.account_type !== "team") {
    redirect("/photographer/events");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Team-Verwaltung
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Verwalte dein Team und lade neue Mitglieder ein
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Team Members & Invitations */}
        <div className="space-y-8">
          {/* Team Members List */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Team-Mitglieder
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Alle Fotografen in deinem Team
            </p>
            <div className="mt-6">
              <TeamMembersList teamId={profile.id} />
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ausstehende Einladungen
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Einladungen, die noch nicht akzeptiert wurden
            </p>
            <div className="mt-6">
              <PendingInvitations teamId={profile.id} />
            </div>
          </div>
        </div>

        {/* Right Column: Invite Form */}
        <div>
          <div className="sticky top-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Neues Mitglied einladen
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Lade einen Fotografen per E-Mail zu deinem Team ein
            </p>
            <div className="mt-6">
              <InviteMemberForm teamId={profile.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

