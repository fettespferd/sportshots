"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  bio: string | null;
  team_bio: string | null;
  account_type: string | null;
  location: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
}

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(
    profile.account_type === "team" ? profile.team_bio || "" : profile.bio || ""
  );
  const [location, setLocation] = useState(profile.location || "");
  const [address, setAddress] = useState(profile.address || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [instagramHandle, setInstagramHandle] = useState(profile.instagram_handle || "");
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const updateData: any = {
        full_name: fullName,
        location,
        address,
        phone,
        website,
        instagram_handle: instagramHandle,
        facebook_url: facebookUrl,
      };

      // Update correct bio field based on account type
      if (profile.account_type === "team") {
        updateData.team_bio = bio;
      } else {
        updateData.bio = bio;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Profil erfolgreich aktualisiert! 🎉",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Fehler beim Aktualisieren",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanged =
    fullName !== profile.full_name ||
    location !== (profile.location || "") ||
    address !== (profile.address || "") ||
    phone !== (profile.phone || "") ||
    website !== (profile.website || "") ||
    instagramHandle !== (profile.instagram_handle || "") ||
    facebookUrl !== (profile.facebook_url || "") ||
    (profile.account_type === "team"
      ? bio !== (profile.team_bio || "")
      : bio !== (profile.bio || ""));

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Profil-Informationen
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Deine öffentlichen Profilinformationen
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

      <div className="mt-6 space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {profile.account_type === "team" ? "Team-Name" : "Vollständiger Name"}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
            placeholder={
              profile.account_type === "team" ? "Surf Academy Mallorca" : "Max Mustermann"
            }
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Beschreibung
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
            placeholder={
              profile.account_type === "team"
                ? "Beschreibe deine Schule, Services und was euch besonders macht..."
                : "Beschreibe dich und deine Fotografie..."
            }
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Standort
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
            placeholder="z.B. München, Deutschland"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Stadt oder Region, in der du/dein Team tätig ist
          </p>
        </div>

        {/* Address (optional, vor allem für Teams) */}
        {profile.account_type === "team" && (
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Adresse <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="Strandweg 123, 07458 Palma de Mallorca"
            />
          </div>
        )}

        {/* Contact Section */}
        <div className="border-t pt-4 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-4">
            Kontaktinformationen
          </h3>

          {/* Phone */}
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Telefon <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="+49 123 456789"
            />
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Website <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="https://deine-website.de"
            />
          </div>
        </div>

        {/* Social Media Section */}
        <div className="border-t pt-4 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-4">
            Social Media <span className="text-zinc-400">(optional)</span>
          </h3>

          {/* Instagram */}
          <div className="mb-4">
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Instagram
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800">
                @
              </span>
              <input
                id="instagram"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value.replace("@", ""))}
                className="block w-full rounded-none rounded-r-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="deinusername"
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <label
              htmlFor="facebook"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Facebook Seite
            </label>
            <input
              id="facebook"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="https://facebook.com/deine-seite"
            />
          </div>
        </div>
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
    </div>
  );
}

