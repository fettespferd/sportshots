import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/home/hero";
import dynamic from "next/dynamic";

// Lazy load components that are below the fold
const Features = dynamic(() => import("@/components/home/features").then(mod => ({ default: mod.Features })), {
  loading: () => <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" />,
});

const RecentEvents = dynamic(() => import("@/components/home/recent-events").then(mod => ({ default: mod.RecentEvents })), {
  loading: () => <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" />,
});

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
