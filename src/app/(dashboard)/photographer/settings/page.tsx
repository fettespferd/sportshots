import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountTypeSettings } from "@/components/settings/account-type-settings";
import { UsernameSettings } from "@/components/settings/username-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { StripeConnectSettings } from "@/components/settings/stripe-connect-settings";
import { GallerySettings } from "@/components/settings/gallery-settings";

export default async function PhotographerSettingsPage() {
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

  if (!profile) {
    redirect("/signin");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Einstellungen
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Verwalte deinen Account und deine Einstellungen
        </p>
      </div>

      <div className="space-y-6">
        {/* Username Settings */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <UsernameSettings profile={profile} />
        </div>

        {/* Profile Settings */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <ProfileSettings profile={profile} />
        </div>

        {/* Stripe Connect */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <StripeConnectSettings profile={profile} />
        </div>

        {/* Gallery Settings */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <GallerySettings profile={profile} />
        </div>

        {/* Team Settings (nur für Teams) */}
        {profile.account_type === "team" && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <TeamSettings profile={profile} />
          </div>
        )}

        {/* Account Type - ganz unten, wird selten geändert */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <AccountTypeSettings profile={profile} />
        </div>
      </div>
    </div>
  );
}

