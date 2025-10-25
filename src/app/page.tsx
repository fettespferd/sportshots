import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { RecentEvents } from "@/components/home/recent-events";

export default async function Home() {
  const supabase = await createClient();

  // Get recent published events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Hero />
      <Features />
      <RecentEvents events={events || []} />
    </div>
  );
}
