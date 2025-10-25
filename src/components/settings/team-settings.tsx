"use client";

import { TeamMembersList } from "@/components/team/team-members-list";
import { InviteMemberForm } from "@/components/team/invite-member-form";
import { PendingInvitations } from "@/components/team/pending-invitations";

interface Profile {
  id: string;
  account_type: string | null;
}

export function TeamSettings({ profile }: { profile: Profile }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Team-Verwaltung
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Verwalte dein Team und lade neue Mitglieder ein
      </p>

      <div className="mt-6 space-y-8">
        {/* Team Members */}
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Team-Mitglieder
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Alle Fotografen in deinem Team
          </p>
          <div className="mt-4">
            <TeamMembersList teamId={profile.id} />
          </div>
        </div>

        {/* Invite Form */}
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Neues Mitglied einladen
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Lade einen Fotografen per E-Mail zu deinem Team ein
          </p>
          <div className="mt-4">
            <InviteMemberForm teamId={profile.id} />
          </div>
        </div>

        {/* Pending Invitations */}
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Ausstehende Einladungen
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Einladungen, die noch nicht akzeptiert wurden
          </p>
          <div className="mt-4">
            <PendingInvitations teamId={profile.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

