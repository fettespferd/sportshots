import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { ProfileQRCode } from "@/components/profile/profile-qr-code";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Load profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (profileError || !profile) {
    return notFound();
  }

  // Load events
  // If team: get all events from team members
  // If individual: get only their events
  let eventsQuery = supabase
    .from("events")
    .select("*, photos(count)")
    .eq("is_published", true)
    .order("event_date", { ascending: false });

  if (profile.account_type === "team") {
    // Get all team member IDs
    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("team_id", profile.id);

    const memberIds = [profile.id, ...(teamMembers?.map((m) => m.id) || [])];
    eventsQuery = eventsQuery.in("photographer_id", memberIds);
  } else {
    eventsQuery = eventsQuery.eq("photographer_id", profile.id);
  }

  const { data: events } = await eventsQuery;

  // Load gallery images
  const { data: galleryImages } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("photographer_id", profile.id)
    .order("display_order", { ascending: true })
    .limit(10);

  // Use first gallery image as profile picture if no avatar/logo is set
  const profileImageUrl = profile.team_logo_url || profile.avatar_url || (galleryImages && galleryImages.length > 0 ? galleryImages[0].image_url : null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Profile Header */}
      <div className="border-b bg-white dark:border-zinc-800 dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Logo/Avatar */}
            {profileImageUrl && (
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-200 dark:border-zinc-700">
                <Image
                  src={profileImageUrl}
                  alt={profile.full_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {profile.full_name}
                </h1>
                {profile.account_type === "team" && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    🏢 Team
                  </span>
                )}
              </div>

              {(profile.team_bio || profile.bio) && (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {profile.team_bio || profile.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                {profile.location && (
                  <>
                    <span>📍 {profile.location}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  📅 Mitglied seit{" "}
                  {new Date(profile.created_at).toLocaleDateString("de-DE", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Contact & Social Media Links */}
              {(profile.phone || profile.website || profile.instagram_handle || profile.facebook_url) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    >
                      📞 Anrufen
                    </a>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    >
                      🌐 Website
                    </a>
                  )}
                  {profile.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      📷 Instagram
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      👍 Facebook
                    </a>
                  )}
                </div>
              )}

              {/* Address for teams */}
              {profile.account_type === "team" && profile.address && (
                <div className="mt-4 rounded-md bg-zinc-50 p-3 dark:bg-zinc-700/50">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">📍 Adresse:</span> {profile.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {galleryImages && galleryImages.length > 0 && (
        <div className="border-b bg-white dark:border-zinc-800 dark:bg-zinc-800">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Beispielbilder
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Ein Eindruck von unserer Arbeit
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {galleryImages.map((image: any) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                >
                  <Image
                    src={image.thumbnail_url || image.image_url}
                    alt={image.caption || "Gallery"}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs text-white">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events Section - Moved to top */}
      <div className="border-b bg-white dark:border-zinc-800 dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Verfügbare Events
        </h2>

        {!events || events.length === 0 ? (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <div className="text-4xl">📸</div>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Noch keine Events verfügbar
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Schau bald wieder vorbei!
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event: any) => (
              <Link
                key={event.id}
                href={`/event/${event.slug}`}
                className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
              >
                {/* Event Cover Image */}
                {event.cover_image_url && (
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                    <Image
                      src={event.cover_image_url}
                      alt={event.title}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h3>

                  <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>
                        {new Date(event.event_date).toLocaleDateString(
                          "de-DE",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>

                    {event.photos && event.photos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span>📸</span>
                        <span>{event.photos[0].count} Fotos</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Ab {event.price_per_photo}€ pro Foto
                    </span>
                    <span className="text-sm text-blue-600 group-hover:underline dark:text-blue-400">
                      Fotos ansehen →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* QR Code Section - Moved to bottom */}
      <div className="bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProfileQRCode username={username} />
        </div>
      </div>
    </div>
  );
}

